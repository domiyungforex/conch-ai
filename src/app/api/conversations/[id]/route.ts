import { createAdminClient } from "@/lib/appwrite";
import { DB_ID, COLLECTIONS, type ConversationDoc, type MessageDoc, type AgentDoc, type AppwriteDoc } from "@/lib/db";
import { Query } from "node-appwrite";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const appwriteId = "demo";

  const { id } = await params;
  const { databases } = createAdminClient();

  let conv: AppwriteDoc<ConversationDoc>;
  try {
    conv = await databases.getDocument(DB_ID, COLLECTIONS.CONVERSATIONS, id) as unknown as AppwriteDoc<ConversationDoc>;
  } catch {
    return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
  }

  if (conv.userId !== appwriteId) return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });

  const messagesResult = await databases.listDocuments(DB_ID, COLLECTIONS.MESSAGES, [
    Query.equal("conversationId", id),
    Query.orderAsc("$createdAt"),
    Query.limit(500),
  ]);

  let agentData: { $id: string; name: string; avatarUrl: string | null } | null = null;
  if (conv.agentId) {
    try {
      const agentDoc = await databases.getDocument(DB_ID, COLLECTIONS.AGENTS, conv.agentId) as unknown as AppwriteDoc<AgentDoc>;
      agentData = { $id: agentDoc.$id, name: agentDoc.name, avatarUrl: agentDoc.avatarUrl ?? null };
    } catch {
      // Agent may have been deleted
    }
  }

  const conversation = {
    ...conv,
    messages: messagesResult.documents as unknown as AppwriteDoc<MessageDoc>[],
    agent: agentData,
  };

  return Response.json({ conversation });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const appwriteId = "demo";

  const { id } = await params;
  const { databases } = createAdminClient();

  let conv: AppwriteDoc<ConversationDoc>;
  try {
    conv = await databases.getDocument(DB_ID, COLLECTIONS.CONVERSATIONS, id) as unknown as AppwriteDoc<ConversationDoc>;
  } catch {
    return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
  }

  if (conv.userId !== appwriteId) return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });

  const messagesResult = await databases.listDocuments(DB_ID, COLLECTIONS.MESSAGES, [
    Query.equal("conversationId", id),
    Query.limit(1000),
  ]);
  await Promise.all(
    messagesResult.documents.map((m) => databases.deleteDocument(DB_ID, COLLECTIONS.MESSAGES, m.$id))
  );

  await databases.deleteDocument(DB_ID, COLLECTIONS.CONVERSATIONS, id);
  return Response.json({ success: true });
}
