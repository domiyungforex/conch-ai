import { auth, createAdminClient } from "@/lib/appwrite";
import { DB_ID, COLLECTIONS, type AgentDoc, type AppwriteDoc } from "@/lib/db";
import { AgentUpdateSchema } from "@/lib/validators";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId: appwriteId } = await auth();
  if (!appwriteId) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

  const { id } = await params;
  const { databases } = createAdminClient();

  let agent: AppwriteDoc<AgentDoc>;
  try {
    agent = await databases.getDocument(DB_ID, COLLECTIONS.AGENTS, id) as unknown as AppwriteDoc<AgentDoc>;
  } catch {
    return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
  }

  if (agent.userId !== appwriteId) return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });

  return Response.json({ agent });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId: appwriteId } = await auth();
  if (!appwriteId) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

  const { id } = await params;
  const { databases } = createAdminClient();

  let existing: AppwriteDoc<AgentDoc>;
  try {
    existing = await databases.getDocument(DB_ID, COLLECTIONS.AGENTS, id) as unknown as AppwriteDoc<AgentDoc>;
  } catch {
    return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
  }

  if (existing.userId !== appwriteId) return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });

  const parsed = AgentUpdateSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: "Invalid request", details: parsed.error.flatten() }), { status: 400 });
  }

  const agent = await databases.updateDocument(DB_ID, COLLECTIONS.AGENTS, id, parsed.data) as unknown as AppwriteDoc<AgentDoc>;
  return Response.json({ agent });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId: appwriteId } = await auth();
  if (!appwriteId) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

  const { id } = await params;
  const { databases } = createAdminClient();

  let agent: AppwriteDoc<AgentDoc>;
  try {
    agent = await databases.getDocument(DB_ID, COLLECTIONS.AGENTS, id) as unknown as AppwriteDoc<AgentDoc>;
  } catch {
    return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
  }

  if (agent.userId !== appwriteId) return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });

  await databases.updateDocument(DB_ID, COLLECTIONS.AGENTS, id, { status: "ARCHIVED" });
  return Response.json({ success: true });
}
