import { NextRequest, NextResponse } from "next/server";
import { Client, Account } from "node-appwrite";
import { SESSION_COOKIE } from "@/lib/appwrite";

const ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!;
const PROJECT = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!;

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password required" }, { status: 400 });
  }

  try {
    const client = new Client().setEndpoint(ENDPOINT).setProject(PROJECT);
    const account = new Account(client);
    const session = await account.createEmailPasswordSession(email, password);

    const res = NextResponse.json({ success: true });
    res.cookies.set(SESSION_COOKIE, session.secret, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    return res;
  } catch (err: unknown) {
    const msg = (err as { message?: string })?.message ?? "Sign in failed";
    return NextResponse.json({ error: msg }, { status: 401 });
  }
}
