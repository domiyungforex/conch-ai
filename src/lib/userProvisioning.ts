import { currentUser } from "@clerk/nextjs/server";
import { createAdminClient } from "./appwrite";
import { DB_ID, COLLECTIONS, type UserDoc, type AppwriteDoc } from "./db";
import { ID } from "node-appwrite";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Two concurrent requests for the same first-time user (double-tab, a
// prefetched Link firing alongside a direct navigation, or the web and
// mobile clients both loading right after signup) can both reach this at
// once: both see 404 on getDocument, both attempt createDocument with the
// same fixed ID, the loser gets 409. Refetching immediately after a 409 can
// still race Appwrite's own read-after-write consistency and return 404 —
// observed live, not hypothetical — so this retries the whole get-or-create
// cycle a few times with a short backoff instead of a single-shot refetch.
//
// Shared by the web dashboard page and /api/user/reputation (the mobile
// app's entry point) so there's exactly one place that provisions a new
// user's baseline Appwrite records, instead of the mobile client hitting a
// 404 because only the web page used to know how to create them.
export async function getOrCreateUser(
  databases: ReturnType<typeof createAdminClient>["databases"],
  userId: string
): Promise<AppwriteDoc<UserDoc> | null> {
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) await sleep(200 * attempt);

    try {
      return await databases.getDocument(DB_ID, COLLECTIONS.USERS, userId) as unknown as AppwriteDoc<UserDoc>;
    } catch (getErr: unknown) {
      if ((getErr as { code?: number })?.code !== 404) {
        console.error("[userProvisioning] failed to load user:", getErr);
        return null;
      }
    }

    const clerkUser = await currentUser();
    if (!clerkUser) return null;

    try {
      const user = await databases.createDocument(DB_ID, COLLECTIONS.USERS, userId, {
        email: clerkUser.emailAddresses[0]?.emailAddress ?? "",
        name: clerkUser.fullName ?? clerkUser.firstName ?? null,
        avatarUrl: clerkUser.imageUrl ?? null,
        plan: "free",
        planExpiresAt: null,
        onboarded: false,
      }) as unknown as AppwriteDoc<UserDoc>;

      await databases.createDocument(DB_ID, COLLECTIONS.REPUTATIONS, ID.unique(), {
        userId,
        score: 0,
        memoryCount: 0,
        shareCount: 0,
        agentCount: 0,
        chatCount: 0,
        level: "beginner",
      });

      return user;
    } catch (provisionErr: unknown) {
      if ((provisionErr as { code?: number })?.code !== 409) {
        console.error("[userProvisioning] user provisioning failed:", provisionErr);
        return null;
      }
      // Lost the race — loop around and get-or-create again after the backoff.
    }
  }
  return null;
}
