import { createAdminClient } from "@/lib/appwrite";
import { DB_ID, COLLECTIONS, type MemoryDoc, type ReputationDoc, type AppwriteDoc } from "@/lib/db";
import { generateEmbedding } from "@/lib/embeddings";
import { MemoryUpdateSchema } from "@/lib/validators";
import { resolveAuth, scopeAllows, forbiddenScope } from "@/lib/apiAuth";
import { logAudit } from "@/lib/audit";
import { backlinkMemory, getRelatedMemories, unbacklinkMemory } from "@/lib/memory";
import { checkFeatureAccess, upgradeRequiredResponse } from "@/lib/planLimits";
import { Query, Permission, Role } from "node-appwrite";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolved = await resolveAuth(req);
  if (!resolved) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  if (!scopeAllows(resolved.scope, "read")) return forbiddenScope();
  const { userId: appwriteId } = resolved;

  const { id } = await params;
  const { databases } = createAdminClient();

  const featureAccess = await checkFeatureAccess(databases, appwriteId);
  if (!featureAccess.allowed) return upgradeRequiredResponse();

  let memory: AppwriteDoc<MemoryDoc>;
  try {
    memory = await databases.getDocument(DB_ID, COLLECTIONS.MEMORIES, id) as unknown as AppwriteDoc<MemoryDoc>;
  } catch {
    return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
  }

  if (memory.userId !== appwriteId) return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });

  // Relationship layer: resolve linked memories alongside the requested one.
  const related = await getRelatedMemories(databases, appwriteId, id);

  return Response.json({ memory, related });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolved = await resolveAuth(req);
  if (!resolved) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  if (!scopeAllows(resolved.scope, "write")) return forbiddenScope();
  const { userId: appwriteId } = resolved;

  const { id } = await params;
  const { databases } = createAdminClient();

  const featureAccess = await checkFeatureAccess(databases, appwriteId);
  if (!featureAccess.allowed) return upgradeRequiredResponse();

  let existing: AppwriteDoc<MemoryDoc>;
  try {
    existing = await databases.getDocument(DB_ID, COLLECTIONS.MEMORIES, id) as unknown as AppwriteDoc<MemoryDoc>;
  } catch {
    return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
  }

  if (existing.userId !== appwriteId) return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });

  const parsed = MemoryUpdateSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: "Invalid request", details: parsed.error.flatten() }), { status: 400 });
  }

  const ownerPermissions = [
    Permission.read(Role.user(appwriteId)),
    Permission.update(Role.user(appwriteId)),
    Permission.delete(Role.user(appwriteId)),
  ];

  // Also (re-)grants owner permissions on documents created before live sync
  // shipped, so an edited pre-existing memory becomes realtime-eligible
  // without a separate backfill.
  let memory = await databases.updateDocument(DB_ID, COLLECTIONS.MEMORIES, id, parsed.data, ownerPermissions) as unknown as AppwriteDoc<MemoryDoc>;

  // Relationship updates are bidirectional: back-link any newly added targets
  // and strip the stale back-link from targets that were unlinked. Non-fatal —
  // relationship maintenance never blocks the update.
  if (parsed.data.relatedMemoryIds) {
    const prev = existing.relatedMemoryIds ?? [];
    const next = parsed.data.relatedMemoryIds;
    const added = next.filter((tid) => !prev.includes(tid));
    const removed = prev.filter((tid) => !next.includes(tid));
    try {
      await Promise.all([
        ...added.map((tid) => backlinkMemory(databases, id, tid, appwriteId)),
        ...removed.map((tid) => unbacklinkMemory(databases, id, tid, appwriteId)),
      ]);
    } catch {
      // Relationship maintenance must never break the update.
    }
  }

  if (parsed.data.content && parsed.data.content !== existing.content) {
    try {
      const embedding = await generateEmbedding(memory.content);
      memory = await databases.updateDocument(DB_ID, COLLECTIONS.MEMORIES, id, { embedding }, ownerPermissions) as unknown as AppwriteDoc<MemoryDoc>;
    } catch {
      // Continue even if embedding update fails
    }
  }

  if (resolved.viaApiKey) {
    await logAudit(appwriteId, "memory.updated", id, { via: "api_key" });
  }

  return Response.json({ memory });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolved = await resolveAuth(req);
  if (!resolved) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  if (!scopeAllows(resolved.scope, "write")) return forbiddenScope();
  const { userId: appwriteId } = resolved;

  const { id } = await params;
  const { databases } = createAdminClient();

  const featureAccess = await checkFeatureAccess(databases, appwriteId);
  if (!featureAccess.allowed) return upgradeRequiredResponse();

  let memory: AppwriteDoc<MemoryDoc>;
  try {
    memory = await databases.getDocument(DB_ID, COLLECTIONS.MEMORIES, id) as unknown as AppwriteDoc<MemoryDoc>;
  } catch {
    return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
  }

  if (memory.userId !== appwriteId) return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });

  if (resolved.viaApiKey) {
    await logAudit(appwriteId, "memory.deleted", id, { via: "api_key" });
  }

  // Remove this memory's stale back-links from everything it pointed to, so
  // no surviving memory keeps referencing a deleted id. Non-fatal.
  const targetIds = memory.relatedMemoryIds ?? [];
  if (targetIds.length > 0) {
    try {
      await Promise.all(targetIds.map((tid) => unbacklinkMemory(databases, id, tid, appwriteId)));
    } catch {
      // Relationship maintenance must never break the delete.
    }
  }

  await databases.deleteDocument(DB_ID, COLLECTIONS.MEMORIES, id);

  try {
    const repResult = await databases.listDocuments(DB_ID, COLLECTIONS.REPUTATIONS, [
      Query.equal("userId", appwriteId), Query.limit(1),
    ]);
    if (repResult.documents.length > 0) {
      const rep = repResult.documents[0] as unknown as AppwriteDoc<ReputationDoc>;
      await databases.updateDocument(DB_ID, COLLECTIONS.REPUTATIONS, rep.$id, {
        memoryCount: Math.max(0, rep.memoryCount - 1),
      });
    }
  } catch {
    // Non-critical
  }

  return Response.json({ success: true });
}
