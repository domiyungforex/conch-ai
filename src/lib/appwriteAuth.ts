import { createAdminClient } from "./appwrite";

// Bridges a Clerk user into a real Appwrite Auth identity, keyed by the same
// Clerk userId, so the browser can hold an Appwrite session and Appwrite
// Realtime can authorize per-document subscriptions against it. This identity
// has no email/phone/password — it's never used for real login, only as the
// subject of a custom token exchange (see /api/appwrite-token).
export async function ensureAppwriteAuthUser(clerkUserId: string, name?: string | null): Promise<void> {
  const { users } = createAdminClient();
  try {
    await users.create({ userId: clerkUserId, name: name ?? undefined });
  } catch (e: unknown) {
    const code = (e as { code?: number })?.code;
    if (code !== 409) throw e;
  }
}
