import { NextResponse } from "next/server";
import { db } from "@/db";
import { winners, challengeProjects, challengeParticipants } from "@/db/schema/challenge";
import { eq, isNotNull } from "drizzle-orm";

// GET — Fetch published winners (public)
export async function GET() {
  try {
    const result = await db
      .select({
        id: winners.id,
        placement: winners.placement,
        prizeAmount: winners.prizeAmount,
        publishedAt: winners.publishedAt,
        projectName: challengeProjects.name,
        projectSlug: challengeProjects.slug,
        projectOneLiner: challengeProjects.oneLiner,
        participantName: challengeParticipants.fullName,
        participantTwitter: challengeParticipants.twitterHandle,
      })
      .from(winners)
      .innerJoin(challengeProjects, eq(winners.projectId, challengeProjects.id))
      .innerJoin(challengeParticipants, eq(winners.participantId, challengeParticipants.id))
      .where(isNotNull(winners.publishedAt))
      .orderBy(winners.placement);

    return NextResponse.json({ winners: result });
  } catch (error) {
    console.error("Public winners fetch error:", error);
    return NextResponse.json({ winners: [] });
  }
}
