import { auth, createAdminClient } from "@/lib/appwrite";
import { DB_ID, COLLECTIONS, type ReputationDoc, type AppwriteDoc } from "@/lib/db";
import { Query } from "node-appwrite";

export async function GET() {
  const { userId: appwriteId } = await auth();
  if (!appwriteId) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

  const { databases } = createAdminClient();
  const result = await databases.listDocuments(DB_ID, COLLECTIONS.REPUTATIONS, [
    Query.equal("userId", appwriteId), Query.limit(1),
  ]);

  if (result.documents.length === 0) {
    return new Response(JSON.stringify({ error: "Reputation not found" }), { status: 404 });
  }

  const reputation = result.documents[0] as unknown as AppwriteDoc<ReputationDoc>;
  return Response.json(reputation);
}
