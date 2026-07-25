import { createAdminClient } from "@/lib/appwrite";
import { DB_ID, COLLECTIONS, type ConversationDoc, type AppwriteDoc } from "@/lib/db";
import { ConversationCreateSchema } from "@/lib/validators";
import { resolveAuth, scopeAllows, forbiddenScope } from "@/lib/apiAuth";
import { checkConversationQuota } from "@/lib/planLimits";
import { Query, ID } from "node-appwrite";

export async function GET(req: Request) {
  const resolved = await resolveAuth(req);
  if (!resolved) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  if (!scopeAllows(resolved.scope, "read")) return forbiddenScope();
  const { userId: appwriteId } = resolved;

  const { databases } = createAdminClient();
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10), 50);
  const offset = (page - 1) * limit;

  const result = await databases.listDocuments(DB_ID, COLLECTIONS.CONVERSATIONS, [
    Query.equal("userId", appwriteId),
    Query.orderDesc("$updatedAt"),
    Query.limit(limit),
    Query.offset(offset),
  ]);

  const conversations = result.documents as unknown as AppwriteDoc<ConversationDoc>[];
  return Response.json({ conversations, total: result.total, page, limit });
}

export async function POST(req: Request) {
  const resolved = await resolveAuth(req);
  if (!resolved) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  if (!scopeAllows(resolved.scope, "write")) return forbiddenScope();
  const { userId: appwriteId } = resolved;

  const parsed = ConversationCreateSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return new Response(JSON.stringify({ error: "Invalid request" }), { status: 400 });

  const { databases } = createAdminClient();

  const quota = await checkConversationQuota(databases, appwriteId);
  if (!quota.allowed) {
    return new Response(JSON.stringify({
      error: `Free plan is limited to ${quota.limit} new conversations a month. Upgrade to Pro for unlimited.`,
      code: "QUOTA_EXCEEDED",
    }), { status: 403 });
  }

  const conversation = await databases.createDocument(DB_ID, COLLECTIONS.CONVERSATIONS, ID.unique(), {
    userId: appwriteId,
    agentId: parsed.data.agentId ?? null,
    title: parsed.data.title ?? "New Conversation",
    summary: null,
  }) as unknown as AppwriteDoc<ConversationDoc>;

  return Response.json({ conversation }, { status: 201 });
}
