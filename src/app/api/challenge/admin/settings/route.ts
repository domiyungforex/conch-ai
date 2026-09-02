import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/appwrite";
import { DB_ID, COLLECTIONS } from "@/lib/db";

export async function GET() {
  try {
    const { databases } = createAdminClient();
    const r = await databases.listDocuments(DB_ID, COLLECTIONS.CHALLENGE, []);
    return NextResponse.json({ challenge: r.documents[0] || null });
  } catch { return NextResponse.json({ challenge: null }); }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { databases } = createAdminClient();
    const r = await databases.listDocuments(DB_ID, COLLECTIONS.CHALLENGE, []);
    if (r.documents[0]) {
      await databases.updateDocument(DB_ID, COLLECTIONS.CHALLENGE, r.documents[0].$id, body);
    } else {
      await databases.createDocument(DB_ID, COLLECTIONS.CHALLENGE, "unique()", body);
    }
    return NextResponse.json({ success: true });
  } catch { return NextResponse.json({ error: "Failed." }, { status: 500 }); }
}
