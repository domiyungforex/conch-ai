import { NextResponse } from "next/server";
import { Query } from "node-appwrite";
import { auth, createAdminClient } from "@/lib/appwrite";
import { DB_ID, COLLECTIONS } from "@/lib/db";
import { SESSION_COOKIE } from "@/lib/appwrite";

export async function DELETE() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { databases, users } = createAdminClient();

  try {
    // Fetch all child documents that need deleting
    const [memories, conversations, agents, apiKeys, sharedContexts, wallets, reputations] =
      await Promise.all([
        databases.listDocuments(DB_ID, COLLECTIONS.MEMORIES,       [Query.equal("userId", userId), Query.limit(500)]),
        databases.listDocuments(DB_ID, COLLECTIONS.CONVERSATIONS,  [Query.equal("userId", userId), Query.limit(500)]),
        databases.listDocuments(DB_ID, COLLECTIONS.AGENTS,         [Query.equal("userId", userId), Query.limit(500)]),
        databases.listDocuments(DB_ID, COLLECTIONS.API_KEYS,       [Query.equal("userId", userId), Query.limit(500)]),
        databases.listDocuments(DB_ID, COLLECTIONS.SHARED_CONTEXTS,[Query.equal("ownerId", userId), Query.limit(500)]),
        databases.listDocuments(DB_ID, COLLECTIONS.WALLETS,        [Query.equal("userId", userId), Query.limit(10)]),
        databases.listDocuments(DB_ID, COLLECTIONS.REPUTATIONS,    [Query.equal("userId", userId), Query.limit(10)]),
      ]);

    // Fetch messages for all conversations
    const messageDeletes: Promise<unknown>[] = [];
    for (const conv of conversations.documents) {
      const msgs = await databases.listDocuments(DB_ID, COLLECTIONS.MESSAGES, [
        Query.equal("conversationId", conv.$id),
        Query.limit(1000),
      ]);
      for (const msg of msgs.documents) {
        messageDeletes.push(databases.deleteDocument(DB_ID, COLLECTIONS.MESSAGES, msg.$id));
      }
    }
    await Promise.all(messageDeletes);

    // Delete all other user documents in parallel
    const deletes = [
      ...memories.documents.map(d => databases.deleteDocument(DB_ID, COLLECTIONS.MEMORIES, d.$id)),
      ...conversations.documents.map(d => databases.deleteDocument(DB_ID, COLLECTIONS.CONVERSATIONS, d.$id)),
      ...agents.documents.map(d => databases.deleteDocument(DB_ID, COLLECTIONS.AGENTS, d.$id)),
      ...apiKeys.documents.map(d => databases.deleteDocument(DB_ID, COLLECTIONS.API_KEYS, d.$id)),
      ...sharedContexts.documents.map(d => databases.deleteDocument(DB_ID, COLLECTIONS.SHARED_CONTEXTS, d.$id)),
      ...wallets.documents.map(d => databases.deleteDocument(DB_ID, COLLECTIONS.WALLETS, d.$id)),
      ...reputations.documents.map(d => databases.deleteDocument(DB_ID, COLLECTIONS.REPUTATIONS, d.$id)),
      databases.deleteDocument(DB_ID, COLLECTIONS.USERS, userId),
    ];
    await Promise.all(deletes);

    // Delete Appwrite auth account
    await users.delete(userId);
  } catch (err) {
    console.error("[account DELETE] failed:", err);
    return NextResponse.json({ error: "Failed to delete account" }, { status: 500 });
  }

  const res = NextResponse.json({ success: true });
  res.cookies.set(SESSION_COOKIE, "", { maxAge: 0, path: "/" });
  return res;
}
