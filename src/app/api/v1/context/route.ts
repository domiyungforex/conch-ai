import { resolveAuth, scopeAllows, forbiddenScope } from "@/lib/apiAuth";
import { createAdminClient } from "@/lib/appwrite";
import { DB_ID, COLLECTIONS } from "@/lib/db";
import { withApiTracking } from "@/lib/apiUsage";
import { Query, ID } from "node-appwrite";
import { ContextCreateSchema } from "@/lib/validators";

// POST /api/v1/context — Create a context object
export const POST = withApiTracking(async (req: Request) => {
  const auth = await resolveAuth(req);
  if (!auth) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }
  if (!scopeAllows(auth.scope, "context:write")) return forbiddenScope();

  const parsed = ContextCreateSchema.safeParse(
    await req.json().catch(() => ({}))
  );
  if (!parsed.success) {
    return new Response(
      JSON.stringify({ error: "Invalid request", details: parsed.error.flatten() }),
      { status: 400 }
    );
  }

  const { databases } = createAdminClient();

  // Auto-generate embedding for searchable context
  let embedding: number[] = [];
  try {
    const { generateEmbedding } = await import("@/lib/embeddings");
    embedding = await generateEmbedding(parsed.data.content.slice(0, 8000));
  } catch {
    // Embedding generation failed — context is still stored, just not vector-searchable
  }

  const doc = await databases.createDocument(
    DB_ID,
    COLLECTIONS.CONTEXT_OBJECTS,
    ID.unique(),
    {
      userId: auth.userId,
      ...parsed.data,
      embedding,
      version: 1,
    }
  );

  return Response.json({ context: doc }, { status: 201 });
});

// GET /api/v1/context — List context objects
export const GET = withApiTracking(async (req: Request) => {
  const auth = await resolveAuth(req);
  if (!auth) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }
  if (!scopeAllows(auth.scope, "context:read")) return forbiddenScope();

  const url = new URL(req.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") ?? "20", 10)));
  const type = url.searchParams.get("type") || undefined;
  const projectId = url.searchParams.get("projectId") || undefined;
  const lifecycle = url.searchParams.get("lifecycle") || undefined;

  const { databases } = createAdminClient();

  const queries = [
    Query.equal("userId", auth.userId),
    Query.orderDesc("$createdAt"),
    Query.limit(limit),
    Query.offset((page - 1) * limit),
  ];

  if (type) queries.push(Query.equal("type", type));
  if (projectId) queries.push(Query.equal("projectId", projectId));
  if (lifecycle) queries.push(Query.equal("lifecycle", lifecycle));

  const result = await databases.listDocuments(
    DB_ID,
    COLLECTIONS.CONTEXT_OBJECTS,
    queries
  );

  return Response.json({
    context: result.documents,
    total: result.total,
    page,
    limit,
  });
});
