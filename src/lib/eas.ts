import { SchemaEncoder } from "@ethereum-attestation-service/eas-sdk";
import { keccak256, toBytes } from "viem";

// Base mainnet system predeploys — confirmed against Basescan's "Base: EAS" /
// "Base: Schema Registry" public name tags, not hardcoded from memory alone.
export const EAS_CONTRACT_ADDRESS = "0x4200000000000000000000000000000000000021";
export const SCHEMA_REGISTRY_ADDRESS = "0x4200000000000000000000000000000000000020";

export const MEMORY_SCHEMA = "bytes32 contentHash,string category,uint256 createdAt";

export function computeContentHash(content: string): `0x${string}` {
  return keccak256(toBytes(content));
}

export function encodeMemorySchemaData(params: {
  contentHash: `0x${string}`;
  category: string;
  createdAt: number;
}): string {
  const encoder = new SchemaEncoder(MEMORY_SCHEMA);
  return encoder.encodeData([
    { name: "contentHash", type: "bytes32", value: params.contentHash },
    { name: "category", type: "string", value: params.category },
    { name: "createdAt", type: "uint256", value: BigInt(params.createdAt) },
  ]);
}

export function decodeMemorySchemaData(data: string) {
  const encoder = new SchemaEncoder(MEMORY_SCHEMA);
  const decoded = encoder.decodeData(data);
  const byName = Object.fromEntries(decoded.map((d) => [d.name, d.value.value]));
  return {
    contentHash: String(byName.contentHash),
    category: String(byName.category),
    createdAt: Number(byName.createdAt),
  };
}
