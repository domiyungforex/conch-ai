import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { ApiKeyCreateSchema } from "@/lib/validators";
import { generateRandomBytes } from "@/lib/utils";
import bcrypt from "bcryptjs";

export async function GET() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });

  const apiKeys = await prisma.apiKey.findMany({
    where: { userId: user.id, isRevoked: false },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, keyPrefix: true, scope: true, lastUsedAt: true, expiresAt: true, isRevoked: true, createdAt: true },
  });

  return Response.json({ apiKeys });
}

export async function POST(req: Request) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });

  const parsed = ApiKeyCreateSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: "Invalid request", details: parsed.error.flatten() }), { status: 400 });
  }

  const rawBytes = generateRandomBytes(32);
  const fullKey = `cnch_${rawBytes}`;
  const keyPrefix = fullKey.slice(0, 12);
  const keyHash = await bcrypt.hash(fullKey, 10);

  const apiKey = await prisma.apiKey.create({
    data: {
      userId: user.id,
      name: parsed.data.name,
      keyHash,
      keyPrefix,
      scope: parsed.data.scope,
      expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null,
    },
    select: { id: true, name: true, keyPrefix: true, scope: true, lastUsedAt: true, expiresAt: true, isRevoked: true, createdAt: true },
  });

  return Response.json({ apiKey, fullKey }, { status: 201 });
}
