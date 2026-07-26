import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/appwrite";
import { DB_ID, COLLECTIONS, type UserDoc, type ReputationDoc, type MemoryDoc, type ConversationDoc, type AppwriteDoc } from "@/lib/db";
import { DashboardHome } from "@/components/dashboard/DashboardHome";
import { SetupRetry } from "@/components/dashboard/SetupRetry";
import type { Metadata } from "next";
import { Query, ID } from "node-appwrite";

export const metadata: Metadata = { title: "Dashboard" };

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Two concurrent requests for the same first-time user (double-tab, a
// prefetched Link firing alongside a direct navigation) can both reach this
// at once: both see 404 on getDocument, both attempt createDocument with the
// same fixed ID, the loser gets 409. Refetching immediately after a 409 can
// still race Appwrite's own read-after-write consistency and return 404 —
// observed live, not hypothetical — so this retries the whole get-or-create
// cycle a few times with a short backoff instead of a single-shot refetch.
async function getOrCreateUser(
  databases: ReturnType<typeof createAdminClient>["databases"],
  userId: string
): Promise<AppwriteDoc<UserDoc> | null> {
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) await sleep(200 * attempt);

    try {
      return await databases.getDocument(DB_ID, COLLECTIONS.USERS, userId) as unknown as AppwriteDoc<UserDoc>;
    } catch (getErr: unknown) {
      if ((getErr as { code?: number })?.code !== 404) {
        console.error("[dashboard] failed to load user:", getErr);
        return null;
      }
    }

    const clerkUser = await currentUser();
    if (!clerkUser) return null;

    try {
      const user = await databases.createDocument(DB_ID, COLLECTIONS.USERS, userId, {
        email: clerkUser.emailAddresses[0]?.emailAddress ?? "",
        name: clerkUser.fullName ?? clerkUser.firstName ?? null,
        avatarUrl: clerkUser.imageUrl ?? null,
        plan: "free",
        planExpiresAt: null,
        onboarded: false,
      }) as unknown as AppwriteDoc<UserDoc>;

      await databases.createDocument(DB_ID, COLLECTIONS.REPUTATIONS, ID.unique(), {
        userId,
        score: 0,
        memoryCount: 0,
        shareCount: 0,
        agentCount: 0,
        chatCount: 0,
        level: "beginner",
      });

      return user;
    } catch (provisionErr: unknown) {
      if ((provisionErr as { code?: number })?.code !== 409) {
        console.error("[dashboard] user provisioning failed:", provisionErr);
        return null;
      }
      // Lost the race — loop around and get-or-create again after the backoff.
    }
  }
  return null;
}

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

    const reputation = repResult.documents.length > 0
      ? repResult.documents[0] as unknown as AppwriteDoc<ReputationDoc>
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
