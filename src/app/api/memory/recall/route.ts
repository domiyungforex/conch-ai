import { createAdminClient } from "@/lib/appwrite";
import { DB_ID, COLLECTIONS, type MemoryDoc, type AppwriteDoc } from "@/lib/db";
import { generateEmbedding } from "@/lib/embeddings";
import { topKBySimilarity, cosineSimilarity } from "@/lib/vectorSearch";
import { injectMemoryContext } from "@/lib/memory";
import { SearchSchema } from "@/lib/validators";
import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { resolveAuth, scopeAllows, forbiddenScope } from "@/lib/apiAuth";
import { checkFeatureAccess, upgradeRequiredResponse } from "@/lib/planLimits";
import { Query } from "node-appwrite";

const MAX_CANDIDATES = 1000;

// Like POST /api/search, but aimed at AI applications consuming the result:
// returns the scored memories together with a ready-to-inject context block
// (the same one the built-in chat uses), so an external model can be handed
// the user's relevant memory without the caller having to format it.
// Retrieving memories this way also bumps their accessCount/lastAccessed,
// matching what happens during a chat retrieval.
export async function POST(req: Request) {
  const resolved = await resolveAuth(req);
  if (!resolved) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  if (!scopeAllows(resolved.scope, "read")) return forbiddenScope();
  const { userId: appwriteId } = resolved;

  const { databases } = createAdminClient();
  const featureAccess = await checkFeatureAccess(databases, appwriteId);
  if (!featureAccess.allowed) return upgradeRequiredResponse();

  const rateCheck = checkRateLimit(`recall:${appwriteId}`, 30, 60_000);
  if (!rateCheck.success) return rateLimitResponse(rateCheck.resetAt);

  const parsed = SearchSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: "Invalid request", details: parsed.error.flatten() }), { status: 400 });
  }

  const { query, topK, category, minScore, namespace } = parsed.data;

  let queryVector: number[];
  try {
    queryVector = await generateEmbedding(query);
  } catch (err) {
    console.error("[recall] embedding failed:", err);
    return new Response(JSON.stringify({ error: "Recall unavailable. Please try again." }), { status: 503 });
  }

  try {
    const filters = [
      Query.equal("userId", appwriteId),
      Query.equal("isArchived", false),
      Query.limit(MAX_CANDIDATES),
    ];
    if (category) filters.push(Query.equal("category", category));
    // Namespace scoping for external API callers — only recall within this
    // namespace when one is given; otherwise recall across the whole memory.
    if (namespace) filters.push(Query.equal("namespace", namespace));

    const result = await databases.listDocuments(DB_ID, COLLECTIONS.MEMORIES, filters);
    const memories = result.documents as unknown as AppwriteDoc<MemoryDoc>[];

    const relevant = topKBySimilarity(queryVector, memories, topK, minScore);
    if (relevant.length === 0) {
      return Response.json({ results: [], context: "" });
    }

    // Relationship expansion: pull memories directly linked to the top matches
    // so related context isn't treated as isolated chunks. Deduped against the
    // primary results; scored by their own similarity to the query.
    type ExpandedMemory = AppwriteDoc<MemoryDoc> & { score: number; related?: boolean };
    const expanded: ExpandedMemory[] = [...relevant];
    const primaryIds = new Set(relevant.map((m) => m.$id));
    const linkedIds = [...new Set(relevant.flatMap((m) => m.relatedMemoryIds ?? []))].filter((id) => !primaryIds.has(id)).slice(0, 10);
    if (linkedIds.length > 0) {
      const linkedDocs = await databases.listDocuments(DB_ID, COLLECTIONS.MEMORIES, [
        Query.equal("$id", linkedIds),
        Query.equal("userId", appwriteId),
        Query.limit(linkedIds.length),
      ]);
      for (const doc of linkedDocs.documents as unknown as AppwriteDoc<MemoryDoc>[]) {
        const score = cosineSimilarity(queryVector, doc.embedding ?? []);
        if (score >= minScore) {
          expanded.push({ ...(doc as unknown as AppwriteDoc<MemoryDoc>), score, related: true });
        }
      }
    }

    const now = new Date().toISOString();
    await Promise.all(
      expanded.map((m) =>
        databases.updateDocument(DB_ID, COLLECTIONS.MEMORIES, m.$id, {
          accessCount: m.accessCount + 1,
          lastAccessed: now,
        })
      )
    );

    const results = expanded.map(({ score, related, ...memory }) => ({
      memory,
      score,
      ...(related ? { related: true } : {}),
    }));
    return Response.json({ results, context: injectMemoryContext(expanded) });
  } catch (err) {
    console.error("[recall] vector search failed:", err);
    return new Response(JSON.stringify({ error: "Recall unavailable. Please try again." }), { status: 503 });
  }
}
