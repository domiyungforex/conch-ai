import { createAdminClient } from "@/lib/appwrite";
import { DB_ID, COLLECTIONS, type ContextObjectDoc, type AppwriteDoc } from "@/lib/db";
import { retrieveContext, storeContext, supersedeContext, updateContextLifecycle } from "@/lib/contextEngine";
import { ContextCreateSchema } from "@/lib/validators";
import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { resolveAuth, scopeAllows, forbiddenScope } from "@/lib/apiAuth";
import { checkFeatureAccess, upgradeRequiredResponse, checkContextQuota, upgradeHint } from "@/lib/planLimits";
import { Query } from "node-appwrite";

export async function GET(req: Request) {
  const resolved = await resolveAuth(req);
  if (!resolved) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  if (!scopeAllows(resolved.scope, "read")) return forbiddenScope();
  const { userId: appwriteId } = resolved;

  const { databases } = createAdminClient();

  const featureAccess = await checkFeatureAccess(databases, appwriteId);
  if (!featureAccess.allowed) return upgradeRequiredResponse();

  const { searchParams } = new URL(req.url);

  // Semantic search mode
  const query = searchParams.get("q");
  if (query) {
    const projectId = searchParams.get("projectId") ?? undefined;
    const agentId = searchParams.get("agentId") ?? undefined;
    const types = searchParams.get("types")?.split(",") as ContextObjectDoc["type"][] | undefined;
    const topK = parseInt(searchParams.get("topK") ?? "10", 10);

    const results = await retrieveContext({
      userId: appwriteId,
      query,
      projectId,
      agentId,
      types,
      topK: Math.min(topK, 50),
    });

    return Response.json({ contexts: results, total: results.length });
  }

  // List mode
  const projectId = searchParams.get("projectId") ?? undefined;
  const type = searchParams.get("type") ?? undefined;
  const lifecycle = searchParams.get("lifecycle") ?? "active";
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10), 100);
  const offset = (page - 1) * limit;

  const filters = [
    Query.equal("userId", appwriteId),
    Query.equal("lifecycle", lifecycle),
    Query.orderDesc("$createdAt"),
    Query.limit(limit),
    Query.offset(offset),
  ];

  if (projectId) filters.push(Query.equal("projectId", projectId));
  if (type) filters.push(Query.equal("type", type));

  const result = await databases.listDocuments(DB_ID, COLLECTIONS.CONTEXT_OBJECTS, filters);
  const contexts = result.documents as unknown as AppwriteDoc<ContextObjectDoc>[];

  return Response.json({ contexts, total: result.total, page, limit });
}

export async function POST(req: Request) {
  const resolved = await resolveAuth(req);
  if (!resolved) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  if (!scopeAllows(resolved.scope, "write")) return forbiddenScope();
  const { userId: appwriteId } = resolved;

  const { databases } = createAdminClient();

  const featureAccess = await checkFeatureAccess(databases, appwriteId);
  if (!featureAccess.allowed) return upgradeRequiredResponse();

  const rateCheck = checkRateLimit(`context:create:${appwriteId}`, 30, 60_000);
  if (!rateCheck.success) return rateLimitResponse(rateCheck.resetAt);

  const parsed = ContextCreateSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: "Invalid request", details: parsed.error.flatten() }), { status: 400 });
  }

  const quota = await checkContextQuota(databases, appwriteId);
  if (!quota.allowed) {
    return new Response(JSON.stringify({
      error: `Your plan is limited to ${quota.limit} context objects. ${upgradeHint(quota.plan)} for more.`,
      code: "QUOTA_EXCEEDED",
    }), { status: 403 });
  }

  const doc = await storeContext({
    userId: appwriteId,
    ...parsed.data,
  });

  return Response.json({ context: doc }, { status: 201 });
}

export async function PATCH(req: Request) {
  const resolved = await resolveAuth(req);
  if (!resolved) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  if (!scopeAllows(resolved.scope, "write")) return forbiddenScope();
  const { userId: appwriteId } = resolved;

  const { databases } = createAdminClient();

  const featureAccess = await checkFeatureAccess(databases, appwriteId);
  if (!featureAccess.allowed) return upgradeRequiredResponse();

  const body = await req.json().catch(() => ({}));
  const { contextId, ...updates } = body;

  if (!contextId) {
    return new Response(JSON.stringify({ error: "contextId is required" }), { status: 400 });
  }

  // Verify ownership
  try {
    const doc = await databases.getDocument(DB_ID, COLLECTIONS.CONTEXT_OBJECTS, contextId) as unknown as AppwriteDoc<ContextObjectDoc>;
    if (doc.userId !== appwriteId) {
      return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
    }
  } catch {
    return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
  }

  // Handle lifecycle updates specially
  if (updates.lifecycle) {
    await updateContextLifecycle(contextId, updates.lifecycle);
    delete updates.lifecycle;
  }

  // Handle supersede
  if (updates.supersede && updates.content) {
    const newDoc = await supersedeContext(contextId, updates.content, appwriteId, updates.reason);
    return Response.json({ context: newDoc, superseded: true });
  }

  // Regular update
  if (Object.keys(updates).length > 0) {
    await databases.updateDocument(DB_ID, COLLECTIONS.CONTEXT_OBJECTS, contextId, updates);
  }

  const updated = await databases.getDocument(DB_ID, COLLECTIONS.CONTEXT_OBJECTS, contextId) as unknown as AppwriteDoc<ContextObjectDoc>;
  return Response.json({ context: updated });
}
