import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/appwrite";
import { DB_ID, COLLECTIONS, type WalletDoc, type AppwriteDoc } from "@/lib/db";
import { BasePaymentVerifySchema } from "@/lib/validators";
import { getUsdcTransfer } from "@/lib/subscriptionChain";
import { getDefaultPaymentToken } from "@/lib/chainConfig";
import { Query } from "node-appwrite";

// POST /api/billing/base/verify
// Verify a Base transaction exists and is valid. Does NOT activate subscription —
// that's the job of /api/subscription/confirm. This endpoint is for pre-checks
// and developer API use.

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId)
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });

  const parsed = BasePaymentVerifySchema.safeParse(
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

  const { txHash } = parsed.data;
  const { databases } = createAdminClient();

  // Find linked wallet
  const walletResult = await databases.listDocuments(
    DB_ID,
    COLLECTIONS.WALLETS,
    [Query.equal("userId", userId), Query.limit(10)]
  );

  const wallets = walletResult.documents.map(
    (d) => d as unknown as AppwriteDoc<WalletDoc>
  );
  const wallet =
    wallets.find((w) => w.isPrimary && !w.disconnectedAt) ??
    wallets.find((w) => !w.disconnectedAt) ??
    wallets[0];

  if (!wallet) {
    return new Response(
      JSON.stringify({ error: "No linked wallet found" }),
      { status: 400 }
    );
  }

  // Read transaction from chain
  const transfer = await getUsdcTransfer(txHash as `0x${string}`);
  if (!transfer) {
    return Response.json({
      verified: false,
      reason: "Transaction not found or not confirmed on chain",
    });
  }

  const token = getDefaultPaymentToken();

  return Response.json({
    verified: true,
    from: transfer.from,
    to: transfer.to,
    value: transfer.value.toString(),
    blockNumber: transfer.blockNumber.toString(),
    tokenSymbol: token.symbol,
    tokenDecimals: token.decimals,
    amountUsdc: Number(transfer.value) / 10 ** token.decimals,
    isFromLinkedWallet:
      transfer.from.toLowerCase() === wallet.address.toLowerCase(),
  });
}
