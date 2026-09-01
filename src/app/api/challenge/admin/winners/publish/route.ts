import { NextResponse } from "next/server";
import { db } from "@/db";
import { winners, challengeEvents } from "@/db/schema/challenge";
import { isNull } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth/server";

// POST — Publish all unpublished winners (admin)
export async function POST() {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  try {
    const now = new Date();

    // Set publishedAt on all unpublished winners
    await db
      .update(winners)
      .set({ publishedAt: now })
      .where(isNull(winners.publishedAt));

    await db.insert(challengeEvents).values({
      type: "winners_published",
      actorEmail: auth.session.user.email,
      data: { publishedAt: now.toISOString() },
    });

    return NextResponse.json({ success: true, publishedAt: now.toISOString() });
  } catch (error) {
    console.error("Winners publish error:", error);
    return NextResponse.json(
      { error: "Failed to publish winners." },
      { status: 500 }
    );
  }
}
