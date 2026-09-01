import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { challenges, challengeEvents } from "@/db/schema/challenge";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth/server";

// GET — Fetch current challenge settings (public)
export async function GET() {
  try {
    const [challenge] = await db.select().from(challenges).limit(1);
    return NextResponse.json({ challenge: challenge || null });
  } catch (error) {
    console.error("Settings fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch settings." }, { status: 500 });
  }
}

// PUT — Update challenge settings (admin only)
export async function PUT(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const [existing] = await db.select().from(challenges).limit(1);

    if (existing) {
      await db
        .update(challenges)
        .set({
          title: body.title,
          description: body.description,
          phase: body.phase,
          startDate: body.startDate ? new Date(body.startDate) : existing.startDate,
          endDate: body.endDate ? new Date(body.endDate) : existing.endDate,
          submissionDeadline: body.submissionDeadline ? new Date(body.submissionDeadline) : existing.submissionDeadline,
          judgingStart: body.judgingStart ? new Date(body.judgingStart) : existing.judgingStart,
          winnerAnnouncementDate: body.winnerAnnouncementDate ? new Date(body.winnerAnnouncementDate) : existing.winnerAnnouncementDate,
          totalPrizeFund: body.totalPrizeFund,
          firstPrize: body.firstPrize,
          secondPrize: body.secondPrize,
          thirdPrize: body.thirdPrize,
          updatedAt: new Date(),
        })
        .where(eq(challenges.id, existing.id));
    } else {
      await db.insert(challenges).values({
        title: body.title,
        description: body.description,
        phase: body.phase,
        startDate: body.startDate ? new Date(body.startDate) : null,
        endDate: body.endDate ? new Date(body.endDate) : null,
        submissionDeadline: body.submissionDeadline ? new Date(body.submissionDeadline) : null,
        judgingStart: body.judgingStart ? new Date(body.judgingStart) : null,
        winnerAnnouncementDate: body.winnerAnnouncementDate ? new Date(body.winnerAnnouncementDate) : null,
        totalPrizeFund: body.totalPrizeFund,
        firstPrize: body.firstPrize,
        secondPrize: body.secondPrize,
        thirdPrize: body.thirdPrize,
      });
    }

    await db.insert(challengeEvents).values({
      type: "settings_updated",
      actorEmail: auth.session.user.email,
      data: { updatedFields: Object.keys(body) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Settings update error:", error);
    return NextResponse.json({ error: "Failed to update settings." }, { status: 500 });
  }
}
