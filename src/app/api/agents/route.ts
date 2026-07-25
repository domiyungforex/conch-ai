import { createAdminClient } from "@/lib/appwrite";
import { DB_ID, COLLECTIONS, type AgentDoc, type ReputationDoc, type AppwriteDoc } from "@/lib/db";
import { AgentCreateSchema } from "@/lib/validators";
import { resolveAuth, scopeAllows, forbiddenScope } from "@/lib/apiAuth";
import { checkAgentQuota } from "@/lib/planLimits";
import { Query, ID } from "node-appwrite";

export async function GET(req: Request) {
  const resolved = await resolveAuth(req);
  if (!resolved) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  if (!scopeAllows(resolved.scope, "read")) return forbiddenScope();
  const { userId: appwriteId } = resolved;

  const { databases } = createAdminClient();
  const result = await databases.listDocuments(DB_ID, COLLECTIONS.AGENTS, [
    Query.equal("userId", appwriteId),
    Query.notEqual("status", "ARCHIVED"),
    Query.orderDesc("$updatedAt"),
    Query.limit(50),
  ]);

  const agents = result.documents as unknown as AppwriteDoc<AgentDoc>[];
  return Response.json({ agents });
}

export async function POST(req: Request) {
  const resolved = await resolveAuth(req);
  if (!resolved) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  if (!scopeAllows(resolved.scope, "write")) return forbiddenScope();
  const { userId: appwriteId } = resolved;

  const parsed = AgentCreateSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: "Invalid request", details: parsed.error.flatten() }), { status: 400 });
  }

  const { databases } = createAdminClient();

  const quota = await checkAgentQuota(databases, appwriteId);
  if (!quota.allowed) {
    return new Response(JSON.stringify({
      error: `Your plan is limited to ${quota.limit} agent${quota.limit === 1 ? "" : "s"}. Upgrade to Pro for more.`,
      code: "QUOTA_EXCEEDED",
    }), { status: 403 });
  }

  const agent = await databases.createDocument(DB_ID, COLLECTIONS.AGENTS, ID.unique(), {
    userId: appwriteId,
    name: parsed.data.name,
    description: parsed.data.description ?? null,
    systemPrompt: parsed.data.systemPrompt,
    avatarUrl: null,
    status: "ACTIVE",
    memoryScope: parsed.data.memoryScope ?? "user",
    modelId: parsed.data.modelId ?? "claude-haiku-4-5-20251001",
    temperature: parsed.data.temperature ?? 0.7,
    maxTokens: parsed.data.maxTokens ?? 2000,
  }) as unknown as AppwriteDoc<AgentDoc>;

  try {
    const repResult = await databases.listDocuments(DB_ID, COLLECTIONS.REPUTATIONS, [
      Query.equal("userId", appwriteId), Query.limit(1),
    ]);
    if (repResult.documents.length > 0) {
      const rep = repResult.documents[0] as unknown as AppwriteDoc<ReputationDoc>;
      await databases.updateDocument(DB_ID, COLLECTIONS.REPUTATIONS, rep.$id, {
        agentCount: rep.agentCount + 1,
      });
    }
  } catch {
    // Non-critical
  }

  return Response.json({ agent }, { status: 201 });
}
