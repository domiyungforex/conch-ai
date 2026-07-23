import { auth } from "@clerk/nextjs/server";
import { Query } from "node-appwrite";
import { createAdminClient } from "@/lib/appwrite";
import { DB_ID, COLLECTIONS, type UserDoc, type PaymentDoc, type AppwriteDoc } from "@/lib/db";
import { getSubscriptionStatus } from "@/lib/subscription";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

  const { databases } = createAdminClient();

  let user: AppwriteDoc<UserDoc>;
  try {
    user = await databases.getDocument(DB_ID, COLLECTIONS.USERS, userId) as unknown as AppwriteDoc<UserDoc>;
  } catch {
    return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
  }

  const paymentsResult = await databases.listDocuments(DB_ID, COLLECTIONS.PAYMENTS, [
    Query.equal("userId", userId), Query.orderDesc("$createdAt"), Query.limit(50),
  ]);
  const payments = paymentsResult.documents as unknown as AppwriteDoc<PaymentDoc>[];

  return Response.json({
    status: getSubscriptionStatus(user),
    plan: user.plan,
    planExpiresAt: user.planExpiresAt,
    payments,
  });
}
