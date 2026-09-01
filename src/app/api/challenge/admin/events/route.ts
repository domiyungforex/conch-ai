import { NextResponse } from "next/server";
import { db } from "@/db";
import { challengeEvents } from "@/db/schema/challenge";
import { desc } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth/server";

// GET — Fetch challenge audit log events (admin only)
export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  try {
    const events = await db
      .select()
      .from(challengeEvents)
      .orderBy(desc(challengeEvents.createdAt))
      .limit(200);

    return NextResponse.json({ events });
  } catch (error) {
    console.error("Events fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch events." },
      { status: 500 }
    );
  }
}
