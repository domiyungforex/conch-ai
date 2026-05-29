import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/appwrite";
import { DB_ID, COLLECTIONS, type SharedContextDoc, type AppwriteDoc } from "@/lib/db";
import { Query } from "node-appwrite";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  const appwriteId = userId;

  const { databases } = createAdminClient();
  const result = await databases.listDocuments(DB_ID, COLLECTIONS.SHARED_CONTEXTS, [
    Query.equal("ownerId", appwriteId),
    Query.orderDesc("$createdAt"),
    Query.limit(50),
  ]);

  const sharedContexts = result.documents as unknown as AppwriteDoc<SharedContextDoc>[];
  return Response.json({ sharedContexts });
}
