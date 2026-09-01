import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/appwrite";
import { DB_ID, COLLECTIONS } from "@/lib/db";

export async function GET() {
  try {
    const { databases } = createAdminClient();
    const [waitlist, participants, projects, submissions] = await Promise.all([
      databases.listDocuments(DB_ID, COLLECTIONS.CHALLENGE_WAITLIST, []),
      databases.listDocuments(DB_ID, COLLECTIONS.CHALLENGE_PARTICIPANTS, []),
      databases.listDocuments(DB_ID, COLLECTIONS.CHALLENGE_PROJECTS, []),
      databases.listDocuments(DB_ID, COLLECTIONS.CHALLENGE_SUBMISSIONS, []),
    ]);

    return NextResponse.json({
      waitlist: waitlist.total,
      participants: participants.total,
      projects: projects.total,
      submissions: submissions.total,
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed." }, { status: 500 });
  }
}
