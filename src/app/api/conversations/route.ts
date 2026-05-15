import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { ConversationCreateSchema } from "@/lib/validators";

export async function GET(req: Request) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10), 50);
  const skip = (page - 1) * limit;

  const [conversations, total] = await Promise.all([
    prisma.conversation.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      skip,
      take: limit,
      include: { _count: { select: { messages: true } }, agent: { select: { id: true, name: true } } },
    }),
    prisma.conversation.count({ where: { userId: user.id } }),
  ]);

  return Response.json({ conversations, total, page, limit });
}

export async function POST(req: Request) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });

  const parsed = ConversationCreateSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return new Response(JSON.stringify({ error: "Invalid request" }), { status: 400 });

  const conversation = await prisma.conversation.create({
    data: {
      userId: user.id,
      agentId: parsed.data.agentId ?? null,
      title: parsed.data.title ?? "New Conversation",
    },
  });

  return Response.json({ conversation }, { status: 201 });
}
