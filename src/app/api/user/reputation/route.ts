import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/appwrite";
import { DB_ID, COLLECTIONS, type ReputationDoc, type AppwriteDoc } from "@/lib/db";
import { computeReputationScore, getLevelInfo } from "@/lib/reputation";
import { Query } from "node-appwrite";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  const appwriteId = userId;

  const { databases } = createAdminClient();
  const result = await databases.listDocuments(DB_ID, COLLECTIONS.REPUTATIONS, [
    Query.equal("userId", appwriteId), Query.limit(1),
  ]);

  if (result.documents.length === 0) {
    return new Response(JSON.stringify({ error: "Reputation not found" }), { status: 404 });
  }

  const reputation = result.documents[0] as unknown as AppwriteDoc<ReputationDoc>;

  // score/level are derived from the count fields, not trusted from storage —
  // nothing ever incremented them there (that was the bug: the per-category
  // breakdown updated live from these same counts while this total sat
  // frozen at its creation-time value of 0). Recompute fresh every read, and
  // write it back so anything else reading this doc directly (e.g. a future
  // leaderboard query) isn't looking at a stale number either.
  const score = computeReputationScore(reputation);
  const level = getLevelInfo(score).name;

  if (reputation.score !== score || reputation.level !== level) {
    try {
      await databases.updateDocument(DB_ID, COLLECTIONS.REPUTATIONS, reputation.$id, { score, level });
    } catch {
      // Non-critical — the response below is correct either way.
    }
  }

  return Response.json({ ...reputation, score, level });
}
