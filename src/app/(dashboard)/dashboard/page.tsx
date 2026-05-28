import { auth, createAdminClient } from "@/lib/appwrite";
import { redirect } from "next/navigation";
import { DB_ID, COLLECTIONS, type UserDoc, type ReputationDoc, type MemoryDoc, type ConversationDoc, type AppwriteDoc } from "@/lib/db";
import { DashboardHome } from "@/components/dashboard/DashboardHome";
import { SetupRetry } from "@/components/dashboard/SetupRetry";
import type { Metadata } from "next";
import { Query } from "node-appwrite";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const { userId: appwriteId } = await auth();
  if (!appwriteId) redirect("/sign-in");

  try {
    const { databases } = createAdminClient();

    let user: AppwriteDoc<UserDoc>;
    try {
      user = await databases.getDocument(DB_ID, COLLECTIONS.USERS, appwriteId) as unknown as AppwriteDoc<UserDoc>;
    } catch {
      return <SetupRetry />;
    }

    const [repResult, memCount, convCount, agentCount, recentMemResult, recentConvResult] = await Promise.all([
      databases.listDocuments(DB_ID, COLLECTIONS.REPUTATIONS, [Query.equal("userId", appwriteId), Query.limit(1)]),
      databases.listDocuments(DB_ID, COLLECTIONS.MEMORIES, [Query.equal("userId", appwriteId), Query.equal("isArchived", false), Query.limit(1)]),
      databases.listDocuments(DB_ID, COLLECTIONS.CONVERSATIONS, [Query.equal("userId", appwriteId), Query.limit(1)]),
      databases.listDocuments(DB_ID, COLLECTIONS.AGENTS, [Query.equal("userId", appwriteId), Query.notEqual("status", "ARCHIVED"), Query.limit(1)]),
      databases.listDocuments(DB_ID, COLLECTIONS.MEMORIES, [Query.equal("userId", appwriteId), Query.equal("isArchived", false), Query.orderDesc("$createdAt"), Query.limit(5)]),
      databases.listDocuments(DB_ID, COLLECTIONS.CONVERSATIONS, [Query.equal("userId", appwriteId), Query.orderDesc("$updatedAt"), Query.limit(3)]),
    ]);

    const reputation = repResult.documents.length > 0
      ? repResult.documents[0] as unknown as AppwriteDoc<ReputationDoc>
      : null;
    const recentMemories = recentMemResult.documents as unknown as AppwriteDoc<MemoryDoc>[];
    const recentConversations = recentConvResult.documents as unknown as AppwriteDoc<ConversationDoc>[];

    return (
      <DashboardHome
        user={user}
        stats={{
          memoryCount: memCount.total,
          conversationCount: convCount.total,
          agentCount: agentCount.total,
          reputation,
        }}
        recentMemories={recentMemories}
        recentConversations={recentConversations}
      />
    );
  } catch (err) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-2xl">
          <span className="text-red-400 text-lg font-bold">!</span>
        </div>
        <h2 className="text-lg font-semibold text-white">Database error</h2>
        <p className="text-sm text-slate-400 max-w-sm">{String(err).slice(0, 120)}</p>
      </div>
    );
  }
}
