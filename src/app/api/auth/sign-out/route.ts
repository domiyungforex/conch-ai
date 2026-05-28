import { NextResponse } from "next/server";
import { createSessionClient, SESSION_COOKIE } from "@/lib/appwrite";

export async function POST() {
  const { account, sessionValue } = await createSessionClient();

  if (sessionValue) {
    try {
      await account.deleteSession("current");
    } catch {
      // Session may already be expired — clear cookie regardless
    }
  }

  const res = NextResponse.json({ success: true });
  res.cookies.set(SESSION_COOKIE, "", { maxAge: 0, path: "/" });
  return res;
}
