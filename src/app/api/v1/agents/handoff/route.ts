import { resolveAuth, scopeAllows, forbiddenScope } from "@/lib/apiAuth";
import { createAdminClient } from "@/lib/appwrite";
import {
  DB_ID,
  COLLECTIONS,
  type AgentDoc,
  type AppwriteDoc,
} from "@/lib/db";
import { HandoffCreateSchema } from "@/lib/validators";
import { Query, ID } from "node-appwrite";

// POST /api/v1/agents/handoff — Create an agent handoff
export async function POST(req: Request) {
  const auth = await resolveAuth(req);
  if (!auth) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }
  if (!scopeAllows(auth.scope, "handoff:write")) return forbiddenScope();

  const parsed = HandoffCreateSchema.safeParse(
    await req.json().catch(() => ({}))
  );
  if (!parsed.success) {
    return new Response(
      JSON.stringify({ error: "Invalid request", details: parsed.error.flatten() }),
      { status: 400 }
    );
  }

  const { databases } = createAdminClient();

  // Verify both agents belong to this user
  const [fromAgent, toAgent] = await Promise.all([
    databases.getDocument(DB_ID, COLLECTIONS.AGENTS, parsed.data.fromAgentId)
      .catch(() => null) as Promise<AppwriteDoc<AgentDoc> | null>,
    databases.getDocument(DB_ID, COLLECTIONS.AGENTS, parsed.data.toAgentId)
      .catch(() => null) as Promise<AppwriteDoc<AgentDoc> | null>,
  ]);

  if (!fromAgent || fromAgent.userId !== auth.userId) {
    return new Response(
      JSON.stringify({ error: "Source agent not found" }),
      { status: 404 }
    );
  }
  if (!toAgent || toAgent.userId !== auth.userId) {
    return new Response(
      JSON.stringify({ error: "Target agent not found" }),
      { status: 404 }
    );
  }

  const doc = await databases.createDocument(
    DB_ID,
    COLLECTIONS.AGENT_HANDOFFS,
    ID.unique(),
    {
      ...parsed.data,
      userId: auth.userId,
      status: "pending",
      contextVersion: 1,
    }
  );

  return Response.json({ handoff: doc }, { status: 201 });
}

// GET /api/v1/agents/handoff — List handoffs
export async function GET(req: Request) {
  const auth = await resolveAuth(req);
  if (!auth) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }
  if (!scopeAllows(auth.scope, "handoff:read")) return forbiddenScope();

  const { databases } = createAdminClient();

  const result = await databases.listDocuments(
    DB_ID,
    COLLECTIONS.AGENT_HANDOFFS,
    [
      Query.equal("userId", auth.userId),
      Query.orderDesc("$createdAt"),
      Query.limit(50),
    ]
  );

  return Response.json({ handoffs: result.documents });
}
