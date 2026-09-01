import { NextResponse } from "next/server";
import { db } from "@/db";
import { waitlistSignups } from "@/db/schema/challenge";
import { desc } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth/server";

// GET — Fetch all waitlist signups (admin only)
export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  try {
    const signups = await db
      .select()
      .from(waitlistSignups)
      .orderBy(desc(waitlistSignups.createdAt));

    return NextResponse.json({ signups });
  } catch (error) {
    console.error("Admin waitlist error:", error);
    return NextResponse.json(
      { error: "Failed to fetch waitlist." },
      { status: 500 }
    );
  }
}
