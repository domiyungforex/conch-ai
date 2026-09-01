import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/appwrite";
import { ensureAppwriteAuthUser } from "@/lib/appwriteAuth";
import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { DB_ID } from "@/lib/db";

// Bridges the browser into a real Appwrite session so Appwrite Realtime can
// authorize per-document subscriptions. Session-only — deliberately not
// reachable via a "cnch_..." API key, which has no browser to hold a session.
export async function POST() {
  const { userId } = await auth();
  if (!userId) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

  const rateCheck = checkRateLimit(`appwrite-token:${userId}`, 10, 60_000);
  if (!rateCheck.success) return rateLimitResponse(rateCheck.resetAt);

  await ensureAppwriteAuthUser(userId);

  const { users } = createAdminClient();
  const token = await users.createToken({ userId, expire: 900 });

  return Response.json({ userId, secret: token.secret, databaseId: DB_ID });
}
