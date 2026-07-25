import { auth } from "@clerk/nextjs/server";
import { ID, Query } from "node-appwrite";
import { createAdminClient } from "@/lib/appwrite";
import { DB_ID, COLLECTIONS, type UserDoc, type WalletDoc, type PaymentDoc, type AppwriteDoc } from "@/lib/db";
import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { SubscriptionConfirmSchema } from "@/lib/validators";
import { getUsdcTransfer } from "@/lib/subscriptionChain";
import { getSubscriptionStatus } from "@/lib/subscription";
import { planPriceUsd, usdToUsdcBaseUnits, addBillingPeriod } from "@/lib/plans";

const CHAIN_ID_BASE = 8453;

// Never trusts the client's claim that a payment happened — re-derives the
// expected recipient/sender/amount and reads the transfer back from chain
// via a public RPC before activating anything. The user's own wallet signs
// and pays for the transfer; nothing here ever holds a key or sends a tx.
export async function POST(req: Request) {
  const { userId: appwriteId } = await auth();
  if (!appwriteId) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

  const treasury = process.env.NEXT_PUBLIC_SUBSCRIPTION_TREASURY_ADDRESS_BASE;
  if (!treasury) {
    return new Response(JSON.stringify({ error: "Subscription payments aren't configured yet" }), { status: 503 });
  }

  const rateCheck = checkRateLimit(`subscription:confirm:${appwriteId}`, 5, 600_000);
  if (!rateCheck.success) return rateLimitResponse(rateCheck.resetAt);

  const parsed = SubscriptionConfirmSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: "Invalid request", details: parsed.error.flatten() }), { status: 400 });
  }
  const { txHash, billingCycle, plan: planId } = parsed.data;

  const { databases } = createAdminClient();

  // Cheap pre-check — not the authoritative guard (see the unique index below),
  // just avoids a wasted RPC call for the common case of an obvious duplicate.
  const existingByHash = await databases.listDocuments(DB_ID, COLLECTIONS.PAYMENTS, [
    Query.equal("txHash", txHash), Query.limit(1),
  ]);
  if (existingByHash.documents.length > 0) {
    return new Response(JSON.stringify({ error: "This transaction has already been used to confirm a payment" }), { status: 409 });
  }

  const walletResult = await databases.listDocuments(DB_ID, COLLECTIONS.WALLETS, [
    Query.equal("userId", appwriteId), Query.limit(1),
  ]);
  if (walletResult.documents.length === 0) {
    return new Response(JSON.stringify({ error: "Connect and link a wallet before subscribing" }), { status: 400 });
  }
  const wallet = walletResult.documents[0] as unknown as AppwriteDoc<WalletDoc>;

  const transfer = await getUsdcTransfer(txHash as `0x${string}`);
  if (!transfer) {
    return new Response(JSON.stringify({ error: "Could not read this transaction from chain" }), { status: 400 });
  }

  const expectedAmount = usdToUsdcBaseUnits(planPriceUsd(planId, billingCycle));

  const valid =
    transfer.to.toLowerCase() === treasury.toLowerCase() &&
    transfer.from.toLowerCase() === wallet.address.toLowerCase() &&
    transfer.value === expectedAmount;

  if (!valid) {
    return new Response(JSON.stringify({ error: "Payment does not match the expected recipient, sender, or amount" }), { status: 400 });
  }

  let user: AppwriteDoc<UserDoc>;
  try {
    user = await databases.getDocument(DB_ID, COLLECTIONS.USERS, appwriteId) as unknown as AppwriteDoc<UserDoc>;
  } catch {
    return new Response(JSON.stringify({ error: "Account not found" }), { status: 404 });
  }

  const status = getSubscriptionStatus(user);
  const anchor = status === "expired-to-free" || !user.planExpiresAt ? new Date() : new Date(user.planExpiresAt);
  const periodStart = new Date();
  const periodEnd = addBillingPeriod(anchor, billingCycle);

  let payment: AppwriteDoc<PaymentDoc>;
  try {
    payment = await databases.createDocument(DB_ID, COLLECTIONS.PAYMENTS, ID.unique(), {
      userId: appwriteId,
      txHash,
      walletAddress: transfer.from,
      chainId: CHAIN_ID_BASE,
      plan: planId,
      billingCycle,
      amountUsdcBaseUnits: Number(expectedAmount),
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
      blockNumber: Number(transfer.blockNumber),
      confirmedAt: new Date().toISOString(),
    }) as unknown as AppwriteDoc<PaymentDoc>;
  } catch (e: unknown) {
    const code = (e as { code?: number })?.code;
    if (code === 409) {
      const existing = await databases.listDocuments(DB_ID, COLLECTIONS.PAYMENTS, [
        Query.equal("txHash", txHash), Query.limit(1),
      ]);
      const doc = existing.documents[0] as unknown as AppwriteDoc<PaymentDoc> | undefined;
      if (doc?.userId === appwriteId) {
        return Response.json({ user, payment: doc }, { status: 200 });
      }
      return new Response(JSON.stringify({ error: "This transaction has already been used to confirm a payment" }), { status: 409 });
    }
    throw e;
  }

  let updatedUser: AppwriteDoc<UserDoc>;
  try {
    updatedUser = await databases.updateDocument(DB_ID, COLLECTIONS.USERS, appwriteId, {
      plan: planId,
      planExpiresAt: periodEnd.toISOString(),
    }) as unknown as AppwriteDoc<UserDoc>;
  } catch (err) {
    console.error("[subscription confirm] payment recorded but plan update failed:", err, { txHash, userId: appwriteId });
    return new Response(JSON.stringify({
      error: "Payment was verified and recorded, but activating your plan failed. Contact support with this transaction hash.",
      txHash,
    }), { status: 500 });
  }

  return Response.json({ user: updatedUser, payment }, { status: 201 });
}
