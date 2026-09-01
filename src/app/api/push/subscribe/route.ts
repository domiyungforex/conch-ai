import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/appwrite";
import { DB_ID, COLLECTIONS } from "@/lib/db";
import { Query, ID } from "node-appwrite";

// Save a push subscription
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId)
    return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { endpoint, p256dh, auth: subAuth } = body;

  if (!endpoint || !p256dh || !subAuth) {
    return Response.json(
      { error: "Missing endpoint, p256dh, or auth" },
      { status: 400 }
    );
  }

  const { databases } = createAdminClient();

  // Check if subscription already exists for this endpoint
  const existing = await databases.listDocuments(
    DB_ID,
    COLLECTIONS.PUSH_SUBSCRIPTIONS,
    [Query.equal("endpoint", endpoint), Query.limit(1)]
  );

  if (existing.documents.length > 0) {
    // Update existing subscription
    const doc = existing.documents[0];
    await databases.updateDocument(
      DB_ID,
      COLLECTIONS.PUSH_SUBSCRIPTIONS,
      doc.$id,
      {
        userId,
        p256dh,
        auth: subAuth,
        userAgent: req.headers.get("user-agent") || null,
      }
    );
    return Response.json({ success: true, updated: true });
  }

  // Create new subscription
  await databases.createDocument(
    DB_ID,
    COLLECTIONS.PUSH_SUBSCRIPTIONS,
    ID.unique(),
    {
      userId,
      endpoint,
      p256dh,
      auth: subAuth,
      userAgent: req.headers.get("user-agent") || null,
    }
  );

  return Response.json({ success: true, created: true });
}

// Get user's push subscription status
export async function GET() {
  const { userId } = await auth();
  if (!userId)
    return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { databases } = createAdminClient();
  const result = await databases.listDocuments(
    DB_ID,
    COLLECTIONS.PUSH_SUBSCRIPTIONS,
    [Query.equal("userId", userId), Query.limit(10)]
  );

  return Response.json({
    subscribed: result.documents.length > 0,
    count: result.documents.length,
  });
}

// Remove a push subscription
export async function DELETE(req: Request) {
  const { userId } = await auth();
  if (!userId)
    return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { endpoint } = await req.json().catch(() => ({}));

  const { databases } = createAdminClient();

  if (endpoint) {
    // Remove specific subscription
    const existing = await databases.listDocuments(
      DB_ID,
      COLLECTIONS.PUSH_SUBSCRIPTIONS,
      [Query.equal("endpoint", endpoint), Query.limit(1)]
    );
    if (existing.documents.length > 0) {
      await databases.deleteDocument(
        DB_ID,
        COLLECTIONS.PUSH_SUBSCRIPTIONS,
        existing.documents[0].$id
      );
    }
  } else {
    // Remove all subscriptions for this user
    const result = await databases.listDocuments(
      DB_ID,
      COLLECTIONS.PUSH_SUBSCRIPTIONS,
      [Query.equal("userId", userId), Query.limit(100)]
    );
    await Promise.all(
      result.documents.map((d) =>
        databases.deleteDocument(
          DB_ID,
          COLLECTIONS.PUSH_SUBSCRIPTIONS,
          d.$id
        )
      )
    );
  }

  return Response.json({ success: true });
}
