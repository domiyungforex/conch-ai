import { auth } from "@clerk/nextjs/server";
import { Query } from "node-appwrite";
import { createAdminClient } from "@/lib/appwrite";
import { DB_ID, COLLECTIONS, type UserDoc, type PaymentDoc, type AppwriteDoc } from "@/lib/db";
import { getSubscriptionStatus, isTesterUserId } from "@/lib/subscription";
import { resolveUserEmail } from "@/lib/planLimits";

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

  // Docs created before the email field existed have no email on the
  // Appwrite record, which would defeat the tester override in
  // getSubscriptionStatus. Resolve it from Clerk so the tester account
  // still reads as active Premium (and gets the doc backfilled).
  const email = await resolveUserEmail(databases, userId, user);

  return Response.json({
    status: isTesterUserId(userId) ? "active" : getSubscriptionStatus({ ...user, email: email ?? "" }),
    plan: user.plan,
    planExpiresAt: user.planExpiresAt,
    payments,
  });
}
