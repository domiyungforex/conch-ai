import { createAdminClient } from "@/lib/appwrite";
import { DB_ID, COLLECTIONS, type MemoryDoc, type WalletDoc, type AppwriteDoc } from "@/lib/db";
import { resolveAuth, scopeAllows, forbiddenScope } from "@/lib/apiAuth";
import { computeContentHash, encodeMemorySchemaData, EAS_CONTRACT_ADDRESS } from "@/lib/eas";
import { checkFeatureAccess, upgradeRequiredResponse } from "@/lib/planLimits";
import { Query } from "node-appwrite";

// Prepares (but does not submit) the on-chain attestation for a memory. The
// actual transaction is signed and paid for by the user's own connected
// wallet, client-side — this route only computes the data to attest so the
// hashing logic can't drift between client and server.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolved = await resolveAuth(req);
  if (!resolved) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  if (!scopeAllows(resolved.scope, "read")) return forbiddenScope();
  const { userId: appwriteId } = resolved;

  const schemaUID = process.env.EAS_SCHEMA_UID;
  if (!schemaUID) {
    return new Response(JSON.stringify({ error: "On-chain verification isn't configured yet" }), { status: 503 });
  }

  const { id } = await params;
  const { databases } = createAdminClient();

  const featureAccess = await checkFeatureAccess(databases, appwriteId);
  if (!featureAccess.allowed) return upgradeRequiredResponse();

  let memory: AppwriteDoc<MemoryDoc>;
  try {
    memory = await databases.getDocument(DB_ID, COLLECTIONS.MEMORIES, id) as unknown as AppwriteDoc<MemoryDoc>;
  } catch {
    return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
  }
  if (memory.userId !== appwriteId) return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });

  const walletResult = await databases.listDocuments(DB_ID, COLLECTIONS.WALLETS, [
    Query.equal("userId", appwriteId), Query.limit(1),
  ]);
  if (walletResult.documents.length === 0) {
    return new Response(JSON.stringify({ error: "Connect a wallet before verifying a memory on-chain" }), { status: 400 });
  }
  const wallet = walletResult.documents[0] as unknown as AppwriteDoc<WalletDoc>;

  const contentHash = computeContentHash(memory.content);
  const createdAt = Math.floor(new Date(memory.$createdAt).getTime() / 1000);
  const encodedData = encodeMemorySchemaData({ contentHash, category: memory.category, createdAt });

  return Response.json({
    contentHash,
    encodedData,
    schemaUID,
    easContractAddress: EAS_CONTRACT_ADDRESS,
    recipient: wallet.address,
  });
}
