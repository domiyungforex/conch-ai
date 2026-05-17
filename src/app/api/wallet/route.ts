import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { WalletLinkSchema } from "@/lib/validators";
import { verifyMessage } from "viem";

export async function DELETE() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });

  await prisma.wallet.deleteMany({ where: { userId: user.id } });
  return new Response(null, { status: 204 });
}

export async function GET() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });

  const wallet = await prisma.wallet.findUnique({ where: { userId: user.id } });
  return Response.json({ wallet });
}

export async function POST(req: Request) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });

  const parsed = WalletLinkSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: "Invalid request", details: parsed.error.flatten() }), { status: 400 });
  }

  const { address, signature, message } = parsed.data;

  const isValid = await verifyMessage({
    address: address as `0x${string}`,
    message,
    signature: signature as `0x${string}`,
  });

  if (!isValid) {
    return new Response(JSON.stringify({ error: "Invalid signature" }), { status: 400 });
  }

  const wallet = await prisma.wallet.upsert({
    where: { userId: user.id },
    update: { address, verifiedAt: new Date() },
    create: { userId: user.id, address, chainId: 8453, verifiedAt: new Date() },
  });

  return Response.json({ wallet }, { status: 201 });
}
