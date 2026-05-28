import { auth, createAdminClient } from "@/lib/appwrite";
import { DB_ID, COLLECTIONS, type MemoryDoc, type AppwriteDoc } from "@/lib/db";
import { generateEmbedding } from "@/lib/embeddings";
import { getPineconeIndex } from "@/lib/pinecone";
import { SearchSchema } from "@/lib/validators";
import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { Query } from "node-appwrite";

export async function POST(req: Request) {
  const { userId: appwriteId } = await auth();
  if (!appwriteId) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

  const rateCheck = checkRateLimit(`search:${appwriteId}`, 30, 60_000);
  if (!rateCheck.success) return rateLimitResponse(rateCheck.resetAt);

  const parsed = SearchSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: "Invalid request", details: parsed.error.flatten() }), { status: 400 });
  }

  const { query, topK, category, minScore } = parsed.data;

  let queryVector: number[];
  try {
    queryVector = await generateEmbedding(query);
  } catch (err) {
    console.error("[search] embedding failed:", err);
    return new Response(JSON.stringify({ error: "Search unavailable. Please try again." }), { status: 503 });
  }

  try {
    const index = getPineconeIndex();
    const filter: Record<string, string> = { userId: appwriteId };
    if (category) filter.category = category;

    const pineconeResults = await index.query({
      vector: queryVector,
      topK,
      filter,
      includeMetadata: true,
    });

    const relevant = pineconeResults.matches.filter((m) => (m.score ?? 0) >= minScore);
    if (relevant.length === 0) return Response.json({ results: [] });

    const ids = relevant.map((m) => m.id);
    const { databases } = createAdminClient();
    const result = await databases.listDocuments(DB_ID, COLLECTIONS.MEMORIES, [
      Query.equal("pineconeId", ids),
      Query.equal("isArchived", false),
      Query.equal("userId", appwriteId),
      Query.limit(ids.length),
    ]);

    const memories = result.documents as unknown as AppwriteDoc<MemoryDoc>[];
    const scoreMap = new Map(relevant.map((m) => [m.id, m.score ?? 0]));
    const results = memories
      .map((m) => ({ memory: m, score: scoreMap.get(m.pineconeId!) ?? 0 }))
      .sort((a, b) => b.score - a.score);

    return Response.json({ results });
  } catch (err) {
    console.error("[search] vector search failed:", err);
    return new Response(JSON.stringify({ error: "Search unavailable. Please try again." }), { status: 503 });
  }
}
