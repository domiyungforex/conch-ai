import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { generateEmbedding } from "@/lib/embeddings";
import { getPineconeIndex } from "@/lib/pinecone";
import { MemoryUpdateSchema } from "@/lib/validators";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

  const { id } = await params;
  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });

  const memory = await prisma.memory.findFirst({ where: { id, userId: user.id } });
  if (!memory) return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });

  return Response.json({ memory });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

  const { id } = await params;
  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });

  const existing = await prisma.memory.findFirst({ where: { id, userId: user.id } });
  if (!existing) return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });

  const parsed = MemoryUpdateSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: "Invalid request", details: parsed.error.flatten() }), { status: 400 });
  }

  const memory = await prisma.memory.update({ where: { id }, data: parsed.data });

  if (parsed.data.content && parsed.data.content !== existing.content) {
    try {
      const embedding = await generateEmbedding(memory.content);
      const index = getPineconeIndex();
      await index.upsert([{
        id: memory.id,
        values: embedding,
        metadata: { userId: user.id, category: memory.category, memoryId: memory.id },
      }]);
    } catch {
      // Continue even if vector update fails
    }
  }

  return Response.json({ memory });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

  const { id } = await params;
  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });

  const memory = await prisma.memory.findFirst({ where: { id, userId: user.id } });
  if (!memory) return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });

  if (memory.pineconeId) {
    try {
      const index = getPineconeIndex();
      await index.deleteOne(memory.pineconeId);
    } catch {
      // Continue with DB delete even if Pinecone delete fails
    }
  }

  await prisma.memory.delete({ where: { id } });
  await prisma.reputation.updateMany({
    where: { userId: user.id },
    data: { memoryCount: { decrement: 1 } },
  });

  return Response.json({ success: true });
}
