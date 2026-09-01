import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/appwrite";
import { DB_ID, COLLECTIONS } from "@/lib/db";
import { Query } from "appwrite";

export async function GET() {
  try {
    const { databases } = createAdminClient();
    const result = await databases.listDocuments(DB_ID, COLLECTIONS.CHALLENGE_PROJECTS, [
      Query.orderDesc("$createdAt"),
    ]);
    return NextResponse.json({ projects: result.documents });
  } catch (error) {
    return NextResponse.json({ error: "Failed." }, { status: 500 });
  }
}
