import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/appwrite";
import { DB_ID, COLLECTIONS } from "@/lib/db";
import { Query } from "appwrite";

export async function GET(request: NextRequest, { params }: { params: Promise<{ username: string }> }) {
  try {
    const { username } = await params;
    const { databases } = createAdminClient();
    let r = await databases.listDocuments(DB_ID, COLLECTIONS.CHALLENGE_PARTICIPANTS, [Query.equal("referralCode", username), Query.limit(1)]);
    if (r.documents.length === 0) r = await databases.listDocuments(DB_ID, COLLECTIONS.CHALLENGE_PARTICIPANTS, [Query.search("fullName", username.replace(/-/g, " ")), Query.limit(1)]);
    if (r.documents.length === 0) return NextResponse.json({ error: "Not found." }, { status: 404 });
    const p = r.documents[0];
    const projects = await databases.listDocuments(DB_ID, COLLECTIONS.CHALLENGE_PROJECTS, [Query.equal("participantId", p.$id)]);
    return NextResponse.json({ participant: p, projects: projects.documents });
  } catch { return NextResponse.json({ error: "Failed." }, { status: 500 }); }
}
