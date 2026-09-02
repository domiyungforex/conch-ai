import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/appwrite";
import { DB_ID, COLLECTIONS } from "@/lib/db";

export async function GET() {
  try {
    const { databases } = createAdminClient();
    const result = await databases.listDocuments(DB_ID, COLLECTIONS.CHALLENGE, []);
    const ch = result.documents[0];
    if (!ch) return NextResponse.json({ deadline: null, phase: null, dates: null });

    const now = Date.now();
    let activeDeadline: string | null = null;
    let deadlineLabel = "Challenge Deadline";

    if (ch.submissionDeadline && new Date(ch.submissionDeadline).getTime() > now) { activeDeadline = ch.submissionDeadline; deadlineLabel = "Submission Deadline"; }
    if (!activeDeadline && ch.endDate && new Date(ch.endDate).getTime() > now) { activeDeadline = ch.endDate; deadlineLabel = "Challenge Ends"; }
    if (!activeDeadline && ch.winnerAnnouncementDate && new Date(ch.winnerAnnouncementDate).getTime() > now) { activeDeadline = ch.winnerAnnouncementDate; deadlineLabel = "Winners Announced"; }

    return NextResponse.json({ deadline: activeDeadline, deadlineLabel, phase: ch.phase, dates: { start: ch.startDate, end: ch.endDate, submission: ch.submissionDeadline, judging: ch.judgingStart, winnerAnnouncement: ch.winnerAnnouncementDate } });
  } catch { return NextResponse.json({ deadline: null, phase: null, dates: null }); }
}
