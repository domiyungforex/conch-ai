import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/appwrite";
import { DB_ID, COLLECTIONS } from "@/lib/db";
import { Query } from "appwrite";
import { sendWaitlistWelcomeEmail } from "@/lib/emails";

function generateReferralCode(name: string): string {
  const base = name.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 6);
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${base}${suffix}`;
}

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (entry.count >= 5) return false;
  entry.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    if (!checkRateLimit(ip))
      return NextResponse.json({ error: "Too many requests." }, { status: 429 });

    const body = await request.json();
    const { fullName, email, twitterHandle, discordUsername, role, buildIdea, country, referralCode } = body;
    if (!fullName || !email || !role)
      return NextResponse.json({ error: "Full name, email, and role required." }, { status: 400 });

    const { databases } = createAdminClient();
    const existing = await databases.listDocuments(
      DB_ID,
      COLLECTIONS.CHALLENGE_WAITLIST,
      [Query.equal("email", email.toLowerCase().trim()), Query.limit(1)]
    );
    if (existing.total > 0)
      return NextResponse.json({ error: "Already on the waitlist!" }, { status: 409 });

    const refCode = generateReferralCode(fullName);
    await databases.createDocument(DB_ID, COLLECTIONS.CHALLENGE_WAITLIST, "unique()", {
      fullName: fullName.trim(),
      email: email.toLowerCase().trim(),
      twitterHandle: twitterHandle?.trim() || null,
      discordUsername: discordUsername?.trim() || null,
      role,
      buildIdea: buildIdea?.trim() || null,
      country: country?.trim() || null,
      referralCode: refCode,
    });

    // Send welcome email (fire-and-forget — don't block the response)
    sendWaitlistWelcomeEmail(email.toLowerCase().trim(), fullName.trim(), refCode).catch(
      (err) => console.error("Failed to send waitlist email:", err)
    );

    const all = await databases.listDocuments(DB_ID, COLLECTIONS.CHALLENGE_WAITLIST, [
      Query.limit(1),
    ]);
    return NextResponse.json({ success: true, referralCode: refCode, totalSignups: all.total });
  } catch (error) {
    console.error("Waitlist error:", error);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

export async function GET() {
  try {
    const { databases } = createAdminClient();
    const result = await databases.listDocuments(DB_ID, COLLECTIONS.CHALLENGE_WAITLIST, [
      Query.limit(1),
    ]);
    return NextResponse.json({ totalSignups: result.total });
  } catch {
    return NextResponse.json({ totalSignups: 0 });
  }
}
