#!/usr/bin/env tsx
/**
 * One-time script to add on-chain-verification attributes to the "memories"
 * collection. Run with: npx tsx scripts/add-verification-fields.ts
 */

import { Client, Databases } from "node-appwrite";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!;
const PROJECT = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!;
const API_KEY = process.env.APPWRITE_API_KEY!;
const DB_ID = process.env.APPWRITE_DATABASE_ID!;

if (!ENDPOINT || !PROJECT || !API_KEY || !DB_ID) {
  console.error("Missing env vars. Check NEXT_PUBLIC_APPWRITE_ENDPOINT, NEXT_PUBLIC_APPWRITE_PROJECT_ID, APPWRITE_API_KEY, APPWRITE_DATABASE_ID");
  process.exit(1);
}

const client = new Client().setEndpoint(ENDPOINT).setProject(PROJECT).setKey(API_KEY);
const db = new Databases(client);

async function tryCreate(label: string, fn: () => Promise<unknown>) {
  try {
    await fn();
    console.log(`  ✓ ${label}`);
  } catch (e: unknown) {
    const code = (e as { code?: number })?.code;
    if (code === 409) {
      console.log(`  ~ ${label} (already exists)`);
    } else {
      console.error(`  ✗ ${label}:`, (e as Error).message);
    }
  }
}

async function run() {
  console.log("\n=== Adding memory verification attributes ===\n");

  await tryCreate("attr memories.verificationStatus", () =>
    db.createEnumAttribute(DB_ID, "memories", "verificationStatus", ["none", "pending", "verified"], false, "none")
  );
  await tryCreate("attr memories.attestationUid", () =>
    db.createStringAttribute(DB_ID, "memories", "attestationUid", 128, false)
  );
  await tryCreate("attr memories.attestationTxHash", () =>
    db.createStringAttribute(DB_ID, "memories", "attestationTxHash", 128, false)
  );
  await tryCreate("attr memories.contentHash", () =>
    db.createStringAttribute(DB_ID, "memories", "contentHash", 128, false)
  );

  console.log("\n✅ Done.\n");
}

run().catch((e) => { console.error(e); process.exit(1); });
