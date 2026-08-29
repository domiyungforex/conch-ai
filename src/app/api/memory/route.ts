import { createAdminClient } from "@/lib/appwrite";
import { DB_ID, COLLECTIONS, type MemoryDoc, type ReputationDoc, type AppwriteDoc } from "@/lib/db";
import { generateEmbedding } from "@/lib/embeddings";
import { topKBySimilarity } from "@/lib/vectorSearch";
import { backlinkMemory, linkMemories } from "@/lib/memory";
import { MemoryCreateSchema } from "@/lib/validators";
import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { resolveAuth, scopeAllows, forbiddenScope } from "@/lib/apiAuth";
import { logAudit } from "@/lib/audit";
import { checkMemoryQuota, upgradeHint, checkFeatureAccess, upgradeRequiredResponse } from "@/lib/planLimits";
import { withApiTracking } from "@/lib/apiUsage";
import { Query, ID, Permission, Role } from "node-appwrite";

export const GET = withApiTracking(async (req: Request) => {
  const resolved = await resolveAuth(req);
  if (!resolved) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  if (!scopeAllows(resolved.scope, "read")) return forbiddenScope();
  const { userId: appwriteId } = resolved;

  const { databases } = createAdminClient();

  const featureAccess = await checkFeatureAccess(databases, appwriteId);
  if (!featureAccess.allowed) return upgradeRequiredResponse();

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") ?? undefined;
  const namespace = searchParams.get("namespace") ?? undefined;
  const archived = searchParams.get("archived") === "true";
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10), 100);
  const offset = (page - 1) * limit;

  const filters = [
    Query.equal("userId", appwriteId),
    Query.equal("isArchived", archived),
    Query.orderDesc("$createdAt"),
    Query.limit(limit),
    Query.offset(offset),
  ];
  if (category) filters.push(Query.equal("category", category));
  // Only filter when explicitly requested — memories written before the
  // namespace attribute existed carry no value here, so omitting the param
  // keeps listing the whole memory (backward compatible).
  if (namespace) filters.push(Query.equal("namespace", namespace));

  const result = await databases.listDocuments(DB_ID, COLLECTIONS.MEMORIES, filters);
  const memories = result.documents as unknown as AppwriteDoc<MemoryDoc>[];

  // Batch-resolve relationship links so the UI can render them without an
  // extra round trip per card. One extra query for the whole page.
  const memoriesWithRelated = await attachRelatedSnippets(databases, appwriteId, memories);

  return Response.json({ memories: memoriesWithRelated, total: result.total, page, limit });
});

async function attachRelatedSnippets(
  databases: ReturnType<typeof createAdminClient>["databases"],
  userId: string,
  memories: AppwriteDoc<MemoryDoc>[]
): Promise<Array<AppwriteDoc<MemoryDoc> & { relatedSnippets?: { $id: string; content: string }[] }>> {
  const allIds = [...new Set(memories.flatMap((m) => m.relatedMemoryIds ?? []))].slice(0, 100);
  if (allIds.length === 0) return memories as typeof memories;

  try {
    const result = await databases.listDocuments(DB_ID, COLLECTIONS.MEMORIES, [
      Query.equal("$id", allIds),
      Query.equal("userId", userId),
      Query.limit(allIds.length),
    ]);
    const byId = new Map((result.documents as unknown as AppwriteDoc<MemoryDoc>[]).map((d) => [d.$id, d]));
    return memories.map((m) => {
      const snippets = (m.relatedMemoryIds ?? [])
        .map((id) => byId.get(id))
        .filter((d): d is AppwriteDoc<MemoryDoc> => Boolean(d))
        .map((d) => ({ $id: d.$id, content: d.content.slice(0, 80) }));
      return snippets.length > 0 ? { ...m, relatedSnippets: snippets } : m;
    });
  } catch {
    return memories as typeof memories;
  }
}

export const POST = withApiTracking(async (req: Request) => {
  const resolved = await resolveAuth(req);
  if (!resolved) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  if (!scopeAllows(resolved.scope, "write")) return forbiddenScope();
  const { userId: appwriteId } = resolved;

  const { databases } = createAdminClient();

  const featureAccess = await checkFeatureAccess(databases, appwriteId);
  if (!featureAccess.allowed) return upgradeRequiredResponse();

  const rateCheck = checkRateLimit(`memory:create:${appwriteId}`, 20, 60_000);
  if (!rateCheck.success) return rateLimitResponse(rateCheck.resetAt);

  const parsed = MemoryCreateSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: "Invalid request", details: parsed.error.flatten() }), { status: 400 });
  }

  const quota = await checkMemoryQuota(databases, appwriteId);
  if (!quota.allowed) {
    return new Response(JSON.stringify({
      error: `Your plan is limited to ${quota.limit} memories. ${upgradeHint(quota.plan)} for more.`,
      code: "QUOTA_EXCEEDED",
    }), { status: 403 });
  }

  const memId = ID.unique();

  let embedding: number[] = [];
  try {
    embedding = await generateEmbedding(parsed.data.content);
  } catch {
    // Memory saved even if embedding generation fails
  }

  const memory = await databases.createDocument(DB_ID, COLLECTIONS.MEMORIES, memId, {
    userId: appwriteId,
    embedding,
    isArchived: false,
    accessCount: 0,
    lastAccessed: null,
    ...parsed.data,
  }, [
    Permission.read(Role.user(appwriteId)),
    Permission.update(Role.user(appwriteId)),
    Permission.delete(Role.user(appwriteId)),
  ]) as unknown as AppwriteDoc<MemoryDoc>;

  // Relationship creation:
  // - Explicit links: the source's own list was set by the payload above; back-link
  //   each target so the relationship is bidirectional (same behavior as auto-links).
  // - No links specified: auto-link to the most semantically similar existing memory
  //   so related context is connected rather than isolated.
  // Non-fatal either way — never blocks the save.
  if (parsed.data.relatedMemoryIds && parsed.data.relatedMemoryIds.length > 0) {
    try {
      await Promise.all(
        parsed.data.relatedMemoryIds.map((tid) => backlinkMemory(databases, memId, tid, appwriteId))
      );
    } catch {
      // Relationship maintenance must never break the save.
    }
  } else if (embedding.length > 0) {
    try {
      const candidates = await databases.listDocuments(DB_ID, COLLECTIONS.MEMORIES, [
        Query.equal("userId", appwriteId),
        Query.equal("isArchived", false),
        Query.limit(1000),
      ]);
      const others = (candidates.documents as unknown as AppwriteDoc<MemoryDoc>[]).filter((d) => d.$id !== memId);
      const best = topKBySimilarity(embedding, others, 1, 0.72)[0];
      if (best) await linkMemories(databases, memId, best.$id);
    } catch {
      // Relationship maintenance must never break the save.
    }
  }

  try {
    const repResult = await databases.listDocuments(DB_ID, COLLECTIONS.REPUTATIONS, [
      Query.equal("userId", appwriteId), Query.limit(1),
    ]);
    if (repResult.documents.length > 0) {
      const rep = repResult.documents[0] as unknown as AppwriteDoc<ReputationDoc>;
      await databases.updateDocument(DB_ID, COLLECTIONS.REPUTATIONS, rep.$id, {
        memoryCount: rep.memoryCount + 1,
      });
    }
  } catch {
    // Non-critical
  }

  if (resolved.viaApiKey) {
    await logAudit(appwriteId, "memory.created", memId, { via: "api_key", namespace: parsed.data.namespace });
  }

  return Response.json({ memory }, { status: 201 });
});
