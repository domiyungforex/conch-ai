import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

  const { id } = await params;
  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });

  const apiKey = await prisma.apiKey.findFirst({ where: { id, userId: user.id } });
  if (!apiKey) return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });

  await prisma.apiKey.update({ where: { id }, data: { isRevoked: true } });

  return Response.json({ success: true });
}
