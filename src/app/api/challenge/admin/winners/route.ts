import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/appwrite";
import { DB_ID, COLLECTIONS } from "@/lib/db";
import { Query } from "appwrite";

export async function GET() {
  try {
    const { databases } = createAdminClient();
    const [w, p] = await Promise.all([
      databases.listDocuments(DB_ID, COLLECTIONS.CHALLENGE_WINNERS, [Query.orderAsc("placement")]),
      databases.listDocuments(DB_ID, COLLECTIONS.CHALLENGE_PROJECTS, [Query.equal("status", "submitted")]),
    ]);
    return NextResponse.json({ winners: w.documents, topProjects: p.documents });
  } catch { return NextResponse.json({ winners: [], topProjects: [] }); }
}

export async function POST(request: NextRequest) {
  try {
    const { projectId, participantId, placement, prizeAmount } = await request.json();
    if (!projectId || !participantId || !placement || !prizeAmount) return NextResponse.json({ error: "All fields required." }, { status: 400 });
    const { databases } = createAdminClient();
    const ex = await databases.listDocuments(DB_ID, COLLECTIONS.CHALLENGE_WINNERS, [Query.equal("placement", placement), Query.limit(1)]);
    if (ex.total > 0) return NextResponse.json({ error: `Placement ${placement} already awarded.` }, { status: 409 });
    const ch = await databases.listDocuments(DB_ID, COLLECTIONS.CHALLENGE, []);
    const doc = await databases.createDocument(DB_ID, COLLECTIONS.CHALLENGE_WINNERS, "unique()", {
      challengeId: ch.documents[0]?.$id || "default", projectId, participantId, placement, prizeAmount,
    });
    return NextResponse.json({ success: true, winner: { id: doc.$id, placement, prizeAmount } });
  } catch { return NextResponse.json({ error: "Failed." }, { status: 500 }); }
}

export async function DELETE(request: NextRequest) {
  try {
    const id = new URL(request.url).searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required." }, { status: 400 });
    const { databases } = createAdminClient();
    await databases.deleteDocument(DB_ID, COLLECTIONS.CHALLENGE_WINNERS, id);
    return NextResponse.json({ success: true });
  } catch { return NextResponse.json({ error: "Failed." }, { status: 500 }); }
}
