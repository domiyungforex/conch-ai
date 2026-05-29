import { createAdminClient } from "@/lib/appwrite";
import { DB_ID, COLLECTIONS, type ReputationDoc, type AppwriteDoc } from "@/lib/db";
import { Query } from "node-appwrite";

export async function GET() {
    const appwriteId = "demo";

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
