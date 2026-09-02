import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/appwrite";
import { DB_ID, COLLECTIONS } from "@/lib/db";

export async function GET() {
  try {
    const { databases } = createAdminClient();
    const r = await databases.listDocuments(DB_ID, COLLECTIONS.CHALLENGE_SUBMISSIONS, []);
    return NextResponse.json({ submissions: r.documents });
  } catch { return NextResponse.json({ submissions: [] }); }
}
