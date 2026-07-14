import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/appwrite";
import { DB_ID, COLLECTIONS, type MemoryDoc, type ReputationDoc, type AppwriteDoc } from "@/lib/db";
import { generateEmbedding } from "@/lib/embeddings";
import { MemoryCreateSchema } from "@/lib/validators";
import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { Query, ID } from "node-appwrite";

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  const appwriteId = userId;

  const { databases } = createAdminClient();
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") ?? undefined;
  const archived = searchParams.get("archived") === "true";
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10), 100);
  const offset = (page - 1) * limit;

  const filters = [
    Query.equal("userId", appwriteId),
    Query.equal("isArchived", archived),
    Query.orderDesc("$createdAt"),
    Query.limit(limit),
    Query.offset(offset),
  ];
  if (category) filters.push(Query.equal("category", category));

  const result = await databases.listDocuments(DB_ID, COLLECTIONS.MEMORIES, filters);
  const memories = result.documents as unknown as AppwriteDoc<MemoryDoc>[];

  return Response.json({ memories, total: result.total, page, limit });
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  const appwriteId = userId;

  const rateCheck = checkRateLimit(`memory:create:${appwriteId}`, 20, 60_000);
  if (!rateCheck.success) return rateLimitResponse(rateCheck.resetAt);

  const parsed = MemoryCreateSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: "Invalid request", details: parsed.error.flatten() }), { status: 400 });
  }

  const { databases } = createAdminClient();
  const memId = ID.unique();

  let embedding: number[] = [];
  try {
    embedding = await generateEmbedding(parsed.data.content);
  } catch {
    // Memory saved even if embedding generation fails
  }

  const memory = await databases.createDocument(DB_ID, COLLECTIONS.MEMORIES, memId, {
    userId: appwriteId,
    embedding,
    isArchived: false,
    accessCount: 0,
    lastAccessed: null,
    ...parsed.data,
  }) as unknown as AppwriteDoc<MemoryDoc>;

  try {
    const repResult = await databases.listDocuments(DB_ID, COLLECTIONS.REPUTATIONS, [
      Query.equal("userId", appwriteId), Query.limit(1),
    ]);
    if (repResult.documents.length > 0) {
      const rep = repResult.documents[0] as unknown as AppwriteDoc<ReputationDoc>;
      await databases.updateDocument(DB_ID, COLLECTIONS.REPUTATIONS, rep.$id, {
        memoryCount: rep.memoryCount + 1,
      });
    }
  } catch {
    // Non-critical
  }

  return Response.json({ memory }, { status: 201 });
}
