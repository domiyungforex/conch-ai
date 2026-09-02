import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/appwrite";
import { DB_ID, COLLECTIONS } from "@/lib/db";
import { Query } from "appwrite";

function slugify(n: string) { return n.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + "-" + Math.random().toString(36).slice(2, 6); }

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const { databases } = createAdminClient();
    const q = [Query.orderDesc("$createdAt"), Query.limit(50)];
    if (searchParams.get("featured") === "true") q.push(Query.equal("featured", true));
    const r = await databases.listDocuments(DB_ID, COLLECTIONS.CHALLENGE_PROJECTS, q);
    return NextResponse.json({ projects: r.documents });
  } catch { return NextResponse.json({ projects: [] }); }
}

export async function POST(request: NextRequest) {
  try {
    const b = await request.json();
    if (!b.participantId || !b.name) return NextResponse.json({ error: "Required." }, { status: 400 });
    const { databases } = createAdminClient();
    const doc = await databases.createDocument(DB_ID, COLLECTIONS.CHALLENGE_PROJECTS, "unique()", {
      challengeId: "default", participantId: b.participantId, name: b.name.trim(), slug: slugify(b.name),
      oneLiner: b.oneLiner?.trim() || null, description: b.description?.trim() || null,
      problemSolved: b.problemSolved?.trim() || null, conchUsage: b.conchUsage?.trim() || null,
      memoryImplementation: b.memoryImplementation?.trim() || null, agentImplementation: b.agentImplementation?.trim() || null,
      demoUrl: b.demoUrl?.trim() || null, videoUrl: b.videoUrl?.trim() || null, githubUrl: b.githubUrl?.trim() || null,
      status: "idea", featured: false,
    });
    return NextResponse.json({ success: true, project: { id: doc.$id, slug: doc.slug, name: doc.name } });
  } catch { return NextResponse.json({ error: "Failed." }, { status: 500 }); }
}
