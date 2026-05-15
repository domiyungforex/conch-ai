import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { AgentCreateSchema } from "@/lib/validators";

export async function GET(req: Request) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });

  const agents = await prisma.agent.findMany({
    where: { userId: user.id, status: { not: "ARCHIVED" } },
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { memories: true, conversations: true } } },
  });

  return Response.json({ agents });
}

export async function POST(req: Request) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });

  const parsed = AgentCreateSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: "Invalid request", details: parsed.error.flatten() }), { status: 400 });
  }

  const agent = await prisma.agent.create({ data: { userId: user.id, ...parsed.data } });

  await prisma.reputation.updateMany({
    where: { userId: user.id },
    data: { agentCount: { increment: 1 } },
  });

  return Response.json({ agent }, { status: 201 });
}
