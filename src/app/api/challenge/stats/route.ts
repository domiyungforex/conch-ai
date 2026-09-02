import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/appwrite";
import { DB_ID, COLLECTIONS } from "@/lib/db";

export async function GET() {
  try {
    const { databases } = createAdminClient();
    const [c, p, pr, s, w] = await Promise.all([
      databases.listDocuments(DB_ID, COLLECTIONS.CHALLENGE, []).catch(() => ({ documents: [], total: 0 })),
      databases.listDocuments(DB_ID, COLLECTIONS.CHALLENGE_PARTICIPANTS, []).catch(() => ({ total: 0 })),
      databases.listDocuments(DB_ID, COLLECTIONS.CHALLENGE_PROJECTS, []).catch(() => ({ total: 0 })),
      databases.listDocuments(DB_ID, COLLECTIONS.CHALLENGE_SUBMISSIONS, []).catch(() => ({ total: 0 })),
      databases.listDocuments(DB_ID, COLLECTIONS.CHALLENGE_WAITLIST, []).catch(() => ({ total: 0 })),
    ]);
    return NextResponse.json({ challenge: c.documents[0] || null, participants: p.total, projects: pr.total, submissions: s.total, waitlist: w.total });
  } catch { return NextResponse.json({ challenge: null, participants: 0, projects: 0, submissions: 0, waitlist: 0 }); }
}
