import { NextResponse } from "next/server";
import { db } from "@/db";
import { challengeParticipants } from "@/db/schema/challenge";
import { desc } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth/server";

export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  try {
    const participants = await db
      .select()
      .from(challengeParticipants)
      .orderBy(desc(challengeParticipants.joinedAt));

    return NextResponse.json({ participants });
  } catch (error) {
    console.error("Admin participants error:", error);
    return NextResponse.json(
      { error: "Failed to fetch participants." },
      { status: 500 }
    );
  }
}
