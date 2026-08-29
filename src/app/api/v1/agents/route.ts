import { resolveAuth, scopeAllows, forbiddenScope } from "@/lib/apiAuth";
import { createAdminClient } from "@/lib/appwrite";
import { DB_ID, COLLECTIONS } from "@/lib/db";
import { withApiTracking } from "@/lib/apiUsage";
import { AgentCreateSchema } from "@/lib/validators";
import { Query, ID } from "node-appwrite";

// GET /api/v1/agents — List agents
export const GET = withApiTracking(async (req: Request) => {
  const auth = await resolveAuth(req);
  if (!auth) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }
  if (!scopeAllows(auth.scope, "agents:read")) return forbiddenScope();

  const { databases } = createAdminClient();

  const result = await databases.listDocuments(
    DB_ID,
    COLLECTIONS.AGENTS,
    [
      Query.equal("userId", auth.userId),
      Query.notEqual("status", "ARCHIVED"),
      Query.orderDesc("$updatedAt"),
      Query.limit(50),
    ]
  );

  return Response.json({ agents: result.documents });
});

// POST /api/v1/agents — Create an agent
export const POST = withApiTracking(async (req: Request) => {
  const auth = await resolveAuth(req);
  if (!auth) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }
  if (!scopeAllows(auth.scope, "agents:write")) return forbiddenScope();

  const parsed = AgentCreateSchema.safeParse(
    await req.json().catch(() => ({}))
  );
  if (!parsed.success) {
    return new Response(
      JSON.stringify({ error: "Invalid request", details: parsed.error.flatten() }),
      { status: 400 }
    );
  }

  const { databases } = createAdminClient();

  const doc = await databases.createDocument(
    DB_ID,
    COLLECTIONS.AGENTS,
    ID.unique(),
    {
      userId: auth.userId,
      ...parsed.data,
      avatarUrl: null,
      status: "ACTIVE",
    }
  );

  return Response.json({ agent: doc }, { status: 201 });
});
