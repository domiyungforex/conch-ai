import { ethers } from "ethers";
import { EAS } from "@ethereum-attestation-service/eas-sdk";
import { createAdminClient } from "@/lib/appwrite";
import { DB_ID, COLLECTIONS, type MemoryDoc, type WalletDoc, type AppwriteDoc } from "@/lib/db";
import { resolveAuth, scopeAllows, forbiddenScope } from "@/lib/apiAuth";
import { MemoryVerifyConfirmSchema } from "@/lib/validators";
import { computeContentHash, decodeMemorySchemaData, EAS_CONTRACT_ADDRESS } from "@/lib/eas";
import { checkFeatureAccess, upgradeRequiredResponse } from "@/lib/planLimits";
import { Query } from "node-appwrite";

const RPC_URL = process.env.BASE_RPC_URL ?? "https://mainnet.base.org";

// Never trusts the client's claim that an attestation exists — re-derives the
// expected hash from the memory's CURRENT content and reads the attestation
// back from chain via a public RPC before marking anything "verified".
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolved = await resolveAuth(req);
  if (!resolved) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  if (!scopeAllows(resolved.scope, "write")) return forbiddenScope();
  const { userId: appwriteId } = resolved;

  const schemaUID = process.env.EAS_SCHEMA_UID;
  if (!schemaUID) {
    return new Response(JSON.stringify({ error: "On-chain verification isn't configured yet" }), { status: 503 });
  }

  const parsed = MemoryVerifyConfirmSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: "Invalid request", details: parsed.error.flatten() }), { status: 400 });
  }
  const { attestationUid, txHash } = parsed.data;

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
    return new Response(JSON.stringify({ error: "No linked wallet on file" }), { status: 400 });
  }
  const wallet = walletResult.documents[0] as unknown as AppwriteDoc<WalletDoc>;

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const eas = new EAS(EAS_CONTRACT_ADDRESS);
  eas.connect(provider);

  let attestation;
  try {
    attestation = await eas.getAttestation(attestationUid);
  } catch {
    return new Response(JSON.stringify({ error: "Could not read attestation from chain" }), { status: 400 });
  }

  const expectedHash = computeContentHash(memory.content);
  const decoded = decodeMemorySchemaData(attestation.data);

  const valid =
    attestation.schema.toLowerCase() === schemaUID.toLowerCase() &&
    attestation.attester.toLowerCase() === wallet.address.toLowerCase() &&
    attestation.revocationTime === BigInt(0) &&
    decoded.contentHash.toLowerCase() === expectedHash.toLowerCase();

  if (!valid) {
    return new Response(JSON.stringify({ error: "Attestation does not match this memory" }), { status: 400 });
  }

  const updated = await databases.updateDocument(DB_ID, COLLECTIONS.MEMORIES, id, {
    verificationStatus: "verified",
    attestationUid,
    attestationTxHash: txHash,
    contentHash: expectedHash,
  }) as unknown as AppwriteDoc<MemoryDoc>;

  return Response.json({ memory: updated });
}
