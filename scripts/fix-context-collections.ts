#!/usr/bin/env npx tsx
/**
 * Fix incomplete Conch 2.0 context engine collections.
 *
 * Deletes and recreates context_objects, decisions, and constraints
 * collections with all required attributes.
 *
 * Usage: npx tsx scripts/fix-context-collections.ts
 */

import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import { Client, Databases, IndexType } from "node-appwrite";

const ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!;
const PROJECT = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!;
const API_KEY = process.env.APPWRITE_API_KEY!;
const DB_ID = process.env.APPWRITE_DATABASE_ID!;

const client = new Client().setEndpoint(ENDPOINT).setProject(PROJECT).setKey(API_KEY);
const db = new Databases(client);

async function tryDelete(label: string, collectionId: string) {
  try {
    await db.deleteCollection(DB_ID, collectionId);
    console.log(`  🗑️  Deleted ${label}`);
  } catch {
    console.log(`  ⚠️  ${label} not found or already deleted`);
  }
}

async function tryCreate(label: string, fn: () => Promise<unknown>) {
  try {
    await fn();
    console.log(`  ✅ ${label}`);
  } catch (err: any) {
    if (err?.code === 409) {
      // Already exists — skip
    } else {
      console.log(`  ⚠️  ${label}: ${err?.message ?? err}`);
    }
  }
}

