import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { challengeParticipants, challenges, challengeEvents } from "@/db/schema/challenge";
import { eq, and } from "drizzle-orm";

function generateReferralCode(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 6);
  const suffix = Math.random().toString(36).slice(2, 6);
  return `cc-${base}${suffix}`;
}

// POST — Join the challenge
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fullName, email, twitterHandle, discordUsername, role, country, challengeId } = body;

    if (!fullName || !email || !role) {
      return NextResponse.json(
        { error: "Full name, email, and role are required." },
        { status: 400 }
      );
    }

    // Get or create active challenge
    let activeChallenge;
    if (challengeId) {
      const [found] = await db.select().from(challenges).where(eq(challenges.id, challengeId)).limit(1);
      activeChallenge = found;
    } else {
      const [found] = await db.select().from(challenges).limit(1);
      activeChallenge = found;
    }

    if (!activeChallenge) {
      // Create a default challenge
      const [created] = await db.insert(challenges).values({
        title: "The Conch Creator Challenge",
        description: "Build something meaningful using Conch's persistent memory and agent infrastructure.",
      }).returning();
      activeChallenge = created;
    }

    // Check for existing participation
    const existing = await db
      .select()
      .from(challengeParticipants)
      .where(
        and(
          eq(challengeParticipants.challengeId, activeChallenge.id),
          eq(challengeParticipants.email, email.toLowerCase().trim())
        )
      )
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "You've already joined this challenge." },
        { status: 409 }
      );
    }

    const referralCode = generateReferralCode(fullName);

    const [participant] = await db
      .insert(challengeParticipants)
      .values({
        challengeId: activeChallenge.id,
        fullName: fullName.trim(),
        email: email.toLowerCase().trim(),
        twitterHandle: twitterHandle?.trim() || null,
        discordUsername: discordUsername?.trim() || null,
        role,
        country: country?.trim() || null,
        referralCode,
      })
      .returning();

    await db.insert(challengeEvents).values({
      type: "challenge_joined",
      actorEmail: email.toLowerCase().trim(),
      data: { role, challengeId: activeChallenge.id },
    });

    return NextResponse.json({
      success: true,
      participantId: participant.id,
      referralCode,
      challengeId: activeChallenge.id,
    });
  } catch (error) {
    console.error("Challenge join error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
