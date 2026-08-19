import { createAdminClient } from "@/lib/appwrite";
import { DB_ID, COLLECTIONS, type AgentHandoffDoc, type AppwriteDoc } from "@/lib/db";
import { createHandoff, getPendingHandoffs, updateHandoffStatus } from "@/lib/contextEngine";
import { HandoffCreateSchema } from "@/lib/validators";
import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { resolveAuth, scopeAllows, forbiddenScope } from "@/lib/apiAuth";
import { checkFeatureAccess, upgradeRequiredResponse } from "@/lib/planLimits";
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
  const agentId = searchParams.get("agentId");
  const status = searchParams.get("status") ?? "pending";

  if (agentId) {
    // Get pending handoffs for a specific agent
    const handoffs = await getPendingHandoffs(appwriteId, agentId);
    return Response.json({ handoffs, total: handoffs.length });
  }

  // List all handoffs for the user
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10), 100);

  const filters = [
    Query.equal("userId", appwriteId),
    Query.equal("status", status),
    Query.orderDesc("$createdAt"),
    Query.limit(limit),
  ];

  const result = await databases.listDocuments(DB_ID, COLLECTIONS.AGENT_HANDOFFS, filters);
  const handoffs = result.documents as unknown as AppwriteDoc<AgentHandoffDoc>[];

  return Response.json({ handoffs, total: result.total });
}

export async function POST(req: Request) {
  const resolved = await resolveAuth(req);
  if (!resolved) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  if (!scopeAllows(resolved.scope, "write")) return forbiddenScope();
  const { userId: appwriteId } = resolved;

  const { databases } = createAdminClient();

  const featureAccess = await checkFeatureAccess(databases, appwriteId);
  if (!featureAccess.allowed) return upgradeRequiredResponse();

  const rateCheck = checkRateLimit(`handoff:create:${appwriteId}`, 20, 60_000);
  if (!rateCheck.success) return rateLimitResponse(rateCheck.resetAt);

  const parsed = HandoffCreateSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: "Invalid request", details: parsed.error.flatten() }), { status: 400 });
  }

  const doc = await createHandoff({
    userId: appwriteId,
    ...parsed.data,
  });

  return Response.json({ handoff: doc }, { status: 201 });
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
  const { handoffId, status } = body;

  if (!handoffId || !status) {
    return new Response(JSON.stringify({ error: "handoffId and status are required" }), { status: 400 });
  }

  // Verify ownership
  try {
    const doc = await databases.getDocument(DB_ID, COLLECTIONS.AGENT_HANDOFFS, handoffId) as unknown as AppwriteDoc<AgentHandoffDoc>;
    if (doc.userId !== appwriteId) {
      return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
    }
  } catch {
    return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
  }

  await updateHandoffStatus(handoffId, status);
  return Response.json({ success: true });
}