async function main() {
  console.log("🔧 Fixing Conch 2.0 context engine collections\n");

  // ── Delete broken collections ─────────────────────────────────────────
  console.log("Deleting incomplete collections...");

  await tryDelete("context_objects", "context_objects");
  await tryDelete("decisions", "decisions");
  await tryDelete("constraints", "constraints");

  // Small delay to let Appwrite propagate deletes
  await new Promise((r) => setTimeout(r, 2000));

  // ── Recreate context_objects ──────────────────────────────────────────
  console.log("\nRecreating context_objects...");

  await tryCreate("collection: context_objects", () =>
    db.createCollection(DB_ID, "context_objects", "context_objects")
  );

  for (const [key, fn] of [
    ["userId",         () => db.createStringAttribute(DB_ID, "context_objects", "userId",         36,    true)],
    ["projectId",      () => db.createStringAttribute(DB_ID, "context_objects", "projectId",      36,    false)],
    ["type",           () => db.createEnumAttribute(DB_ID,   "context_objects", "type",           ["memory","intent","goal","decision","constraint","assumption","instruction","preference","task_state","project_state","knowledge"], true)],
    ["content",        () => db.createStringAttribute(DB_ID, "context_objects", "content",        10000, true)],
    ["lifecycle",      () => db.createEnumAttribute(DB_ID,   "context_objects", "lifecycle",      ["draft","active","verified","stale","superseded","archived","deleted"], true)],
    ["importance",     () => db.createFloatAttribute(DB_ID,  "context_objects", "importance",     false, 0, 1, 0.5)],
    ["confidence",     () => db.createFloatAttribute(DB_ID,  "context_objects", "confidence",     false, 0, 1, 0.5)],
    ["source",         () => db.createEnumAttribute(DB_ID,   "context_objects", "source",         ["user","conversation","document","agent","external_api","database","developer","system","verified_source"], true)],
    ["sourceDetail",   () => db.createStringAttribute(DB_ID, "context_objects", "sourceDetail",   500,   false)],
    ["agentId",        () => db.createStringAttribute(DB_ID, "context_objects", "agentId",        36,    false)],
    ["tags",           () => db.createStringAttribute(DB_ID, "context_objects", "tags",           256,   false, undefined, true)],
    ["relatedIds",     () => db.createStringAttribute(DB_ID, "context_objects", "relatedIds",     36,    false, undefined, true)],
    ["supersededBy",   () => db.createStringAttribute(DB_ID, "context_objects", "supersededBy",   36,    false)],
    ["supersededFrom", () => db.createStringAttribute(DB_ID, "context_objects", "supersededFrom", 36,    false)],
    ["version",        () => db.createIntegerAttribute(DB_ID,"context_objects", "version",        false, 1)],
    ["embedding",      () => db.createFloatAttribute(DB_ID,  "context_objects", "embedding",      false)],
  ] as [string, () => Promise<unknown>][]) {
    await tryCreate(`  attr context_objects.${key}`, fn);
  }

  await tryCreate("index: context_objects.userId", () =>
    db.createIndex(DB_ID, "context_objects", "idx_userId", IndexType.Key, ["userId"])
  );
  await tryCreate("index: context_objects.type", () =>
    db.createIndex(DB_ID, "context_objects", "idx_type", IndexType.Key, ["type"])
  );
  await tryCreate("index: context_objects.lifecycle", () =>
    db.createIndex(DB_ID, "context_objects", "idx_lifecycle", IndexType.Key, ["lifecycle"])
  );

  // ── Recreate decisions ───────────────────────────────────────────────
  console.log("\nRecreating decisions...");

  await tryCreate("collection: decisions", () =>
    db.createCollection(DB_ID, "decisions", "decisions")
  );

  for (const [key, fn] of [
    ["userId",            () => db.createStringAttribute(DB_ID, "decisions", "userId",            36,    true)],
    ["projectId",         () => db.createStringAttribute(DB_ID, "decisions", "projectId",         36,    false)],
    ["what",              () => db.createStringAttribute(DB_ID, "decisions", "what",              2000,  true)],
    ["why",               () => db.createStringAttribute(DB_ID, "decisions", "why",               2000,  true)],
    ["who",               () => db.createStringAttribute(DB_ID, "decisions", "who",               200,   false)],
    ["alternatives",      () => db.createStringAttribute(DB_ID, "decisions", "alternatives",      2000,  false)],
    ["constraints",       () => db.createStringAttribute(DB_ID, "decisions", "constraints",       2000,  false)],
    ["assumptions",       () => db.createStringAttribute(DB_ID, "decisions", "assumptions",       2000,  false)],
    ["fallbackCondition", () => db.createStringAttribute(DB_ID, "decisions", "fallbackCondition", 1000,  false)],
    ["status",            () => db.createEnumAttribute(DB_ID,   "decisions", "status",            ["active","superseded","archived"], true)],
    ["supersededBy",      () => db.createStringAttribute(DB_ID, "decisions", "supersededBy",      36,    false)],
    ["agentId",           () => db.createStringAttribute(DB_ID, "decisions", "agentId",           36,    false)],
    ["confidence",        () => db.createFloatAttribute(DB_ID,  "decisions", "confidence",        false, 0, 1, 0.5)],
    ["tags",              () => db.createStringAttribute(DB_ID, "decisions", "tags",              256,   false, undefined, true)],
  ] as [string, () => Promise<unknown>][]) {
    await tryCreate(`  attr decisions.${key}`, fn);
  }

  await tryCreate("index: decisions.userId", () =>
    db.createIndex(DB_ID, "decisions", "idx_userId", IndexType.Key, ["userId"])
  );
  await tryCreate("index: decisions.status", () =>
    db.createIndex(DB_ID, "decisions", "idx_status", IndexType.Key, ["status"])
  );

  // ── Recreate constraints ─────────────────────────────────────────────
  console.log("\nRecreating constraints...");

  await tryCreate("collection: constraints", () =>
    db.createCollection(DB_ID, "constraints", "constraints")
  );

  for (const [key, fn] of [
    ["userId",       () => db.createStringAttribute(DB_ID, "constraints", "userId",       36,   true)],
    ["projectId",    () => db.createStringAttribute(DB_ID, "constraints", "projectId",    36,   false)],
    ["content",      () => db.createStringAttribute(DB_ID, "constraints", "content",      2000, true)],
    ["category",     () => db.createStringAttribute(DB_ID, "constraints", "category",     100,  true)],
    ["severity",     () => db.createEnumAttribute(DB_ID,   "constraints", "severity",     ["hard","soft"], true)],
    ["source",       () => db.createEnumAttribute(DB_ID,   "constraints", "source",       ["user","conversation","document","agent","external_api","database","developer","system","verified_source"], true)],
    ["sourceDetail", () => db.createStringAttribute(DB_ID, "constraints", "sourceDetail", 500,  false)],
    ["status",       () => db.createEnumAttribute(DB_ID,   "constraints", "status",       ["active","relaxed","removed"], true)],
    ["agentId",      () => db.createStringAttribute(DB_ID, "constraints", "agentId",      36,   false)],
    ["tags",         () => db.createStringAttribute(DB_ID, "constraints", "tags",         256,  false, undefined, true)],
  ] as [string, () => Promise<unknown>][]) {
    await tryCreate(`  attr constraints.${key}`, fn);
  }

  await tryCreate("index: constraints.userId", () =>
    db.createIndex(DB_ID, "constraints", "idx_userId", IndexType.Key, ["userId"])
  );
  await tryCreate("index: constraints.status", () =>
    db.createIndex(DB_ID, "constraints", "idx_status", IndexType.Key, ["status"])
  );

  // ── Also fix context_provenance (may need source attribute fix) ───────
  console.log("\nFixing context_provenance if needed...");
  await tryDelete("context_provenance", "context_provenance");
  await new Promise((r) => setTimeout(r, 1000));

  await tryCreate("collection: context_provenance", () =>
    db.createCollection(DB_ID, "context_provenance", "context_provenance")
  );

  for (const [key, fn] of [
    ["contextId",    () => db.createStringAttribute(DB_ID, "context_provenance", "contextId",    36,   true)],
    ["contextType",  () => db.createStringAttribute(DB_ID, "context_provenance", "contextType",  64,   true)],
    ["source",       () => db.createEnumAttribute(DB_ID,   "context_provenance", "source",       ["user","conversation","document","agent","external_api","database","developer","system","verified_source"], true)],
    ["sourceDetail", () => db.createStringAttribute(DB_ID, "context_provenance", "sourceDetail", 500,  false)],
    ["agentId",      () => db.createStringAttribute(DB_ID, "context_provenance", "agentId",      36,   false)],
    ["verifiedAt",   () => db.createStringAttribute(DB_ID, "context_provenance", "verifiedAt",   64,   false)],
    ["confidence",   () => db.createFloatAttribute(DB_ID,  "context_provenance", "confidence",   false, 0, 1, 0.5)],
  ] as [string, () => Promise<unknown>][]) {
    await tryCreate(`  attr context_provenance.${key}`, fn);
  }

  console.log("\n✅ Done! Context engine collections are fixed.");
}

main().catch((err) => {
  console.error("\n💥 Fatal error:", err);
  process.exit(1);
});
