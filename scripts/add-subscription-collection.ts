#!/usr/bin/env tsx
/**
 * One-time script to create the "payments" collection for subscription
 * billing history. Run with: npx tsx scripts/add-subscription-collection.ts
 */

import { Client, Databases, DatabasesIndexType as IndexType } from "node-appwrite";
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
  console.log("\n=== Creating payments collection ===\n");

  await tryCreate("collection: payments", () =>
    db.createCollection(DB_ID, "payments", "payments")
  );

  for (const [key, fn] of [
    ["userId",              () => db.createStringAttribute(DB_ID, "payments", "userId", 36, true)],
    ["txHash",              () => db.createStringAttribute(DB_ID, "payments", "txHash", 66, true)],
    ["walletAddress",       () => db.createStringAttribute(DB_ID, "payments", "walletAddress", 64, true)],
    ["chainId",             () => db.createIntegerAttribute(DB_ID, "payments", "chainId", true)],
    ["plan",                () => db.createStringAttribute(DB_ID, "payments", "plan", 32, true)],
    ["billingCycle",        () => db.createEnumAttribute(DB_ID, "payments", "billingCycle", ["monthly", "annual"], true)],
    ["amountUsdcBaseUnits", () => db.createIntegerAttribute(DB_ID, "payments", "amountUsdcBaseUnits", true)],
    ["periodStart",         () => db.createStringAttribute(DB_ID, "payments", "periodStart", 64, true)],
    ["periodEnd",           () => db.createStringAttribute(DB_ID, "payments", "periodEnd", 64, true)],
    ["blockNumber",         () => db.createIntegerAttribute(DB_ID, "payments", "blockNumber", true)],
    ["confirmedAt",         () => db.createStringAttribute(DB_ID, "payments", "confirmedAt", 64, true)],
  ] as [string, () => Promise<unknown>][]) {
    await tryCreate(`  attr payments.${key}`, fn);
  }

  await tryCreate("index: payments.userId", () =>
    db.createIndex(DB_ID, "payments", "idx_userId", IndexType.Key, ["userId"])
  );
  await tryCreate("index: payments.txHash", () =>
    db.createIndex(DB_ID, "payments", "idx_txHash", IndexType.Unique, ["txHash"])
  );

  console.log("\n✅ Done.\n");
}

run().catch((e) => { console.error(e); process.exit(1); });
