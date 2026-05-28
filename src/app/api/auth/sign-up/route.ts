import { NextRequest, NextResponse } from "next/server";
import { Client, Account, ID } from "node-appwrite";
import { createAdminClient, SESSION_COOKIE } from "@/lib/appwrite";
import { DB_ID, COLLECTIONS } from "@/lib/db";

const ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!;
const PROJECT  = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!;

export async function POST(req: NextRequest) {
  const { email, password, name } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password required" }, { status: 400 });
  }

  const client = new Client().setEndpoint(ENDPOINT).setProject(PROJECT);
  const account = new Account(client);

  let appwriteUser;
  try {
    appwriteUser = await account.create(ID.unique(), email, password, name ?? undefined);
  } catch (err: unknown) {
    const msg = (err as { message?: string })?.message ?? "Registration failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const session = await account.createEmailPasswordSession(email, password);

  const { databases } = createAdminClient();
  try {
    await Promise.all([
      databases.createDocument(DB_ID, COLLECTIONS.USERS, appwriteUser.$id, {
        email,
        name: name ?? null,
        avatarUrl: null,
        plan: "free",
        planExpiresAt: null,
        onboarded: false,
      }),
      databases.createDocument(DB_ID, COLLECTIONS.REPUTATIONS, ID.unique(), {
        userId: appwriteUser.$id,
        score: 0,
        memoryCount: 0,
        shareCount: 0,
        agentCount: 0,
        chatCount: 0,
        level: "novice",
      }),
    ]);
  } catch (dbErr: unknown) {
    const msg = (dbErr as { message?: string })?.message ?? String(dbErr);
    const code = (dbErr as { code?: number })?.code;
    const type = (dbErr as { type?: string })?.type;
    console.error("[sign-up] db create failed:", dbErr);
    try {
      const { users } = createAdminClient();
      await users.delete(appwriteUser.$id);
    } catch {}
    return NextResponse.json({ error: `DB error (${code}/${type}): ${msg}` }, { status: 500 });
  }

  const res = NextResponse.json({ success: true });
  res.cookies.set(SESSION_COOKIE, session.secret, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
