import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/appwrite";
import { DB_ID, COLLECTIONS } from "@/lib/db";

export async function GET() {
  try {
    const { databases } = createAdminClient();
    const [w, p, pr, s] = await Promise.all([
      databases.listDocuments(DB_ID, COLLECTIONS.CHALLENGE_WAITLIST, []),
      databases.listDocuments(DB_ID, COLLECTIONS.CHALLENGE_PARTICIPANTS, []),
      databases.listDocuments(DB_ID, COLLECTIONS.CHALLENGE_PROJECTS, []),
      databases.listDocuments(DB_ID, COLLECTIONS.CHALLENGE_SUBMISSIONS, []),
    ]);
    return NextResponse.json({ waitlist: w.total, participants: p.total, projects: pr.total, submissions: s.total });
  } catch { return NextResponse.json({ waitlist: 0, participants: 0, projects: 0, submissions: 0 }); }
}
