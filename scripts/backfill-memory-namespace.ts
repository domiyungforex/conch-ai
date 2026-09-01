#!/usr/bin/env tsx
/**
 * Backfill namespace='default' on pre-existing memory documents.
 *
 * When the `namespace` attribute was added (see add-memory-namespace.ts),
 * Appwrite gave the attribute a default of "default" but does NOT backfill
 * existing documents — docs created before the attribute keep a null value.
 * The API is backward compatible with that (it only filters by namespace when
 * one is explicitly requested), but for consistency every memory should
 * resolve to "default".
 *
 * Run with: npx tsx scripts/backfill-memory-namespace.ts
 *
 * Idempotent — only touches documents where namespace is null; safe to re-run.
 */

import { Client, Databases, Query } from "node-appwrite";
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

const LIMIT = 100;

async function run() {
  console.log("\n=== Backfilling memories.namespace = \"default\" ===\n");

  let offset = 0;
  let updated = 0;
  let alreadySet = 0;
  let scanned = 0;

  while (true) {
    // Only null namespaces need a backfill; already-"default" or custom
    // namespaces are left untouched.
    const result = await db.listDocuments(DB_ID, "memories", [
      Query.isNull("namespace"),
      Query.limit(LIMIT),
      Query.offset(offset),
    ]);

    const docs = result.documents as { $id: string; namespace?: string | null }[];
    scanned += docs.length;
    if (docs.length === 0) break;

    for (const doc of docs) {
      if (doc.namespace == null) {
        await db.updateDocument(DB_ID, "memories", doc.$id, { namespace: "default" });
        updated += 1;
      } else {
        alreadySet += 1;
      }
    }

    offset += docs.length;
    if (docs.length < LIMIT) break;
  }

  console.log(`  scanned: ${scanned}`);
  console.log(`  backfilled to "default": ${updated}`);
  console.log(`  already had a namespace: ${alreadySet}`);
  console.log("\n✅ Done.\n");
}

run().catch((e) => { console.error(e); process.exit(1); });
