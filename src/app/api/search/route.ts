import { createAdminClient } from "@/lib/appwrite";
import { DB_ID, COLLECTIONS, type MemoryDoc, type AppwriteDoc } from "@/lib/db";
import { generateEmbedding } from "@/lib/embeddings";
import { topKBySimilarity } from "@/lib/vectorSearch";
import { SearchSchema } from "@/lib/validators";
import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { resolveAuth, scopeAllows, forbiddenScope } from "@/lib/apiAuth";
import { checkFeatureAccess, upgradeRequiredResponse } from "@/lib/planLimits";
import { Query } from "node-appwrite";

const MAX_CANDIDATES = 1000;

export async function POST(req: Request) {
  const resolved = await resolveAuth(req);
  if (!resolved) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  if (!scopeAllows(resolved.scope, "read")) return forbiddenScope();
  const { userId: appwriteId } = resolved;

  const { databases } = createAdminClient();
  const featureAccess = await checkFeatureAccess(databases, appwriteId);
  if (!featureAccess.allowed) return upgradeRequiredResponse();

  const rateCheck = checkRateLimit(`search:${appwriteId}`, 30, 60_000);
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
    console.error("[search] embedding failed:", err);
    return new Response(JSON.stringify({ error: "Search unavailable. Please try again." }), { status: 503 });
  }

  try {
    const filters = [
      Query.equal("userId", appwriteId),
      Query.equal("isArchived", false),
      Query.limit(MAX_CANDIDATES),
    ];
    if (category) filters.push(Query.equal("category", category));
    // Namespace scoping for external API callers — only search this namespace
    // when one is given; otherwise search the whole memory (backward compatible).
    if (namespace) filters.push(Query.equal("namespace", namespace));

    const result = await databases.listDocuments(DB_ID, COLLECTIONS.MEMORIES, filters);
    const memories = result.documents as unknown as AppwriteDoc<MemoryDoc>[];

    const relevant = topKBySimilarity(queryVector, memories, topK, minScore);
    const results = relevant.map(({ score, ...memory }) => ({ memory, score }));

    return Response.json({ results });
  } catch (err) {
    console.error("[search] vector search failed:", err);
    return new Response(JSON.stringify({ error: "Search unavailable. Please try again." }), { status: 503 });
  }
}
