import { NextResponse } from "next/server";
import { db } from "@/db";
import {
  challenges,
  challengeParticipants,
  challengeProjects,
  projectSubmissions,
  waitlistSignups,
} from "@/db/schema/challenge";
import { count } from "drizzle-orm";

// GET — Public challenge stats
export async function GET() {
  try {
    const [challengeResult] = await db
      .select()
      .from(challenges)
      .limit(1);

    const [participantCount] = await db
      .select({ value: count() })
      .from(challengeParticipants);

    const [projectCount] = await db
      .select({ value: count() })
      .from(challengeProjects);

    const [submissionCount] = await db
      .select({ value: count() })
      .from(projectSubmissions);

    const [waitlistCount] = await db
      .select({ value: count() })
      .from(waitlistSignups);

    return NextResponse.json({
      challenge: challengeResult || null,
      participants: participantCount.value,
      projects: projectCount.value,
      submissions: submissionCount.value,
      waitlist: waitlistCount.value,
    });
  } catch (error) {
    console.error("Stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats." },
      { status: 500 }
    );
  }
}
