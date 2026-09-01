import { NextResponse } from "next/server";
import { db } from "@/db";
import { challenges } from "@/db/schema/challenge";

// GET — Public endpoint returning challenge deadline dates for countdown timer
export async function GET() {
  try {
    const [challenge] = await db
      .select({
        phase: challenges.phase,
        startDate: challenges.startDate,
        endDate: challenges.endDate,
        submissionDeadline: challenges.submissionDeadline,
        judgingStart: challenges.judgingStart,
        winnerAnnouncementDate: challenges.winnerAnnouncementDate,
      })
      .from(challenges)
      .limit(1);

    if (!challenge) {
      return NextResponse.json({
        deadline: null,
        phase: null,
        dates: null,
      });
    }

    // Determine which deadline to show based on current phase
    const now = Date.now();
    let activeDeadline: string | null = null;
    let deadlineLabel = "Challenge Deadline";

    const toISOString = (d: Date | null) => d ? new Date(d).toISOString() : null;

    if (challenge.submissionDeadline) {
      const submissionTime = new Date(challenge.submissionDeadline).getTime();
      if (submissionTime > now) {
        activeDeadline = toISOString(challenge.submissionDeadline);
        deadlineLabel = "Submission Deadline";
      }
    }

    if (!activeDeadline && challenge.endDate) {
      const endTime = new Date(challenge.endDate).getTime();
      if (endTime > now) {
        activeDeadline = toISOString(challenge.endDate);
        deadlineLabel = "Challenge Ends";
      }
    }

    if (!activeDeadline && challenge.winnerAnnouncementDate) {
      const winnerTime = new Date(challenge.winnerAnnouncementDate).getTime();
      if (winnerTime > now) {
        activeDeadline = toISOString(challenge.winnerAnnouncementDate);
        deadlineLabel = "Winners Announced";
      }
    }

    return NextResponse.json({
      deadline: activeDeadline,
      deadlineLabel,
      phase: challenge.phase,
      dates: {
        start: toISOString(challenge.startDate),
        end: toISOString(challenge.endDate),
        submission: toISOString(challenge.submissionDeadline),
        judging: toISOString(challenge.judgingStart),
        winnerAnnouncement: toISOString(challenge.winnerAnnouncementDate),
      },
    });
  } catch (error) {
    console.error("Deadline fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch deadline." },
      { status: 500 }
    );
  }
}
