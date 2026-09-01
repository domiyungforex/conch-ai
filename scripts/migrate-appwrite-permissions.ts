#!/usr/bin/env tsx
/**
 * One-time migration: enable document-level security on the "memories"
 * collection so Appwrite Realtime can authorize per-document subscriptions.
 * Safe to re-run — updateCollection is idempotent. Admin API keys bypass
 * permission checks regardless of documentSecurity, so this does not affect
 * any existing server-side read/write path.
 *
 * Run with: npx tsx scripts/migrate-appwrite-permissions.ts
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

async function migrate() {
  console.log("\n=== Enabling document security ===\n");

  // Only "memories" for the first live-sync increment. Add "conversations",
  // "messages", "agents" here when those get the same treatment.
  for (const collectionId of ["memories"]) {
    try {
      await db.updateCollection(DB_ID, collectionId, collectionId, undefined, true, true);
      console.log(`  ✓ ${collectionId}: documentSecurity enabled`);
    } catch (e: unknown) {
      console.error(`  ✗ ${collectionId}:`, (e as Error).message);
    }
  }

  console.log("\n✅ Done. Smoke-test create/edit/delete on a memory before considering this finished.\n");
}

migrate().catch((e) => { console.error(e); process.exit(1); });
