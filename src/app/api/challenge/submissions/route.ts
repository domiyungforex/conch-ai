import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/appwrite";
import { DB_ID, COLLECTIONS } from "@/lib/db";
import { Query } from "appwrite";

export async function POST(request: NextRequest) {
  try {
    const { projectId } = await request.json();
    if (!projectId) return NextResponse.json({ error: "Project ID required." }, { status: 400 });
    const { databases } = createAdminClient();
    const ex = await databases.listDocuments(DB_ID, COLLECTIONS.CHALLENGE_SUBMISSIONS, [Query.equal("projectId", projectId), Query.equal("status", "submitted"), Query.limit(1)]);
    if (ex.total > 0) return NextResponse.json({ error: "Already submitted." }, { status: 409 });
    const doc = await databases.createDocument(DB_ID, COLLECTIONS.CHALLENGE_SUBMISSIONS, "unique()", { projectId, status: "submitted", submittedAt: new Date().toISOString() });
    await databases.updateDocument(DB_ID, COLLECTIONS.CHALLENGE_PROJECTS, projectId, { status: "submitted" });
    return NextResponse.json({ success: true, submission: { id: doc.$id, status: doc.status } });
  } catch { return NextResponse.json({ error: "Failed." }, { status: 500 }); }
}

export async function GET() {
  try {
    const { databases } = createAdminClient();
    const r = await databases.listDocuments(DB_ID, COLLECTIONS.CHALLENGE_SUBMISSIONS, []);
    return NextResponse.json({ submissions: r.documents });
  } catch { return NextResponse.json({ submissions: [] }); }
}
