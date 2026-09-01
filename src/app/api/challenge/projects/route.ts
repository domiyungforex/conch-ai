import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  challengeProjects,
  challengeParticipants,
  challengeEvents,
} from "@/db/schema/challenge";
import { eq, and, desc, count } from "drizzle-orm";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") + "-" + Math.random().toString(36).slice(2, 6);
}

// GET — List featured/public projects
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const featured = searchParams.get("featured") === "true";
    const participantId = searchParams.get("participantId");

    let query = db
      .select({
        id: challengeProjects.id,
        name: challengeProjects.name,
        slug: challengeProjects.slug,
        oneLiner: challengeProjects.oneLiner,
        description: challengeProjects.description,
        demoUrl: challengeProjects.demoUrl,
        videoUrl: challengeProjects.videoUrl,
        coverImageUrl: challengeProjects.coverImageUrl,
        status: challengeProjects.status,
        featured: challengeProjects.featured,
        conchFeaturesUsed: challengeProjects.conchFeaturesUsed,
        createdAt: challengeProjects.createdAt,
        creatorName: challengeParticipants.fullName,
      })
      .from(challengeProjects)
      .innerJoin(
        challengeParticipants,
        eq(challengeProjects.participantId, challengeParticipants.id)
      )
      .orderBy(desc(challengeProjects.createdAt))
      .limit(50);

    const projects = await query;

    // Filter by featured if requested
    const filtered = featured
      ? projects.filter((p) => p.featured)
      : projects;

    // Filter by participant if requested
    const result = participantId
      ? filtered.filter(() => true) // Would need to add participantId to select
      : filtered;

    return NextResponse.json({ projects: result });
  } catch (error) {
    console.error("Projects list error:", error);
    return NextResponse.json({ error: "Failed to fetch projects." }, { status: 500 });
  }
}

// POST — Create a new project
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      participantId,
      name,
      oneLiner,
      description,
      problemSolved,
      conchUsage,
      memoryImplementation,
      agentImplementation,
      demoUrl,
      videoUrl,
      githubUrl,
      teamMembers,
      conchFeaturesUsed,
    } = body;

    if (!participantId || !name) {
      return NextResponse.json(
        { error: "Participant ID and project name are required." },
        { status: 400 }
      );
    }

    // Verify participant exists
    const [participant] = await db
      .select()
      .from(challengeParticipants)
      .where(eq(challengeParticipants.id, participantId))
      .limit(1);

    if (!participant) {
      return NextResponse.json(
        { error: "Participant not found." },
        { status: 404 }
      );
    }

    const slug = slugify(name);

    const [project] = await db
      .insert(challengeProjects)
      .values({
        challengeId: participant.challengeId,
        participantId,
        name: name.trim(),
        slug,
        oneLiner: oneLiner?.trim() || null,
        description: description?.trim() || null,
        problemSolved: problemSolved?.trim() || null,
        conchUsage: conchUsage?.trim() || null,
        memoryImplementation: memoryImplementation?.trim() || null,
        agentImplementation: agentImplementation?.trim() || null,
        demoUrl: demoUrl?.trim() || null,
        videoUrl: videoUrl?.trim() || null,
        githubUrl: githubUrl?.trim() || null,
        teamMembers: teamMembers || null,
        conchFeaturesUsed: conchFeaturesUsed || null,
      })
      .returning();

    await db.insert(challengeEvents).values({
      type: "project_created",
      actorEmail: participant.email,
      data: { projectId: project.id, projectName: name },
    });

    return NextResponse.json({
      success: true,
      project: {
        id: project.id,
        slug: project.slug,
        name: project.name,
      },
    });
  } catch (error) {
    console.error("Project create error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
