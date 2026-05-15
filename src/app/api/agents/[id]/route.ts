import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { AgentUpdateSchema } from "@/lib/validators";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

  const { id } = await params;
  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });

  const agent = await prisma.agent.findFirst({
    where: { id, userId: user.id },
    include: { _count: { select: { memories: true, conversations: true } } },
  });
  if (!agent) return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });

  return Response.json({ agent });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

  const { id } = await params;
  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });

  const existing = await prisma.agent.findFirst({ where: { id, userId: user.id } });
  if (!existing) return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });

  const parsed = AgentUpdateSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: "Invalid request", details: parsed.error.flatten() }), { status: 400 });
  }

  const agent = await prisma.agent.update({ where: { id }, data: parsed.data });

  return Response.json({ agent });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

  const { id } = await params;
  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });

  const agent = await prisma.agent.findFirst({ where: { id, userId: user.id } });
  if (!agent) return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });

  await prisma.agent.update({ where: { id }, data: { status: "ARCHIVED" } });

  return Response.json({ success: true });
}
