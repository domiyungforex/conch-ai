import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { Query } from "node-appwrite";
import { createAdminClient } from "@/lib/appwrite";
import { DB_ID, COLLECTIONS } from "@/lib/db";

export async function DELETE() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const appwriteId = userId;

  const { databases } = createAdminClient();

  try {
    const [memories, conversations, agents, apiKeys, sharedContexts, wallets, reputations] =
      await Promise.all([
        databases.listDocuments(DB_ID, COLLECTIONS.MEMORIES,        [Query.equal("userId", appwriteId), Query.limit(500)]),
        databases.listDocuments(DB_ID, COLLECTIONS.CONVERSATIONS,   [Query.equal("userId", appwriteId), Query.limit(500)]),
        databases.listDocuments(DB_ID, COLLECTIONS.AGENTS,          [Query.equal("userId", appwriteId), Query.limit(500)]),
        databases.listDocuments(DB_ID, COLLECTIONS.API_KEYS,        [Query.equal("userId", appwriteId), Query.limit(500)]),
        databases.listDocuments(DB_ID, COLLECTIONS.SHARED_CONTEXTS, [Query.equal("ownerId", appwriteId), Query.limit(500)]),
        databases.listDocuments(DB_ID, COLLECTIONS.WALLETS,         [Query.equal("userId", appwriteId), Query.limit(10)]),
        databases.listDocuments(DB_ID, COLLECTIONS.REPUTATIONS,     [Query.equal("userId", appwriteId), Query.limit(10)]),
      ]);

    const messageDeletes: Promise<unknown>[] = [];
    for (const conv of conversations.documents) {
      const msgs = await databases.listDocuments(DB_ID, COLLECTIONS.MESSAGES, [
        Query.equal("conversationId", conv.$id), Query.limit(1000),
      ]);
      for (const msg of msgs.documents) {
        messageDeletes.push(databases.deleteDocument(DB_ID, COLLECTIONS.MESSAGES, msg.$id));
      }
    }
    await Promise.all(messageDeletes);

    await Promise.all([
      ...memories.documents.map(d => databases.deleteDocument(DB_ID, COLLECTIONS.MEMORIES, d.$id)),
      ...conversations.documents.map(d => databases.deleteDocument(DB_ID, COLLECTIONS.CONVERSATIONS, d.$id)),
      ...agents.documents.map(d => databases.deleteDocument(DB_ID, COLLECTIONS.AGENTS, d.$id)),
      ...apiKeys.documents.map(d => databases.deleteDocument(DB_ID, COLLECTIONS.API_KEYS, d.$id)),
      ...sharedContexts.documents.map(d => databases.deleteDocument(DB_ID, COLLECTIONS.SHARED_CONTEXTS, d.$id)),
      ...wallets.documents.map(d => databases.deleteDocument(DB_ID, COLLECTIONS.WALLETS, d.$id)),
      ...reputations.documents.map(d => databases.deleteDocument(DB_ID, COLLECTIONS.REPUTATIONS, d.$id)),
      databases.deleteDocument(DB_ID, COLLECTIONS.USERS, appwriteId),
    ]);
  } catch (err) {
    console.error("[account DELETE] failed:", err);
    return NextResponse.json({ error: "Failed to delete account" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
