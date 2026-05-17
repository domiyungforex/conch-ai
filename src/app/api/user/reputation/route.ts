import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });

  const reputation = await prisma.reputation.findUnique({
    where: { userId: user.id },
  });

  if (!reputation) {
    return new Response(JSON.stringify({ error: "Reputation not found" }), { status: 404 });
  }

  return Response.json(reputation);
}
