import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  projectSubmissions,
  challengeProjects,
  challengeEvents,
} from "@/db/schema/challenge";
import { eq, and } from "drizzle-orm";
import { requireAdmin, requireAuth } from "@/lib/auth/server";

// POST — Submit a project (requires auth)
export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const { projectId } = body;

    if (!projectId) {
      return NextResponse.json(
        { error: "Project ID is required." },
        { status: 400 }
      );
    }

    // Verify project exists
    const [project] = await db
      .select()
      .from(challengeProjects)
      .where(eq(challengeProjects.id, projectId))
      .limit(1);

    if (!project) {
      return NextResponse.json(
        { error: "Project not found." },
        { status: 404 }
      );
    }

    // Check if already submitted
    const [existing] = await db
      .select()
      .from(projectSubmissions)
      .where(
        and(
          eq(projectSubmissions.projectId, projectId),
          eq(projectSubmissions.status, "submitted")
        )
      )
      .limit(1);

    if (existing) {
      return NextResponse.json(
        { error: "This project has already been submitted." },
        { status: 409 }
      );
    }

    // Create or update submission
    let submission;
    const [existingDraft] = await db
      .select()
      .from(projectSubmissions)
      .where(eq(projectSubmissions.projectId, projectId))
      .limit(1);

    if (existingDraft) {
      [submission] = await db
        .update(projectSubmissions)
        .set({
          status: "submitted",
          submittedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(projectSubmissions.id, existingDraft.id))
        .returning();
    } else {
      [submission] = await db
        .insert(projectSubmissions)
        .values({
          projectId,
          status: "submitted",
          submittedAt: new Date(),
        })
        .returning();
    }

    // Update project status
    await db
      .update(challengeProjects)
      .set({ status: "submitted", updatedAt: new Date() })
      .where(eq(challengeProjects.id, projectId));

    // Log event
    await db.insert(challengeEvents).values({
      type: "project_submitted",
      actorEmail: auth.session.user.email,
      data: { projectId, submissionId: submission.id },
    });

    return NextResponse.json({
      success: true,
      submission: {
        id: submission.id,
        status: submission.status,
        submittedAt: submission.submittedAt,
      },
    });
  } catch (error) {
    console.error("Submission error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}

// GET — List submissions (admin only)
export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  try {
    const submissions = await db
      .select({
        id: projectSubmissions.id,
        status: projectSubmissions.status,
        submittedAt: projectSubmissions.submittedAt,
        createdAt: projectSubmissions.createdAt,
        projectName: challengeProjects.name,
        projectSlug: challengeProjects.slug,
      })
      .from(projectSubmissions)
      .innerJoin(
        challengeProjects,
        eq(projectSubmissions.projectId, challengeProjects.id)
      );

    return NextResponse.json({ submissions });
  } catch (error) {
    console.error("Submissions list error:", error);
    return NextResponse.json(
      { error: "Failed to fetch submissions." },
      { status: 500 }
    );
  }
}
