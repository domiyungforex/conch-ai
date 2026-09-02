import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/appwrite";
import { DB_ID, COLLECTIONS } from "@/lib/db";
import { Query } from "appwrite";

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const { databases } = createAdminClient();
    const r = await databases.listDocuments(DB_ID, COLLECTIONS.CHALLENGE_PROJECTS, [Query.equal("slug", slug), Query.limit(1)]);
    if (r.documents.length === 0) return NextResponse.json({ error: "Not found." }, { status: 404 });
    return NextResponse.json({ project: r.documents[0] });
  } catch { return NextResponse.json({ error: "Failed." }, { status: 500 }); }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const body = await request.json();
    const { databases } = createAdminClient();
    const r = await databases.listDocuments(DB_ID, COLLECTIONS.CHALLENGE_PROJECTS, [Query.equal("slug", slug), Query.limit(1)]);
    if (r.documents.length === 0) return NextResponse.json({ error: "Not found." }, { status: 404 });
    const update: Record<string, unknown> = {};
    for (const f of ["name", "oneLiner", "description", "problemSolved", "conchUsage", "memoryImplementation", "agentImplementation", "demoUrl", "videoUrl", "githubUrl", "coverImageUrl", "status"]) if (body[f] !== undefined) update[f] = body[f];
    await databases.updateDocument(DB_ID, COLLECTIONS.CHALLENGE_PROJECTS, r.documents[0].$id, update);
    return NextResponse.json({ success: true });
  } catch { return NextResponse.json({ error: "Failed." }, { status: 500 }); }
}
