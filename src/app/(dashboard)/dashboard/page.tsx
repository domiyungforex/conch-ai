import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/appwrite";
import { DB_ID, COLLECTIONS, type ReputationDoc, type MemoryDoc, type ConversationDoc, type AppwriteDoc } from "@/lib/db";
import { DashboardHome } from "@/components/dashboard/DashboardHome";
import { SetupRetry } from "@/components/dashboard/SetupRetry";
import { computeReputationScore } from "@/lib/reputation";
import { getOrCreateUser } from "@/lib/userProvisioning";
import type { Metadata } from "next";
import { Query } from "node-appwrite";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  try {
    const { databases } = createAdminClient();

    const user = await getOrCreateUser(databases, userId);
    if (!user) return <SetupRetry />;

    const [repResult, memCount, convCount, agentCount, recentMemResult, recentConvResult] = await Promise.all([
      databases.listDocuments(DB_ID, COLLECTIONS.REPUTATIONS, [Query.equal("userId", userId), Query.limit(1)]),
      databases.listDocuments(DB_ID, COLLECTIONS.MEMORIES, [Query.equal("userId", userId), Query.equal("isArchived", false), Query.limit(1)]),
      databases.listDocuments(DB_ID, COLLECTIONS.CONVERSATIONS, [Query.equal("userId", userId), Query.limit(1)]),
      databases.listDocuments(DB_ID, COLLECTIONS.AGENTS, [Query.equal("userId", userId), Query.notEqual("status", "ARCHIVED"), Query.limit(1)]),
      databases.listDocuments(DB_ID, COLLECTIONS.MEMORIES, [Query.equal("userId", userId), Query.equal("isArchived", false), Query.orderDesc("$createdAt"), Query.limit(5)]),
      databases.listDocuments(DB_ID, COLLECTIONS.CONVERSATIONS, [Query.equal("userId", userId), Query.orderDesc("$updatedAt"), Query.limit(3)]),
    ]);

    // score is derived from the count fields, not trusted from storage — see
    // the fix in /api/user/reputation for why (it was never incremented and
    // sat frozen at 0 while the per-category breakdown kept climbing).
    const reputation = repResult.documents.length > 0
      ? (() => {
          const doc = repResult.documents[0] as unknown as AppwriteDoc<ReputationDoc>;
          return { ...doc, score: computeReputationScore(doc) };
        })()
      : null;
    const recentMemories = recentMemResult.documents as unknown as AppwriteDoc<MemoryDoc>[];
    const recentConversations = recentConvResult.documents as unknown as AppwriteDoc<ConversationDoc>[];

    // Appwrite SDK documents aren't plain objects (they carry SDK prototype methods),
    // which React Server Components reject when passing props to a Client Component.
    const toPlain = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

    return (
      <DashboardHome
        user={toPlain(user)}
        stats={toPlain({
          memoryCount: memCount.total,
          conversationCount: convCount.total,
          agentCount: agentCount.total,
          reputation,
        })}
        recentMemories={toPlain(recentMemories)}
        recentConversations={toPlain(recentConversations)}
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
