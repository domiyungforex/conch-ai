import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/appwrite";
import { DB_ID, COLLECTIONS, type ReputationDoc, type AppwriteDoc } from "@/lib/db";
import { ReputationView } from "@/components/dashboard/ReputationView";
import { Query } from "node-appwrite";

export const metadata = { title: "Reputation — Conch" };

export default async function ReputationPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  let reputation: AppwriteDoc<ReputationDoc> | null = null;
  let counts = { memories: 0, agents: 0, conversations: 0 };

  try {
    const { databases } = createAdminClient();
    const [repResult, memResult, convResult, agentResult] = await Promise.all([
      databases.listDocuments(DB_ID, COLLECTIONS.REPUTATIONS, [Query.equal("userId", userId), Query.limit(1)]),
      databases.listDocuments(DB_ID, COLLECTIONS.MEMORIES, [Query.equal("userId", userId), Query.limit(1)]),
      databases.listDocuments(DB_ID, COLLECTIONS.CONVERSATIONS, [Query.equal("userId", userId), Query.limit(1)]),
      databases.listDocuments(DB_ID, COLLECTIONS.AGENTS, [Query.equal("userId", userId), Query.limit(1)]),
    ]);

    reputation = repResult.documents.length > 0
      ? repResult.documents[0] as unknown as AppwriteDoc<ReputationDoc>
      : null;
    counts = { memories: memResult.total, agents: agentResult.total, conversations: convResult.total };
  } catch {
    redirect("/dashboard");
  }

  if (!reputation) redirect("/dashboard");

  return <ReputationView reputation={reputation} counts={counts} />;
}
