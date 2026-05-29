import { createAdminClient } from "@/lib/appwrite";
import { DB_ID, COLLECTIONS, type MemoryDoc, type ReputationDoc, type AppwriteDoc } from "@/lib/db";
import { generateEmbedding } from "@/lib/embeddings";
import { getPineconeIndex } from "@/lib/pinecone";
import { MemoryUpdateSchema } from "@/lib/validators";
import { Query } from "node-appwrite";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const appwriteId = "demo";

  const { id } = await params;
  const { databases } = createAdminClient();

  let memory: AppwriteDoc<MemoryDoc>;
  try {
    memory = await databases.getDocument(DB_ID, COLLECTIONS.MEMORIES, id) as unknown as AppwriteDoc<MemoryDoc>;
  } catch {
    return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
  }

  if (memory.userId !== appwriteId) return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });

  return Response.json({ memory });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const appwriteId = "demo";

  const { id } = await params;
  const { databases } = createAdminClient();

  let existing: AppwriteDoc<MemoryDoc>;
  try {
    existing = await databases.getDocument(DB_ID, COLLECTIONS.MEMORIES, id) as unknown as AppwriteDoc<MemoryDoc>;
  } catch {
    return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
  }

  if (existing.userId !== appwriteId) return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });

  const parsed = MemoryUpdateSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: "Invalid request", details: parsed.error.flatten() }), { status: 400 });
  }

  const memory = await databases.updateDocument(DB_ID, COLLECTIONS.MEMORIES, id, parsed.data) as unknown as AppwriteDoc<MemoryDoc>;

  if (parsed.data.content && parsed.data.content !== existing.content) {
    try {
      const embedding = await generateEmbedding(memory.content);
      const index = getPineconeIndex();
      await index.upsert([{
        id: memory.$id,
        values: embedding,
        metadata: { userId: appwriteId, category: memory.category, memoryId: memory.$id },
      }]);
    } catch {
      // Continue even if vector update fails
    }
  }

  return Response.json({ memory });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const appwriteId = "demo";

  const { id } = await params;
  const { databases } = createAdminClient();

  let memory: AppwriteDoc<MemoryDoc>;
  try {
    memory = await databases.getDocument(DB_ID, COLLECTIONS.MEMORIES, id) as unknown as AppwriteDoc<MemoryDoc>;
  } catch {
    return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
  }

  if (memory.userId !== appwriteId) return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });

  if (memory.pineconeId) {
    try {
      const index = getPineconeIndex();
      await index.deleteOne(memory.pineconeId);
    } catch {
      // Continue with DB delete even if Pinecone delete fails
    }
  }

  await databases.deleteDocument(DB_ID, COLLECTIONS.MEMORIES, id);

  try {
    const repResult = await databases.listDocuments(DB_ID, COLLECTIONS.REPUTATIONS, [
      Query.equal("userId", appwriteId), Query.limit(1),
    ]);
    if (repResult.documents.length > 0) {
      const rep = repResult.documents[0] as unknown as AppwriteDoc<ReputationDoc>;
      await databases.updateDocument(DB_ID, COLLECTIONS.REPUTATIONS, rep.$id, {
        memoryCount: Math.max(0, rep.memoryCount - 1),
      });
    }
  } catch {
    // Non-critical
  }

  return Response.json({ success: true });
}
