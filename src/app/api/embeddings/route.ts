import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/appwrite";
import { DB_ID, COLLECTIONS, type MemoryDoc, type AppwriteDoc } from "@/lib/db";
import { generateEmbedding } from "@/lib/embeddings";
import { checkFeatureAccess, upgradeRequiredResponse } from "@/lib/planLimits";
import { z } from "zod";

const EmbeddingSchema = z.object({
  text: z.string().min(1).max(8000),
  memoryId: z.string().optional(),
});

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  const appwriteId = userId;

  const { databases } = createAdminClient();

  const featureAccess = await checkFeatureAccess(databases, appwriteId);
  if (!featureAccess.allowed) return upgradeRequiredResponse();

  const parsed = EmbeddingSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: "Invalid request" }), { status: 400 });
  }

  const embedding = await generateEmbedding(parsed.data.text);

  if (parsed.data.memoryId) {
    const memory = await databases.getDocument(
      DB_ID, COLLECTIONS.MEMORIES, parsed.data.memoryId
    ) as unknown as AppwriteDoc<MemoryDoc>;

    if (memory.userId !== appwriteId) {
      return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
    }
    await databases.updateDocument(DB_ID, COLLECTIONS.MEMORIES, parsed.data.memoryId, { embedding });
  }

  return Response.json({ dimensions: embedding.length });
}
