#!/usr/bin/env tsx
/**
 * One-time script to add "agentType" to the "agents" collection, so agents
 * can be tagged personal/research/coding/business/financial/economic/
 * operations/marketing/data. Optional — existing agents without it are
 * treated as "personal". Run with: npx tsx scripts/add-agent-type.ts
 */

import { Client, Databases } from "node-appwrite";
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

async function run() {
  console.log("\n=== Adding agents.agentType ===\n");
  try {
    await db.createEnumAttribute(
      DB_ID,
      "agents",
      "agentType",
      ["personal", "research", "coding", "business", "financial", "economic", "operations", "marketing", "data"],
      false,
      "personal"
    );
    console.log("  ✓ attr agents.agentType");
  } catch (e: unknown) {
    const code = (e as { code?: number })?.code;
    if (code === 409) console.log("  ~ attr agents.agentType (already exists)");
    else console.error("  ✗ attr agents.agentType:", (e as Error).message);
  }
  console.log("\n✅ Done.\n");
}

run().catch((e) => { console.error(e); process.exit(1); });
