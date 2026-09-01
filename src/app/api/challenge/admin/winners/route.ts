import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  winners,
  challengeProjects,
  challengeParticipants,
  challenges,
  challengeEvents,
} from "@/db/schema/challenge";
import { eq, desc } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth/server";

// GET — List current winners (admin)
export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  try {
    const [challenge] = await db.select().from(challenges).limit(1);

    const result = await db
      .select({
        id: winners.id,
        placement: winners.placement,
        prizeAmount: winners.prizeAmount,
        publishedAt: winners.publishedAt,
        createdAt: winners.createdAt,
        projectName: challengeProjects.name,
        projectSlug: challengeProjects.slug,
        projectOneLiner: challengeProjects.oneLiner,
        participantName: challengeParticipants.fullName,
        participantEmail: challengeParticipants.email,
      })
      .from(winners)
      .innerJoin(challengeProjects, eq(winners.projectId, challengeProjects.id))
      .innerJoin(challengeParticipants, eq(winners.participantId, challengeParticipants.id))
      .orderBy(winners.placement);

    // Also get top submissions for potential winner selection
    const topProjects = await db
      .select({
        projectId: challengeProjects.id,
        projectName: challengeProjects.name,
        projectSlug: challengeProjects.slug,
        projectOneLiner: challengeProjects.oneLiner,
        participantId: challengeParticipants.id,
        participantName: challengeParticipants.fullName,
        participantEmail: challengeParticipants.email,
      })
      .from(challengeProjects)
      .innerJoin(challengeParticipants, eq(challengeProjects.participantId, challengeParticipants.id))
      .where(eq(challengeProjects.status, "submitted"))
      .orderBy(desc(challengeProjects.createdAt));

    return NextResponse.json({
      challenge: challenge || null,
      winners: result,
      topProjects,
    });
  } catch (error) {
    console.error("Winners fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch winners." },
      { status: 500 }
    );
  }
}

// POST — Select or update a winner (admin)
export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const { projectId, participantId, placement, prizeAmount } = body;

    if (!projectId || !participantId || !placement || !prizeAmount) {
      return NextResponse.json(
        { error: "projectId, participantId, placement, and prizeAmount are required." },
        { status: 400 }
      );
    }

    if (placement < 1 || placement > 3) {
      return NextResponse.json(
        { error: "Placement must be 1, 2, or 3." },
        { status: 400 }
      );
    }

    // Get active challenge
    const [challenge] = await db.select().from(challenges).limit(1);
    if (!challenge) {
      return NextResponse.json(
        { error: "No active challenge found." },
        { status: 404 }
      );
    }

    // Check if this placement is already taken
    const existingWinner = await db
      .select()
      .from(winners)
      .where(
        eq(winners.placement, placement)
      )
      .limit(1);

    if (existingWinner.length > 0) {
      return NextResponse.json(
        { error: `Placement ${placement} is already awarded. Delete the existing winner first.` },
        { status: 409 }
      );
    }

    // Create winner record
    const [winner] = await db
      .insert(winners)
      .values({
        challengeId: challenge.id,
        projectId,
        participantId,
        placement,
        prizeAmount,
      })
      .returning();

    // Log event
    await db.insert(challengeEvents).values({
      type: "winner_selected",
      actorEmail: auth.session.user.email,
      data: {
        placement,
        prizeAmount,
        projectId,
        participantId,
        winnerId: winner.id,
      },
    });

    return NextResponse.json({
      success: true,
      winner: {
        id: winner.id,
        placement: winner.placement,
        prizeAmount: winner.prizeAmount,
      },
    });
  } catch (error) {
    console.error("Winner selection error:", error);
    return NextResponse.json(
      { error: "Failed to select winner." },
      { status: 500 }
    );
  }
}

// DELETE — Remove a winner (admin)
export async function DELETE(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  try {
    const { searchParams } = new URL(request.url);
    const winnerId = searchParams.get("id");

    if (!winnerId) {
      return NextResponse.json(
        { error: "Winner ID is required." },
        { status: 400 }
      );
    }

    const [existing] = await db
      .select()
      .from(winners)
      .where(eq(winners.id, winnerId))
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { error: "Winner not found." },
        { status: 404 }
      );
    }

    await db.delete(winners).where(eq(winners.id, winnerId));

    await db.insert(challengeEvents).values({
      type: "winner_removed",
      actorEmail: auth.session.user.email,
      data: {
        winnerId,
        placement: existing.placement,
        projectId: existing.projectId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Winner removal error:", error);
    return NextResponse.json(
      { error: "Failed to remove winner." },
      { status: 500 }
    );
  }
}
