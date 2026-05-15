import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const reputation = await prisma.reputation.findUnique({
    where: { userId },
  });

  if (!reputation) {
    return NextResponse.json(null, { status: 404 });
  }

  return NextResponse.json(reputation);
}
