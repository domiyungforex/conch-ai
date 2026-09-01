#!/usr/bin/env tsx
/**
 * One-time script to add privacy/notification preference attributes to the
 * "users" collection. Run with: npx tsx scripts/add-user-preference-fields.ts
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
  console.log("\n=== Adding user preference attributes ===\n");

  const bools: [string, boolean][] = [
    ["publicProfile", false],
    ["notifyChatSummaries", true],
    ["notifyMemoryInsights", true],
    ["notifyAgentAlerts", false],
    ["notifyWeeklyDigest", true],
    ["notifyProductUpdates", false],
  ];
  for (const [key, def] of bools) {
    await tryCreate(`attr users.${key}`, () =>
      db.createBooleanAttribute(DB_ID, "users", key, false, def)
    );
  }

  console.log("\n✅ Done.\n");
}

run().catch((e) => { console.error(e); process.exit(1); });
