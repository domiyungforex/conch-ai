import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { generateEmbedding } from "@/lib/embeddings";
import { getPineconeIndex } from "@/lib/pinecone";
import { MemoryCreateSchema } from "@/lib/validators";
import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";

export async function GET(req: Request) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") ?? undefined;
  const archived = searchParams.get("archived") === "true";
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10), 100);
  const skip = (page - 1) * limit;

  const where = {
    userId: user.id,
    isArchived: archived,
    ...(category && { category: category as "EPISODIC" | "SEMANTIC" | "PREFERENCE" | "PROCEDURAL" }),
  };

  const [memories, total] = await Promise.all([
    prisma.memory.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.memory.count({ where }),
  ]);

  return Response.json({ memories, total, page, limit });
}

export async function POST(req: Request) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

  const rateCheck = checkRateLimit(`memory:create:${clerkId}`, 20, 60_000);
  if (!rateCheck.success) return rateLimitResponse(rateCheck.resetAt);

  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });

  const parsed = MemoryCreateSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: "Invalid request", details: parsed.error.flatten() }), { status: 400 });
  }

  const memory = await prisma.memory.create({
    data: { userId: user.id, ...parsed.data },
  });

  try {
    const embedding = await generateEmbedding(memory.content);
    const index = getPineconeIndex();
    await index.upsert([{
      id: memory.id,
      values: embedding,
      metadata: { userId: user.id, category: memory.category, memoryId: memory.id },
    }]);
    await prisma.memory.update({ where: { id: memory.id }, data: { pineconeId: memory.id } });
    memory.pineconeId = memory.id;
  } catch {
    // Memory saved to DB even if vector upsert fails
  }

  await prisma.reputation.updateMany({
    where: { userId: user.id },
    data: { memoryCount: { increment: 1 } },
  });

  return Response.json({ memory }, { status: 201 });
}
