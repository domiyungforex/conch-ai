#!/usr/bin/env tsx
/**
 * One-time script to create the Creator Memory module schema: the creators
 * collection plus songs/ideas/campaigns/collaborators/content children, and
 * an enabled feature_flags row for "creator_ai". Run with:
 *   npx tsx scripts/setup-creator-module.ts
 *
 * Additive only — existing collections and documents are untouched.
 */

import { Client, Databases, DatabasesIndexType as IndexType, ID, Query } from "node-appwrite";
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

type AttrFn = () => Promise<unknown>;

async function createCollectionWithAttrs(
  id: string,
  name: string,
  attrs: [string, AttrFn][],
  indexes: [string, string, IndexType, string[]][] = []
) {
  console.log(`\n--- ${name} (${id}) ---`);
  await tryCreate(`collection: ${id}`, () => db.createCollection(DB_ID, id, name));
  for (const [key, fn] of attrs) {
    await tryCreate(`attr ${id}.${key}`, fn);
  }
  if (indexes.length > 0) {
    await sleep(3000);
    for (const [label, indexId, type, fields] of indexes) {
      await tryCreate(`index ${id}.${label}`, () => db.createIndex(DB_ID, id, indexId, type, fields));
    }
  }
}

async function run() {
  console.log("\n=== Building Creator Memory module schema ===\n");

  await createCollectionWithAttrs(
    "creators",
    "creators",
    [
      ["userId", () => db.createStringAttribute(DB_ID, "creators", "userId", 36, true)],
      ["name", () => db.createStringAttribute(DB_ID, "creators", "name", 200, true)],
      [
        "stage",
        () => db.createEnumAttribute(DB_ID, "creators", "stage",
          ["musician", "artist", "youtuber", "tiktok", "influencer", "writer", "producer", "photographer", "agency"],
          false, "musician"),
      ],
      ["genre", () => db.createStringAttribute(DB_ID, "creators", "genre", 100, false)],
      ["brandIdentity", () => db.createStringAttribute(DB_ID, "creators", "brandIdentity", 2000, false)],
      ["bio", () => db.createStringAttribute(DB_ID, "creators", "bio", 2000, false)],
    ],
    [["userId", "idx_userId", IndexType.Key, ["userId"]]]
  );

  await createCollectionWithAttrs(
    "creator_songs",
    "creator_songs",
    [
      ["creatorId", () => db.createStringAttribute(DB_ID, "creator_songs", "creatorId", 36, true)],
      ["title", () => db.createStringAttribute(DB_ID, "creator_songs", "title", 200, true)],
      ["lyrics", () => db.createStringAttribute(DB_ID, "creator_songs", "lyrics", 10000, false)],
      ["status", () => db.createEnumAttribute(DB_ID, "creator_songs", "status", ["unreleased", "released", "archived"], false, "unreleased")],
      ["releaseDate", () => db.createStringAttribute(DB_ID, "creator_songs", "releaseDate", 64, false)],
      ["producers", () => db.createStringAttribute(DB_ID, "creator_songs", "producers", 100, false, undefined, true)],
      ["notes", () => db.createStringAttribute(DB_ID, "creator_songs", "notes", 2000, false)],
    ],
    [["creatorId", "idx_creatorId", IndexType.Key, ["creatorId"]]]
  );

  await createCollectionWithAttrs(
    "creator_ideas",
    "creator_ideas",
    [
      ["creatorId", () => db.createStringAttribute(DB_ID, "creator_ideas", "creatorId", 36, true)],
      ["title", () => db.createStringAttribute(DB_ID, "creator_ideas", "title", 200, true)],
      ["description", () => db.createStringAttribute(DB_ID, "creator_ideas", "description", 2000, true)],
      ["platform", () => db.createStringAttribute(DB_ID, "creator_ideas", "platform", 64, false)],
      ["status", () => db.createEnumAttribute(DB_ID, "creator_ideas", "status", ["idea", "in_progress", "published", "archived"], false, "idea")],
      ["notes", () => db.createStringAttribute(DB_ID, "creator_ideas", "notes", 2000, false)],
    ],
    [["creatorId", "idx_creatorId", IndexType.Key, ["creatorId"]]]
  );

  await createCollectionWithAttrs(
    "creator_campaigns",
    "creator_campaigns",
    [
      ["creatorId", () => db.createStringAttribute(DB_ID, "creator_campaigns", "creatorId", 36, true)],
      ["name", () => db.createStringAttribute(DB_ID, "creator_campaigns", "name", 200, true)],
      ["goal", () => db.createStringAttribute(DB_ID, "creator_campaigns", "goal", 1000, false)],
      ["platform", () => db.createStringAttribute(DB_ID, "creator_campaigns", "platform", 64, false)],
      ["budgetUsd", () => db.createFloatAttribute(DB_ID, "creator_campaigns", "budgetUsd", false, undefined, undefined, 0)],
      ["status", () => db.createEnumAttribute(DB_ID, "creator_campaigns", "status", ["planned", "active", "completed", "archived"], false, "planned")],
      ["notes", () => db.createStringAttribute(DB_ID, "creator_campaigns", "notes", 2000, false)],
    ],
    [["creatorId", "idx_creatorId", IndexType.Key, ["creatorId"]]]
  );

  await createCollectionWithAttrs(
    "creator_collaborators",
    "creator_collaborators",
    [
      ["creatorId", () => db.createStringAttribute(DB_ID, "creator_collaborators", "creatorId", 36, true)],
      ["name", () => db.createStringAttribute(DB_ID, "creator_collaborators", "name", 200, true)],
      ["role", () => db.createStringAttribute(DB_ID, "creator_collaborators", "role", 100, false)],
      ["contact", () => db.createStringAttribute(DB_ID, "creator_collaborators", "contact", 320, false)],
      ["notes", () => db.createStringAttribute(DB_ID, "creator_collaborators", "notes", 2000, false)],
    ],
    [["creatorId", "idx_creatorId", IndexType.Key, ["creatorId"]]]
  );

  await createCollectionWithAttrs(
    "creator_content",
    "creator_content",
    [
      ["creatorId", () => db.createStringAttribute(DB_ID, "creator_content", "creatorId", 36, true)],
      ["title", () => db.createStringAttribute(DB_ID, "creator_content", "title", 300, true)],
      ["platform", () => db.createStringAttribute(DB_ID, "creator_content", "platform", 64, false)],
      ["url", () => db.createStringAttribute(DB_ID, "creator_content", "url", 500, false)],
      ["publishedAt", () => db.createStringAttribute(DB_ID, "creator_content", "publishedAt", 64, false)],
      ["notes", () => db.createStringAttribute(DB_ID, "creator_content", "notes", 2000, false)],
    ],
    [["creatorId", "idx_creatorId", IndexType.Key, ["creatorId"]]]
  );

  // Feature flag — enabled for everyone (unlike business_ai, which is Pro-gated).
  console.log("\n--- feature flag: creator_ai ---");
  await tryCreate("flag creator_ai", async () => {
    const existing = await db.listDocuments(DB_ID, "feature_flags", [
      Query.equal("key", "creator_ai"),
      Query.limit(1),
    ]);
    if (existing.documents.length > 0) throw Object.assign(new Error("already exists"), { code: 409 });
    await db.createDocument(DB_ID, "feature_flags", ID.unique(), {
      key: "creator_ai",
      status: "enabled",
      rolloutPercentage: 100,
      minPlan: null,
      allowlistUserIds: [],
      updatedBy: "migration",
    });
  });

  console.log("\n✅ Done. Creator Memory module is live (sidebar: Creators).\n");
}

run().catch((e) => { console.error(e); process.exit(1); });
