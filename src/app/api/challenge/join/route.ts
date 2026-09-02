import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/appwrite";
import { DB_ID, COLLECTIONS } from "@/lib/db";
import { Query } from "appwrite";

function genCode(name: string) { return "cc-" + name.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 6) + Math.random().toString(36).slice(2, 6); }

export async function POST(request: NextRequest) {
  try {
    const { fullName, email, twitterHandle, discordUsername, role, country } = await request.json();
    if (!fullName || !email || !role) return NextResponse.json({ error: "Required fields missing." }, { status: 400 });

    const { databases } = createAdminClient();
    const chResult = await databases.listDocuments(DB_ID, COLLECTIONS.CHALLENGE, []);
    let challengeId = chResult.documents[0]?.$id;
    if (!challengeId) {
      const ch = await databases.createDocument(DB_ID, COLLECTIONS.CHALLENGE, "unique()", { title: "The Conch Creator Challenge", phase: "upcoming", totalPrizeFund: 5000, firstPrize: 2500, secondPrize: 1500, thirdPrize: 1000 });
      challengeId = ch.$id;
    }

    const existing = await databases.listDocuments(DB_ID, COLLECTIONS.CHALLENGE_PARTICIPANTS, [Query.equal("email", email.toLowerCase().trim()), Query.limit(1)]);
    if (existing.total > 0) return NextResponse.json({ error: "Already joined." }, { status: 409 });

    const doc = await databases.createDocument(DB_ID, COLLECTIONS.CHALLENGE_PARTICIPANTS, "unique()", {
      challengeId, fullName: fullName.trim(), email: email.toLowerCase().trim(),
      twitterHandle: twitterHandle?.trim() || null, discordUsername: discordUsername?.trim() || null,
      role, country: country?.trim() || null, referralCode: genCode(fullName),
    });
    return NextResponse.json({ success: true, participantId: doc.$id });
  } catch (error) { console.error("Join error:", error); return NextResponse.json({ error: "Failed." }, { status: 500 }); }
}
