import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  challengeParticipants,
  challengeProjects,
} from "@/db/schema/challenge";
import { eq, or, ilike } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;

    // Try to find by referral code first, then by name
    let participant;

    const byCode = await db
      .select()
      .from(challengeParticipants)
      .where(eq(challengeParticipants.referralCode, username))
      .limit(1);

    if (byCode.length > 0) {
      participant = byCode[0];
    } else {
      // Try by name (slug-like match)
      const slugified = username.replace(/-/g, " ");
      const byName = await db
        .select()
        .from(challengeParticipants)
        .where(ilike(challengeParticipants.fullName, `%${slugified}%`))
        .limit(1);

      if (byName.length > 0) {
        participant = byName[0];
      }
    }

    if (!participant) {
      return NextResponse.json({ error: "Builder not found." }, { status: 404 });
    }

    // Get their projects
    const projects = await db
      .select()
      .from(challengeProjects)
      .where(eq(challengeProjects.participantId, participant.id));

    return NextResponse.json({
      participant: {
        id: participant.id,
        fullName: participant.fullName,
        twitterHandle: participant.twitterHandle,
        country: participant.country,
        role: participant.role,
        joinedAt: participant.joinedAt,
      },
      projects,
    });
  } catch (error) {
    console.error("Participant lookup error:", error);
    return NextResponse.json(
      { error: "Failed to look up builder." },
      { status: 500 }
    );
  }
}
