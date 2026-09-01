#!/usr/bin/env tsx
/**
 * One-time script to add the "relatedMemoryIds" attribute (relationship
 * layer) to the "memories" collection. Run with:
 *   npx tsx scripts/add-memory-relations.ts
 *
 * Additive only — existing documents are untouched.
 */

import { Client, Databases } from "node-appwrite";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
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

async function run() {
  console.log("\n=== Adding memories.relatedMemoryIds ===\n");
  try {
    await db.createStringAttribute(DB_ID, "memories", "relatedMemoryIds", 36, false, undefined, true);
    console.log("  ✓ attr memories.relatedMemoryIds");
  } catch (e: unknown) {
    const code = (e as { code?: number })?.code;
    if (code === 409) console.log("  ~ attr memories.relatedMemoryIds (already exists)");
    else throw e;
  }
  console.log("\n✅ Done.\n");
}

run().catch((e) => { console.error(e); process.exit(1); });
