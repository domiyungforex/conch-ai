import { auth } from "@/lib/appwrite";
import { generateEmbedding } from "@/lib/embeddings";
import { getPineconeIndex } from "@/lib/pinecone";
import { z } from "zod";

const EmbeddingSchema = z.object({
  text: z.string().min(1).max(8000),
  memoryId: z.string().optional(),
});

export async function POST(req: Request) {
  const { userId: appwriteId } = await auth();
  if (!appwriteId) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

  const parsed = EmbeddingSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: "Invalid request" }), { status: 400 });
  }

  const embedding = await generateEmbedding(parsed.data.text);

  if (parsed.data.memoryId) {
    const index = getPineconeIndex();
    await index.upsert([{
      id: parsed.data.memoryId,
      values: embedding,
      metadata: { userId: appwriteId },
    }]);
  }

  return Response.json({ dimensions: embedding.length });
}
