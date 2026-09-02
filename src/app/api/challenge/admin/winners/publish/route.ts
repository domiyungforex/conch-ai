import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/appwrite";
import { DB_ID, COLLECTIONS } from "@/lib/db";
import { Query } from "appwrite";

export async function POST() {
  try {
    const { databases } = createAdminClient();
    const now = new Date().toISOString();
    const r = await databases.listDocuments(DB_ID, COLLECTIONS.CHALLENGE_WINNERS, [Query.isNull("publishedAt")]);
    for (const doc of r.documents) {
      await databases.updateDocument(DB_ID, COLLECTIONS.CHALLENGE_WINNERS, doc.$id, { publishedAt: now });
    }
    return NextResponse.json({ success: true, publishedAt: now });
  } catch { return NextResponse.json({ error: "Failed." }, { status: 500 }); }
}
