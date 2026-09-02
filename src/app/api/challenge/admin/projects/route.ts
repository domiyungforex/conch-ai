import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/appwrite";
import { DB_ID, COLLECTIONS } from "@/lib/db";
import { Query } from "appwrite";

export async function GET() {
  try {
    const { databases } = createAdminClient();
    const r = await databases.listDocuments(DB_ID, COLLECTIONS.CHALLENGE_PROJECTS, [Query.orderDesc("$createdAt")]);
    return NextResponse.json({ projects: r.documents });
  } catch { return NextResponse.json({ projects: [] }); }
}
