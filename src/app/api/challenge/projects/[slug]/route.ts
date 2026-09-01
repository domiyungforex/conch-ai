import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  challengeProjects,
  challengeParticipants,
  projectMedia,
} from "@/db/schema/challenge";
import { eq } from "drizzle-orm";

// GET — Get project by slug (public)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const results = await db
      .select({
        id: challengeProjects.id,
        name: challengeProjects.name,
        slug: challengeProjects.slug,
        oneLiner: challengeProjects.oneLiner,
        description: challengeProjects.description,
        problemSolved: challengeProjects.problemSolved,
        conchUsage: challengeProjects.conchUsage,
        memoryImplementation: challengeProjects.memoryImplementation,
        agentImplementation: challengeProjects.agentImplementation,
        demoUrl: challengeProjects.demoUrl,
        videoUrl: challengeProjects.videoUrl,
        githubUrl: challengeProjects.githubUrl,
        coverImageUrl: challengeProjects.coverImageUrl,
        status: challengeProjects.status,
        featured: challengeProjects.featured,
        conchFeaturesUsed: challengeProjects.conchFeaturesUsed,
        teamMembers: challengeProjects.teamMembers,
        createdAt: challengeProjects.createdAt,
        creatorName: challengeParticipants.fullName,
        creatorTwitter: challengeParticipants.twitterHandle,
        creatorCountry: challengeParticipants.country,
      })
      .from(challengeProjects)
      .innerJoin(
        challengeParticipants,
        eq(challengeProjects.participantId, challengeParticipants.id)
      )
      .where(eq(challengeProjects.slug, slug))
      .limit(1);

    if (results.length === 0) {
      return NextResponse.json({ error: "Project not found." }, { status: 404 });
    }

    const project = results[0];

    // Get media
    const media = await db
      .select()
      .from(projectMedia)
      .where(eq(projectMedia.projectId, project.id));

    return NextResponse.json({
      project: { ...project, media },
    });
  } catch (error) {
    console.error("Project fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch project." }, { status: 500 });
  }
}

// PATCH — Update project (owner only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await request.json();

    // Find project
    const [existing] = await db
      .select()
      .from(challengeProjects)
      .where(eq(challengeProjects.slug, slug))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "Project not found." }, { status: 404 });
    }

    // Update fields
    const updateData: Record<string, unknown> = {};
    const allowedFields = [
      "name", "oneLiner", "description", "problemSolved",
      "conchUsage", "memoryImplementation", "agentImplementation",
      "demoUrl", "videoUrl", "githubUrl", "coverImageUrl",
      "status", "teamMembers", "conchFeaturesUsed",
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    updateData.updatedAt = new Date();

    const [updated] = await db
      .update(challengeProjects)
      .set(updateData)
      .where(eq(challengeProjects.id, existing.id))
      .returning();

    return NextResponse.json({
      success: true,
      project: {
        id: updated.id,
        slug: updated.slug,
        name: updated.name,
      },
    });
  } catch (error) {
    console.error("Project update error:", error);
    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 }
    );
  }
}
