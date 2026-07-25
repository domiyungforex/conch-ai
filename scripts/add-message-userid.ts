#!/usr/bin/env tsx
/**
 * One-time script to add a "userId" attribute + index to the "messages"
 * collection, so daily chat-message quota can be queried directly without
 * joining through conversations. Run with: npx tsx scripts/add-message-userid.ts
 */

import { Client, Databases, DatabasesIndexType as IndexType } from "node-appwrite";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

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

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function run() {
  console.log("\n=== Adding messages.userId ===\n");

  await tryCreate("attr messages.userId", () =>
    db.createStringAttribute(DB_ID, "messages", "userId", 36, false)
  );

  // Existing collection with live documents — give the attribute a moment to
  // finish going from "processing" to "available" before indexing it (unlike
  // a brand-new empty collection, this isn't instant).
  await sleep(3000);

  await tryCreate("index: messages.userId", () =>
    db.createIndex(DB_ID, "messages", "idx_userId", IndexType.Key, ["userId"])
  );

  console.log("\n✅ Done. Existing message rows have no userId — the daily chat quota only counts rows written after this migration, so free users effectively get a fresh window today.\n");
}

run().catch((e) => { console.error(e); process.exit(1); });
