import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/appwrite";
import { DB_ID, COLLECTIONS } from "@/lib/db";
import { Query } from "appwrite";

export async function GET() {
  try {
    const { databases } = createAdminClient();
    const r = await databases.listDocuments(DB_ID, COLLECTIONS.CHALLENGE_WINNERS, [Query.isNotNull("publishedAt"), Query.orderAsc("placement")]);
    return NextResponse.json({ winners: r.documents });
  } catch { return NextResponse.json({ winners: [] }); }
}
