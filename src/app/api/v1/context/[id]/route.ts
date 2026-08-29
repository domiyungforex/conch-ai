import { resolveAuth, scopeAllows, forbiddenScope } from "@/lib/apiAuth";
import { createAdminClient } from "@/lib/appwrite";
import {
  DB_ID,
  COLLECTIONS,
  type ContextObjectDoc,
  type AppwriteDoc,
} from "@/lib/db";
import { withApiTracking } from "@/lib/apiUsage";
import { ContextUpdateSchema } from "@/lib/validators";

// GET /api/v1/context/:id — Get a context object
export const GET = withApiTracking(async (
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  const auth = await resolveAuth(req);
  if (!auth) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }
  if (!scopeAllows(auth.scope, "context:read")) return forbiddenScope();

  const { id } = await params;
  const { databases } = createAdminClient();

  try {
    const doc = await databases.getDocument(
      DB_ID,
      COLLECTIONS.CONTEXT_OBJECTS,
      id
    ) as unknown as AppwriteDoc<ContextObjectDoc>;

    if (doc.userId !== auth.userId) {
      return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
    }

    return Response.json({ context: doc });
  } catch {
    return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
  }
});

// PATCH /api/v1/context/:id — Update a context object
export const PATCH = withApiTracking(async (
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  const auth = await resolveAuth(req);
  if (!auth) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }
  if (!scopeAllows(auth.scope, "context:write")) return forbiddenScope();

  const { id } = await params;
  const parsed = ContextUpdateSchema.safeParse(
    await req.json().catch(() => ({}))
  );
  if (!parsed.success) {
    return new Response(
      JSON.stringify({ error: "Invalid request", details: parsed.error.flatten() }),
      { status: 400 }
    );
  }

  const { databases } = createAdminClient();

  try {
    // Verify ownership
    const existing = await databases.getDocument(
      DB_ID,
      COLLECTIONS.CONTEXT_OBJECTS,
      id
    ) as unknown as AppwriteDoc<ContextObjectDoc>;

    if (existing.userId !== auth.userId) {
      return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
    }

    // If content is being updated, regenerate embedding
    const updates: Record<string, unknown> = { ...parsed.data };
    if (parsed.data.content) {
      try {
        const { generateEmbedding } = await import("@/lib/embeddings");
        updates.embedding = await generateEmbedding(parsed.data.content.slice(0, 8000));
        updates.version = (existing.version ?? 1) + 1;
      } catch {
        // Embedding failed — skip, content still updated
      }
    }

    const doc = await databases.updateDocument(
      DB_ID,
      COLLECTIONS.CONTEXT_OBJECTS,
      id,
      updates
    );

    return Response.json({ context: doc });
  } catch {
    return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
  }
});

// DELETE /api/v1/context/:id — Soft-delete a context object
export const DELETE = withApiTracking(async (
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  const auth = await resolveAuth(req);
  if (!auth) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }
  if (!scopeAllows(auth.scope, "context:write")) return forbiddenScope();

  const { id } = await params;
  const { databases } = createAdminClient();

  try {
    const existing = await databases.getDocument(
      DB_ID,
      COLLECTIONS.CONTEXT_OBJECTS,
      id
    ) as unknown as AppwriteDoc<ContextObjectDoc>;

    if (existing.userId !== auth.userId) {
      return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
    }

    // Soft-delete: set lifecycle to deleted
    await databases.updateDocument(
      DB_ID,
      COLLECTIONS.CONTEXT_OBJECTS,
      id,
      { lifecycle: "deleted" }
    );

    return Response.json({ success: true });
  } catch {
    return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
  }
});
