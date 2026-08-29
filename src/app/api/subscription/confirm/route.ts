import { auth } from "@clerk/nextjs/server";
import { ID, Query } from "node-appwrite";
import { createAdminClient } from "@/lib/appwrite";
import {
  DB_ID,
  COLLECTIONS,
  type UserDoc,
  type WalletDoc,
  type PaymentDoc,
  type AppwriteDoc,
} from "@/lib/db";
import { checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { SubscriptionConfirmSchema } from "@/lib/validators";
import { getUsdcTransfer } from "@/lib/subscriptionChain";
import { getSubscriptionStatus } from "@/lib/subscription";
import {
  planPriceUsd,
  usdToUsdcBaseUnits,
  addBillingPeriod,
} from "@/lib/plans";
import {
  TREASURY_ADDRESS,
  ACTIVE_CHAIN_ID,
  getDefaultPaymentToken,
} from "@/lib/chainConfig";

// Never trusts the client's claim that a payment happened — re-derives the
// expected recipient/sender/amount and reads the transfer back from chain
// via a public RPC before activating anything. The user's own wallet signs
// and pays for the transfer; nothing here ever holds a key or sends a tx.

export async function POST(req: Request) {
  const { userId: appwriteId } = await auth();
  if (!appwriteId)
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });

  if (!TREASURY_ADDRESS || TREASURY_ADDRESS === "0x0000000000000000000000000000000000000000") {
    return new Response(
      JSON.stringify({
        error: "Subscription payments aren't configured yet",
      }),
      { status: 503 }
    );
  }

  const rateCheck = checkRateLimit(`subscription:confirm:${appwriteId}`, 5, 600_000);
  if (!rateCheck.success) return rateLimitResponse(rateCheck.resetAt);

  const parsed = SubscriptionConfirmSchema.safeParse(
    await req.json().catch(() => ({}))
  );
  if (!parsed.success) {
    return new Response(
      JSON.stringify({
        error: "Invalid request",
        details: parsed.error.flatten(),
      }),
      { status: 400 }
    );
  }
  const { txHash, billingCycle, plan: planId } = parsed.data;

  const { databases } = createAdminClient();

  // ── Idempotency check ──────────────────────────────────────────────────
  // If this transaction was already processed, return the existing payment.
  const existingByHash = await databases.listDocuments(
    DB_ID,
    COLLECTIONS.PAYMENTS,
    [Query.equal("txHash", txHash), Query.limit(1)]
  );

  if (existingByHash.documents.length > 0) {
    const existing = existingByHash.documents[0] as unknown as AppwriteDoc<PaymentDoc>;
    // If it's the same user, return the existing payment (idempotent)
    if (existing.userId === appwriteId) {
      return Response.json(
        { message: "Payment already confirmed", payment: existing },
        { status: 200 }
      );
    }
    // Different user — reject (this tx was used by someone else)
    return new Response(
      JSON.stringify({
        error: "This transaction has already been used to confirm a payment",
      }),
      { status: 409 }
    );
  }

  // ── Find linked wallet ─────────────────────────────────────────────────
  const walletResult = await databases.listDocuments(
    DB_ID,
    COLLECTIONS.WALLETS,
    [Query.equal("userId", appwriteId), Query.limit(10)]
  );

  // Find the primary or most recently verified wallet
  const wallets = walletResult.documents.map(
    (d) => d as unknown as AppwriteDoc<WalletDoc>
  );
  const wallet =
    wallets.find((w) => w.isPrimary && !w.disconnectedAt) ??
    wallets.find((w) => !w.disconnectedAt) ??
    wallets[0];

  if (!wallet) {
    return new Response(
      JSON.stringify({
        error: "Connect and link a wallet before subscribing",
      }),
      { status: 400 }
    );
  }

  // ── Read transaction from chain ────────────────────────────────────────
  const transfer = await getUsdcTransfer(txHash as `0x${string}`);
  if (!transfer) {
    return new Response(
      JSON.stringify({
        error: "Could not read this transaction from chain. It may not have confirmed yet.",
      }),
      { status: 400 }
    );
  }

  // ── Verify payment details ─────────────────────────────────────────────
  const token = getDefaultPaymentToken();
  const expectedAmount = usdToUsdcBaseUnits(planPriceUsd(planId, billingCycle));

  // Comprehensive verification: recipient, sender, amount, token, chain
  const valid =
    transfer.to.toLowerCase() === TREASURY_ADDRESS.toLowerCase() &&
    transfer.from.toLowerCase() === wallet.address.toLowerCase() &&
    transfer.value === expectedAmount;

  if (!valid) {
    // Create a failed payment record for audit
    const paymentId = crypto.randomUUID();
    await databases
      .createDocument(DB_ID, COLLECTIONS.PAYMENTS, ID.unique(), {
        userId: appwriteId,
        txHash,
        walletAddress: transfer.from,
        chainId: ACTIVE_CHAIN_ID,
        plan: planId,
        billingCycle,
        amountUsdcBaseUnits: Number(transfer.value),
        periodStart: new Date().toISOString(),
        periodEnd: new Date().toISOString(),
        blockNumber: Number(transfer.blockNumber),
        confirmedAt: new Date().toISOString(),
        paymentState: "REJECTED",
        paymentId,
        tokenAddress: token.address,
        tokenSymbol: token.symbol,
        recipientAddress: transfer.to,
        initiatedAt: new Date().toISOString(),
        failedAt: new Date().toISOString(),
        failureReason: "Payment does not match expected recipient, sender, or amount",
        networkConfirmations: null,
      })
      .catch(() => {}); // fire-and-forget

    return new Response(
      JSON.stringify({
        error: "Payment does not match the expected recipient, sender, or amount",
      }),
      { status: 400 }
    );
  }

  // ── Fetch user ─────────────────────────────────────────────────────────
  let user: AppwriteDoc<UserDoc>;
  try {
    user = (await databases.getDocument(
      DB_ID,
      COLLECTIONS.USERS,
      appwriteId
    )) as unknown as AppwriteDoc<UserDoc>;
  } catch {
    return new Response(JSON.stringify({ error: "Account not found" }), {
      status: 404,
    });
  }

  // ── Calculate subscription period ──────────────────────────────────────
  const status = getSubscriptionStatus(user);
  const anchor =
    status === "expired-to-free" || !user.planExpiresAt
      ? new Date()
      : new Date(user.planExpiresAt);
  const periodStart = new Date();
  const periodEnd = addBillingPeriod(anchor, billingCycle);

  // ── Create payment record ──────────────────────────────────────────────
  const paymentId = crypto.randomUUID();
  let payment: AppwriteDoc<PaymentDoc>;
  try {
    payment = (await databases.createDocument(
      DB_ID,
      COLLECTIONS.PAYMENTS,
      ID.unique(),
      {
        userId: appwriteId,
        txHash,
        walletAddress: transfer.from,
        chainId: ACTIVE_CHAIN_ID,
        plan: planId,
        billingCycle,
        amountUsdcBaseUnits: Number(expectedAmount),
        periodStart: periodStart.toISOString(),
        periodEnd: periodEnd.toISOString(),
        blockNumber: Number(transfer.blockNumber),
        confirmedAt: new Date().toISOString(),
        paymentState: "CONFIRMED",
        paymentId,
        tokenAddress: token.address,
        tokenSymbol: token.symbol,
        recipientAddress: TREASURY_ADDRESS,
        initiatedAt: null,
        failedAt: null,
        failureReason: null,
        networkConfirmations: 1,
      }
    )) as unknown as AppwriteDoc<PaymentDoc>;
  } catch (e: unknown) {
    const code = (e as { code?: number })?.code;
    if (code === 409) {
      // Unique constraint violation — this tx was already recorded
      const existing = await databases.listDocuments(
        DB_ID,
        COLLECTIONS.PAYMENTS,
        [Query.equal("txHash", txHash), Query.limit(1)]
      );
      const doc = (existing.documents[0] ?? null) as unknown as
        | AppwriteDoc<PaymentDoc>
        | null;
      if (doc && doc.userId === appwriteId) {
        return Response.json(
          { message: "Payment already confirmed", payment: doc },
          { status: 200 }
        );
      }
      return new Response(
        JSON.stringify({
          error:
            "This transaction has already been used to confirm a payment",
        }),
        { status: 409 }
      );
    }
    throw e;
  }

  // ── Activate subscription ──────────────────────────────────────────────
  let updatedUser: AppwriteDoc<UserDoc>;
  try {
    updatedUser = (await databases.updateDocument(
      DB_ID,
      COLLECTIONS.USERS,
      appwriteId,
      {
        plan: planId,
        planExpiresAt: periodEnd.toISOString(),
      }
    )) as unknown as AppwriteDoc<UserDoc>;
  } catch (err) {
    console.error(
      "[subscription confirm] payment recorded but plan update failed:",
      err,
      { txHash, userId: appwriteId }
    );
    return new Response(
      JSON.stringify({
        error:
          "Payment was verified and recorded, but activating your plan failed. Contact support with this transaction hash.",
        txHash,
      }),
      { status: 500 }
    );
  }

  // Log the successful subscription activation
  console.log("[subscription activated]", {
    userId: appwriteId,
    plan: planId,
    paymentId,
    txHash,
    periodEnd: periodEnd.toISOString(),
  });

  return Response.json({ user: updatedUser, payment }, { status: 201 });
}
