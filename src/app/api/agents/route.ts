import { createAdminClient } from "@/lib/appwrite";
import { DB_ID, COLLECTIONS, type AgentDoc, type ReputationDoc, type AppwriteDoc } from "@/lib/db";
import { AgentCreateSchema } from "@/lib/validators";
import { Query, ID } from "node-appwrite";

export async function GET() {
    const appwriteId = "demo";

  const { databases } = createAdminClient();
  const result = await databases.listDocuments(DB_ID, COLLECTIONS.AGENTS, [
    Query.equal("userId", appwriteId),
    Query.notEqual("status", "ARCHIVED"),
    Query.orderDesc("$updatedAt"),
    Query.limit(50),
  ]);

  const agents = result.documents as unknown as AppwriteDoc<AgentDoc>[];
  return Response.json({ agents });
}

export async function POST(req: Request) {
    const appwriteId = "demo";

  const parsed = AgentCreateSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: "Invalid request", details: parsed.error.flatten() }), { status: 400 });
  }

  const { databases } = createAdminClient();
  const agent = await databases.createDocument(DB_ID, COLLECTIONS.AGENTS, ID.unique(), {
    userId: appwriteId,
    ...parsed.data,
  }) as unknown as AppwriteDoc<AgentDoc>;

  try {
    const repResult = await databases.listDocuments(DB_ID, COLLECTIONS.REPUTATIONS, [
      Query.equal("userId", appwriteId), Query.limit(1),
    ]);
    if (repResult.documents.length > 0) {
      const rep = repResult.documents[0] as unknown as AppwriteDoc<ReputationDoc>;
      await databases.updateDocument(DB_ID, COLLECTIONS.REPUTATIONS, rep.$id, {
        agentCount: rep.agentCount + 1,
      });
    }
  } catch {
    // Non-critical
  }

  return Response.json({ agent }, { status: 201 });
}
