import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/appwrite";
import { DB_ID, COLLECTIONS, type WalletDoc, type AppwriteDoc } from "@/lib/db";
import { WalletLinkSchema } from "@/lib/validators";
import { verifyMessage } from "viem";
import { Query, ID } from "node-appwrite";
import { ACTIVE_CHAIN_ID } from "@/lib/chainConfig";
import { withApiTracking } from "@/lib/apiUsage";

// ── GET: Fetch linked wallet ───────────────────────────────────────────────

export const GET = withApiTracking(async () => {
  const { userId } = await auth();
  if (!userId)
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });

  const { databases } = createAdminClient();
  const result = await databases.listDocuments(DB_ID, COLLECTIONS.WALLETS, [
    Query.equal("userId", userId),
    Query.limit(10),
  ]);

  const wallets = result.documents.map(
    (d) => d as unknown as AppwriteDoc<WalletDoc>
  );

  // Return primary wallet or first wallet
  const wallet =
    wallets.find((w) => w.isPrimary) ?? wallets[0] ?? null;

  // Update lastConnectedAt if wallet exists and user is authenticated
  if (wallet) {
    databases
      .updateDocument(DB_ID, COLLECTIONS.WALLETS, wallet.$id, {
        lastConnectedAt: new Date().toISOString(),
      })
      .catch(() => {}); // fire-and-forget
  }

  return Response.json({ wallet, wallets });
});

// ── POST: Link/verify wallet ───────────────────────────────────────────────

export const POST = withApiTracking(async (req: Request) => {
  const { userId } = await auth();
  if (!userId)
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });

  const parsed = WalletLinkSchema.safeParse(
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

  const { address, signature, message } = parsed.data;

  // Verify the signature proves wallet ownership
  const isValid = await verifyMessage({
    address: address as `0x${string}`,
    message,
    signature: signature as `0x${string}`,
  });

  if (!isValid) {
    return new Response(JSON.stringify({ error: "Invalid signature" }), {
      status: 400,
    });
  }

  // Verify the message is recent (within 5 minutes) to prevent replay
  const timestampMatch = message.match(/Sign in to Conch: (\d+)/);
  if (timestampMatch) {
    const messageTime = parseInt(timestampMatch[1], 10);
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    if (messageTime < fiveMinutesAgo) {
      return new Response(
        JSON.stringify({ error: "Signature expired. Please try again." }),
        { status: 400 }
      );
    }
  }

  const { databases } = createAdminClient();
  const now = new Date().toISOString();

  // Check if this wallet address is already linked to another user
  const existingByAddress = await databases.listDocuments(
    DB_ID,
    COLLECTIONS.WALLETS,
    [Query.equal("address", address), Query.limit(1)]
  );

  if (existingByAddress.documents.length > 0) {
    const existing = existingByAddress.documents[0] as unknown as AppwriteDoc<WalletDoc>;
    if (existing.userId !== userId) {
      return new Response(
        JSON.stringify({
          error:
            "This wallet is already linked to another Conch account. Unlink it from that account first.",
        }),
        { status: 409 }
      );
    }
  }

  // Check existing wallet for this user
  const existingByUser = await databases.listDocuments(
    DB_ID,
    COLLECTIONS.WALLETS,
    [Query.equal("userId", userId), Query.limit(10)]
  );

  let wallet: AppwriteDoc<WalletDoc>;

  if (existingByUser.documents.length > 0) {
    // Update existing wallet
    const existingDoc = existingByUser.documents[0] as unknown as AppwriteDoc<WalletDoc>;
    wallet = (await databases.updateDocument(
      DB_ID,
      COLLECTIONS.WALLETS,
      existingDoc.$id,
      {
        address,
        chainId: ACTIVE_CHAIN_ID,
        verifiedAt: now,
        lastConnectedAt: now,
        disconnectedAt: null,
      }
    )) as unknown as AppwriteDoc<WalletDoc>;
  } else {
    // Create new wallet link
    wallet = (await databases.createDocument(
      DB_ID,
      COLLECTIONS.WALLETS,
      ID.unique(),
      {
        userId,
        address,
        chainId: ACTIVE_CHAIN_ID,
        verifiedAt: now,
        lastConnectedAt: now,
        disconnectedAt: null,
        isPrimary: true,
        ensName: null,
        badgeMinted: false,
        badgeTokenId: null,
        walletType: null,
      }
    )) as unknown as AppwriteDoc<WalletDoc>;
  }

  return Response.json({ wallet }, { status: 201 });
});

// ── DELETE: Disconnect/unlink wallet ───────────────────────────────────────

export const DELETE = withApiTracking(async () => {
  const { userId } = await auth();
  if (!userId)
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });

  const { databases } = createAdminClient();

  // Find all wallets for this user
  const result = await databases.listDocuments(DB_ID, COLLECTIONS.WALLETS, [
    Query.equal("userId", userId),
    Query.limit(10),
  ]);

  // Soft-delete: mark as disconnected rather than removing the record
  // This preserves billing history and prevents re-linking issues
  const now = new Date().toISOString();
  await Promise.all(
    result.documents.map((d) =>
      databases.updateDocument(DB_ID, COLLECTIONS.WALLETS, d.$id, {
        disconnectedAt: now,
        lastConnectedAt: now,
      })
    )
  );

  return new Response(null, { status: 204 });
});
