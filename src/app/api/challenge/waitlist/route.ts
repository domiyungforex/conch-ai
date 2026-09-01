import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { waitlistSignups, referrals, challengeEvents } from "@/db/schema/challenge";
import { eq, count } from "drizzle-orm";

function generateReferralCode(fullName: string): string {
  const base = fullName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 6);
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${base}${suffix}`;
}

// Simple in-memory rate limiter (per IP)
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
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const {
      fullName,
      email,
      twitterHandle,
      discordUsername,
      role,
      buildIdea,
      country,
      referralCode,
    } = body;

    // Validate required fields
    if (!fullName || !email || !role) {
      return NextResponse.json(
        { error: "Full name, email, and role are required." },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles = ["developer", "creator", "founder", "student", "other"];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: "Please select a valid role." },
        { status: 400 }
      );
    }

    // Check for existing signup
    const existing = await db
      .select()
      .from(waitlistSignups)
      .where(eq(waitlistSignups.email, email.toLowerCase().trim()))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "You're already on the waitlist!" },
        { status: 409 }
      );
    }

    // Generate unique referral code
    const myReferralCode = generateReferralCode(fullName);

    // Create signup
    const [signup] = await db
      .insert(waitlistSignups)
      .values({
        fullName: fullName.trim(),
        email: email.toLowerCase().trim(),
        twitterHandle: twitterHandle?.trim() || null,
        discordUsername: discordUsername?.trim() || null,
        role,
        buildIdea: buildIdea?.trim() || null,
        country: country?.trim() || null,
        referralCode: myReferralCode,
      })
      .returning();

    // Handle referral if code provided
    if (referralCode) {
      const referrer = await db
        .select()
        .from(waitlistSignups)
        .where(eq(waitlistSignups.referralCode, referralCode))
        .limit(1);

      if (referrer.length > 0) {
        await db.insert(referrals).values({
          referrerSignupId: referrer[0].id,
          referredSignupId: signup.id,
          code: referralCode,
        });
      }
    }

    // Log event
    await db.insert(challengeEvents).values({
      type: "waitlist_signup",
      actorEmail: email.toLowerCase().trim(),
      data: {
        role,
        country: country || null,
        hasReferral: !!referralCode,
      },
    });

    // Get total count for response
    const [totalResult] = await db.select({ value: count() }).from(waitlistSignups);

    return NextResponse.json({
      success: true,
      referralCode: myReferralCode,
      totalSignups: totalResult.value,
    });
  } catch (error) {
    console.error("Waitlist signup error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const [totalResult] = await db.select({ value: count() }).from(waitlistSignups);

    return NextResponse.json({
      totalSignups: totalResult.value,
    });
  } catch (error) {
    console.error("Waitlist count error:", error);
    return NextResponse.json(
      { error: "Failed to fetch count." },
      { status: 500 }
    );
  }
}
