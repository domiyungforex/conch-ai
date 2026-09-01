#!/usr/bin/env tsx
/**
 * ONE-TIME setup script — registers Conch's memory-verification schema with
 * EAS's SchemaRegistry on Base mainnet. Run once, ever, by whoever owns this
 * project. Prints a schemaUID to add to EAS_SCHEMA_UID (a public, non-secret
 * value — safe to put in Vercel env) once done.
 *
 * This is the ONLY place in the whole app that ever touches a private key,
 * and it's a one-off local run, not a deployed code path:
 *   - the key belongs to YOU, the project owner, not the app or its users
 *   - it pays a tiny one-time gas fee to register the schema
 *   - nothing about it is ever committed, deployed, or reused per-request —
 *     delete EAS_SETUP_PRIVATE_KEY from your local .env right after running
 *
 * Run with:
 *   EAS_SETUP_PRIVATE_KEY=0x... npx tsx scripts/register-eas-schema.ts
 */

import { ethers } from "ethers";
import { SchemaRegistry } from "@ethereum-attestation-service/eas-sdk";
import { SCHEMA_REGISTRY_ADDRESS, MEMORY_SCHEMA } from "../src/lib/eas";

const PRIVATE_KEY = process.env.EAS_SETUP_PRIVATE_KEY;
const RPC_URL = process.env.BASE_RPC_URL ?? "https://mainnet.base.org";

if (!PRIVATE_KEY) {
  console.error("Missing EAS_SETUP_PRIVATE_KEY. This must be YOUR wallet's private key — it pays the one-time schema registration gas fee, nothing else.");
  process.exit(1);
}

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const signer = new ethers.Wallet(PRIVATE_KEY!, provider);

  console.log(`Registering schema from ${await signer.getAddress()} on Base...`);

  const registry = new SchemaRegistry(SCHEMA_REGISTRY_ADDRESS);
  registry.connect(signer);

  const tx = await registry.register({
    schema: MEMORY_SCHEMA,
    resolverAddress: "0x0000000000000000000000000000000000000000",
    revocable: true,
  });

  const schemaUID = await tx.wait();

  console.log(`\n✅ Schema registered: ${schemaUID}\n`);
  console.log(`Add this to your .env and Vercel project env vars:\n  EAS_SCHEMA_UID=${schemaUID}\n`);
  console.log("This value is public (visible on-chain and on easscan.org) — safe to store as a plain env var, not a secret.");
}

main().catch((e) => { console.error(e); process.exit(1); });
