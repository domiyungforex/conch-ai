import webPush from "web-push";
import { createAdminClient } from "@/lib/appwrite";
import { DB_ID, COLLECTIONS, type PushSubscriptionDoc, type AppwriteDoc } from "@/lib/db";
import { Query } from "node-appwrite";

// Configure VAPID keys
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webPush.setVapidDetails(
    "mailto:admin@freebuff.com",
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
}

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  url?: string;
}

/**
 * Send a push notification to ALL of a user's registered subscriptions (all devices).
 * Returns the number of successful sends and any errors.
 */
export async function sendPushToAllDevices(
  userId: string,
  payload: PushPayload
): Promise<{ sent: number; failed: number; errors: string[] }> {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    return { sent: 0, failed: 0, errors: ["VAPID keys not configured"] };
  }

  const { databases } = createAdminClient();

  // Fetch all subscriptions for this user
  const result = await databases.listDocuments(
    DB_ID,
    COLLECTIONS.PUSH_SUBSCRIPTIONS,
    [Query.equal("userId", userId), Query.limit(100)]
  );

  const subscriptions = result.documents as unknown as AppwriteDoc<PushSubscriptionDoc>[];

  if (subscriptions.length === 0) {
    return { sent: 0, failed: 0, errors: ["No push subscriptions found"] };
  }

  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  // Send to all subscriptions in parallel
  const results = await Promise.allSettled(
    subscriptions.map(async (sub) => {
      const subscription: webPush.PushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
      };

      const notificationPayload = JSON.stringify({
        title: payload.title,
        body: payload.body,
        icon: payload.icon || "/favicon.ico",
        badge: payload.badge || "/favicon.ico",
        tag: payload.tag || `reminder-${userId}`,
        url: payload.url || "/",
      });

      try {
        await webPush.sendNotification(subscription, notificationPayload);
        return { success: true, endpoint: sub.endpoint };
      } catch (err: unknown) {
        // If subscription is expired or invalid (404 Gone, 410 Gone), remove it
        const statusCode = (err as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          try {
            await databases.deleteDocument(
              DB_ID,
              COLLECTIONS.PUSH_SUBSCRIPTIONS,
              sub.$id
            );
          } catch {
            // Non-critical cleanup failure
          }
        }
        throw err;
      }
    })
  );

  for (const result of results) {
    if (result.status === "fulfilled") {
      sent++;
    } else {
      failed++;
      errors.push(
        result.reason?.message || result.reason?.toString() || "Unknown error"
      );
    }
  }

  return { sent, failed, errors };
}

/**
 * Send a push notification to a specific subscription endpoint.
 * Useful for targeted notifications.
 */
export async function sendPushToEndpoint(
  endpoint: string,
  payload: PushPayload
): Promise<boolean> {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    return false;
  }

  const { databases } = createAdminClient();

  // Find the subscription
  const result = await databases.listDocuments(
    DB_ID,
    COLLECTIONS.PUSH_SUBSCRIPTIONS,
    [Query.equal("endpoint", endpoint), Query.limit(1)]
  );

  if (result.documents.length === 0) {
    return false;
  }

  const sub = result.documents[0] as unknown as AppwriteDoc<PushSubscriptionDoc>;

  const subscription: webPush.PushSubscription = {
    endpoint: sub.endpoint,
    keys: {
      p256dh: sub.p256dh,
      auth: sub.auth,
    },
  };

  const notificationPayload = JSON.stringify({
    title: payload.title,
    body: payload.body,
    icon: payload.icon || "/favicon.ico",
    badge: payload.badge || "/favicon.ico",
    tag: payload.tag || "notification",
    url: payload.url || "/",
  });

  try {
    await webPush.sendNotification(subscription, notificationPayload);
    return true;
  } catch (err: unknown) {
    const statusCode = (err as { statusCode?: number }).statusCode;
    if (statusCode === 404 || statusCode === 410) {
      try {
        await databases.deleteDocument(
          DB_ID,
          COLLECTIONS.PUSH_SUBSCRIPTIONS,
          sub.$id
        );
      } catch {
        // Non-critical
      }
    }
    return false;
  }
}
