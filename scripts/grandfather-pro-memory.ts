#!/usr/bin/env tsx
/**
 * One-time script: add "grandfatheredUnlimitedMemory" to the "users"
 * collection, then flag every user who is already an active/grace Pro
 * subscriber right now — so introducing the 1,000-memory Pro cap never
 * retroactively blocks someone who already paid under the old unlimited
 * terms. Only ever run once; new Pro subscribers after this point are
 * never flagged, so they get the real cap.
 * Run with: npx tsx scripts/grandfather-pro-memory.ts
 */

import { Client, Databases, Query } from "node-appwrite";
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

const GRACE_PERIOD_MS = 7 * 24 * 60 * 60 * 1000;

function isActiveOrGrace(plan: string, planExpiresAt: string | null, now: Date): boolean {
  if (plan !== "pro" || !planExpiresAt) return false;
  const expiresAt = new Date(planExpiresAt);
  return now.getTime() < expiresAt.getTime() + GRACE_PERIOD_MS;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function run() {
  console.log("\n=== Grandfathering existing Pro subscribers at unlimited memory ===\n");

  try {
    await db.createBooleanAttribute(DB_ID, "users", "grandfatheredUnlimitedMemory", false, false);
    console.log("  ✓ attr users.grandfatheredUnlimitedMemory");
    await sleep(3000);
  } catch (e: unknown) {
    const code = (e as { code?: number })?.code;
    if (code === 409) console.log("  ~ attr users.grandfatheredUnlimitedMemory (already exists)");
    else throw e;
  }

  const now = new Date();
  let cursor: string | undefined;
  let scanned = 0;
  let flagged = 0;

  for (;;) {
    const queries = [Query.equal("plan", "pro"), Query.limit(100)];
    if (cursor) queries.push(Query.cursorAfter(cursor));
    const page = await db.listDocuments(DB_ID, "users", queries);
    if (page.documents.length === 0) break;

    for (const doc of page.documents) {
      scanned++;
      const plan = doc.plan as string;
      const planExpiresAt = (doc.planExpiresAt as string | null) ?? null;
      if (isActiveOrGrace(plan, planExpiresAt, now)) {
        await db.updateDocument(DB_ID, "users", doc.$id, { grandfatheredUnlimitedMemory: true });
        flagged++;
        console.log(`  ✓ grandfathered ${doc.$id} (${doc.email ?? "no email"})`);
      }
    }

    cursor = page.documents[page.documents.length - 1].$id;
    if (page.documents.length < 100) break;
  }

  console.log(`\n✅ Done. Scanned ${scanned} Pro-plan users, grandfathered ${flagged} active/grace subscribers at unlimited memory.\n`);
}

run().catch((e) => { console.error(e); process.exit(1); });
