import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/appwrite";
import { DB_ID, COLLECTIONS, type WalletDoc, type AppwriteDoc } from "@/lib/db";
import { WalletLinkSchema } from "@/lib/validators";
import { verifyMessage } from "viem";
import { Query, ID } from "node-appwrite";

export async function DELETE() {
  const { userId } = await auth();
  if (!userId) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  const appwriteId = userId;

  const { databases } = createAdminClient();
  const result = await databases.listDocuments(DB_ID, COLLECTIONS.WALLETS, [
    Query.equal("userId", appwriteId), Query.limit(10),
  ]);
  await Promise.all(result.documents.map((d) => databases.deleteDocument(DB_ID, COLLECTIONS.WALLETS, d.$id)));
  return new Response(null, { status: 204 });
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  const appwriteId = userId;

  const { databases } = createAdminClient();
  const result = await databases.listDocuments(DB_ID, COLLECTIONS.WALLETS, [
    Query.equal("userId", appwriteId), Query.limit(1),
  ]);

  const wallet = result.documents.length > 0
    ? result.documents[0] as unknown as AppwriteDoc<WalletDoc>
    : null;
  return Response.json({ wallet });
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  const appwriteId = userId;

  const parsed = WalletLinkSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: "Invalid request", details: parsed.error.flatten() }), { status: 400 });
  }

  const { address, signature, message } = parsed.data;
  const isValid = await verifyMessage({
    address: address as `0x${string}`,
    message,
    signature: signature as `0x${string}`,
  });

  if (!isValid) {
    return new Response(JSON.stringify({ error: "Invalid signature" }), { status: 400 });
  }

  const { databases } = createAdminClient();
  const now = new Date().toISOString();

  const existing = await databases.listDocuments(DB_ID, COLLECTIONS.WALLETS, [
    Query.equal("userId", appwriteId), Query.limit(1),
  ]);

  let wallet: AppwriteDoc<WalletDoc>;
  if (existing.documents.length > 0) {
    wallet = await databases.updateDocument(DB_ID, COLLECTIONS.WALLETS, existing.documents[0].$id, {
      address, verifiedAt: now,
    }) as unknown as AppwriteDoc<WalletDoc>;
  } else {
    wallet = await databases.createDocument(DB_ID, COLLECTIONS.WALLETS, ID.unique(), {
      userId: appwriteId, address, chainId: 8453, verifiedAt: now,
      ensName: null, badgeMinted: false, badgeTokenId: null,
    }) as unknown as AppwriteDoc<WalletDoc>;
  }

  return Response.json({ wallet }, { status: 201 });
}
