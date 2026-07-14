#!/usr/bin/env tsx
/**
 * One-time script to create all Appwrite Database collections and attributes.
 * Run with: npx tsx scripts/setup-appwrite-db.ts
 *
 * Requires .env to have:
 *   NEXT_PUBLIC_APPWRITE_ENDPOINT
 *   NEXT_PUBLIC_APPWRITE_PROJECT_ID
 *   APPWRITE_API_KEY
 *   APPWRITE_DATABASE_ID (the ID of a database you've already created in the console)
 */

import { Client, Databases, DatabasesIndexType as IndexType } from "node-appwrite";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!;
const PROJECT  = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!;
const API_KEY  = process.env.APPWRITE_API_KEY!;
const DB_ID    = process.env.APPWRITE_DATABASE_ID!;

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

async function setupCollections() {
  console.log("\n=== Creating collections ===\n");

  // ── users ─────────────────────────────────────────────────────────────────
  await tryCreate("collection: users", () =>
    db.createCollection(DB_ID, "users", "users", [
      `read("any")`, `create("users")`, `update("users")`, `delete("users")`,
    ])
  );
  for (const [key, fn] of [
    ["email",         () => db.createStringAttribute(DB_ID, "users", "email",         320, true)],
    ["name",          () => db.createStringAttribute(DB_ID, "users", "name",          256, false)],
    ["avatarUrl",     () => db.createStringAttribute(DB_ID, "users", "avatarUrl",     2048, false)],
    ["plan",          () => db.createStringAttribute(DB_ID, "users", "plan",          64,  true, "free")],
    ["planExpiresAt", () => db.createStringAttribute(DB_ID, "users", "planExpiresAt", 64,  false)],
    ["onboarded",     () => db.createBooleanAttribute(DB_ID, "users", "onboarded",    true, false)],
  ] as [string, () => Promise<unknown>][]) {
    await tryCreate(`  attr users.${key}`, fn);
  }
  await tryCreate("index: users.email", () =>
    db.createIndex(DB_ID, "users", "idx_email", IndexType.Unique, ["email"])
  );

  // ── memories ──────────────────────────────────────────────────────────────
  await tryCreate("collection: memories", () =>
    db.createCollection(DB_ID, "memories", "memories")
  );
  for (const [key, fn] of [
    ["userId",       () => db.createStringAttribute(DB_ID, "memories", "userId",       36,    true)],
    ["content",      () => db.createStringAttribute(DB_ID, "memories", "content",      50000, true)],
    ["category",     () => db.createEnumAttribute(DB_ID,   "memories", "category",     ["EPISODIC","SEMANTIC","PREFERENCE","PROCEDURAL"], true, "SEMANTIC")],
    ["tags",         () => db.createStringAttribute(DB_ID, "memories", "tags",         256,   false, undefined, true)],
    ["embedding",    () => db.createFloatAttribute(DB_ID,  "memories", "embedding", false, undefined, undefined, undefined, true)],
    ["importance",   () => db.createFloatAttribute(DB_ID,  "memories", "importance",   false, 0, 1, 0.5)],
    ["accessCount",  () => db.createIntegerAttribute(DB_ID,"memories", "accessCount",  false, 0)],
    ["lastAccessed", () => db.createStringAttribute(DB_ID, "memories", "lastAccessed", 64,    false)],
    ["source",       () => db.createStringAttribute(DB_ID, "memories", "source",       512,   false)],
    ["agentId",      () => db.createStringAttribute(DB_ID, "memories", "agentId",      36,    false)],
    ["isArchived",   () => db.createBooleanAttribute(DB_ID,"memories", "isArchived",   true,  false)],
  ] as [string, () => Promise<unknown>][]) {
    await tryCreate(`  attr memories.${key}`, fn);
  }
  await tryCreate("index: memories.userId", () =>
    db.createIndex(DB_ID, "memories", "idx_userId", IndexType.Key, ["userId"])
  );

  // ── conversations ──────────────────────────────────────────────────────────
  await tryCreate("collection: conversations", () =>
    db.createCollection(DB_ID, "conversations", "conversations")
  );
  for (const [key, fn] of [
    ["userId",  () => db.createStringAttribute(DB_ID, "conversations", "userId",  36,   true)],
    ["agentId", () => db.createStringAttribute(DB_ID, "conversations", "agentId", 36,   false)],
    ["title",   () => db.createStringAttribute(DB_ID, "conversations", "title",   256,  true, "New Conversation")],
    ["summary", () => db.createStringAttribute(DB_ID, "conversations", "summary", 5000, false)],
  ] as [string, () => Promise<unknown>][]) {
    await tryCreate(`  attr conversations.${key}`, fn);
  }
  await tryCreate("index: conversations.userId", () =>
    db.createIndex(DB_ID, "conversations", "idx_userId", IndexType.Key, ["userId"])
  );

  // ── messages ───────────────────────────────────────────────────────────────
  await tryCreate("collection: messages", () =>
    db.createCollection(DB_ID, "messages", "messages")
  );
  for (const [key, fn] of [
    ["conversationId", () => db.createStringAttribute(DB_ID, "messages", "conversationId", 36,    true)],
    ["role",           () => db.createStringAttribute(DB_ID, "messages", "role",           32,    true)],
    ["content",        () => db.createStringAttribute(DB_ID, "messages", "content",        100000,true)],
    ["tokensUsed",     () => db.createIntegerAttribute(DB_ID,"messages", "tokensUsed",     false)],
    ["memoryIds",      () => db.createStringAttribute(DB_ID, "messages", "memoryIds",      36,    false, undefined, true)],
  ] as [string, () => Promise<unknown>][]) {
    await tryCreate(`  attr messages.${key}`, fn);
  }
  await tryCreate("index: messages.conversationId", () =>
    db.createIndex(DB_ID, "messages", "idx_conversationId", IndexType.Key, ["conversationId"])
  );

  // ── agents ─────────────────────────────────────────────────────────────────
  await tryCreate("collection: agents", () =>
    db.createCollection(DB_ID, "agents", "agents")
  );
  for (const [key, fn] of [
    ["userId",       () => db.createStringAttribute(DB_ID, "agents", "userId",       36,    true)],
    ["name",         () => db.createStringAttribute(DB_ID, "agents", "name",         256,   true)],
    ["description",  () => db.createStringAttribute(DB_ID, "agents", "description",  2000,  false)],
    ["systemPrompt", () => db.createStringAttribute(DB_ID, "agents", "systemPrompt", 10000, true)],
    ["avatarUrl",    () => db.createStringAttribute(DB_ID, "agents", "avatarUrl",    2048,  false)],
    ["status",       () => db.createEnumAttribute(DB_ID,   "agents", "status",       ["ACTIVE","PAUSED","ARCHIVED"], true, "ACTIVE")],
    ["memoryScope",  () => db.createStringAttribute(DB_ID, "agents", "memoryScope",  64,    true, "user")],
    ["modelId",      () => db.createStringAttribute(DB_ID, "agents", "modelId",      64,    true, "claude-haiku-4-5-20251001")],
    ["temperature",  () => db.createFloatAttribute(DB_ID,  "agents", "temperature",  false, 0, 2, 0.7)],
    ["maxTokens",    () => db.createIntegerAttribute(DB_ID,"agents", "maxTokens",    false, 100, 4000, 2000)],
  ] as [string, () => Promise<unknown>][]) {
    await tryCreate(`  attr agents.${key}`, fn);
  }
  await tryCreate("index: agents.userId", () =>
    db.createIndex(DB_ID, "agents", "idx_userId", IndexType.Key, ["userId"])
  );

  // ── reputations ────────────────────────────────────────────────────────────
  await tryCreate("collection: reputations", () =>
    db.createCollection(DB_ID, "reputations", "reputations")
  );
  for (const [key, fn] of [
    ["userId",      () => db.createStringAttribute(DB_ID,  "reputations", "userId",      36,  true)],
    ["score",       () => db.createFloatAttribute(DB_ID,   "reputations", "score",        false, 0)],
    ["memoryCount", () => db.createIntegerAttribute(DB_ID, "reputations", "memoryCount",  false, 0)],
    ["shareCount",  () => db.createIntegerAttribute(DB_ID, "reputations", "shareCount",   false, 0)],
    ["agentCount",  () => db.createIntegerAttribute(DB_ID, "reputations", "agentCount",   false, 0)],
    ["chatCount",   () => db.createIntegerAttribute(DB_ID, "reputations", "chatCount",    false, 0)],
    ["level",       () => db.createStringAttribute(DB_ID,  "reputations", "level",        64,  true, "novice")],
  ] as [string, () => Promise<unknown>][]) {
    await tryCreate(`  attr reputations.${key}`, fn);
  }
  await tryCreate("index: reputations.userId", () =>
    db.createIndex(DB_ID, "reputations", "idx_userId", IndexType.Unique, ["userId"])
  );

  // ── wallets ────────────────────────────────────────────────────────────────
  await tryCreate("collection: wallets", () =>
    db.createCollection(DB_ID, "wallets", "wallets")
  );
  for (const [key, fn] of [
    ["userId",      () => db.createStringAttribute(DB_ID, "wallets", "userId",      36,   true)],
    ["address",     () => db.createStringAttribute(DB_ID, "wallets", "address",     64,   true)],
    ["chainId",     () => db.createIntegerAttribute(DB_ID,"wallets", "chainId",     true, 8453)],
    ["ensName",     () => db.createStringAttribute(DB_ID, "wallets", "ensName",     256,  false)],
    ["badgeMinted", () => db.createBooleanAttribute(DB_ID,"wallets", "badgeMinted", true, false)],
    ["badgeTokenId",() => db.createStringAttribute(DB_ID, "wallets", "badgeTokenId",64,   false)],
    ["verifiedAt",  () => db.createStringAttribute(DB_ID, "wallets", "verifiedAt",  64,   false)],
  ] as [string, () => Promise<unknown>][]) {
    await tryCreate(`  attr wallets.${key}`, fn);
  }
  await tryCreate("index: wallets.userId", () =>
    db.createIndex(DB_ID, "wallets", "idx_userId", IndexType.Unique, ["userId"])
  );
  await tryCreate("index: wallets.address", () =>
    db.createIndex(DB_ID, "wallets", "idx_address", IndexType.Unique, ["address"])
  );

  // ── shared_contexts ────────────────────────────────────────────────────────
  await tryCreate("collection: shared_contexts", () =>
    db.createCollection(DB_ID, "shared_contexts", "shared_contexts")
  );
  for (const [key, fn] of [
    ["ownerId",     () => db.createStringAttribute(DB_ID, "shared_contexts", "ownerId",     36,   true)],
    ["receiverId",  () => db.createStringAttribute(DB_ID, "shared_contexts", "receiverId",  36,   false)],
    ["name",        () => db.createStringAttribute(DB_ID, "shared_contexts", "name",        256,  true)],
    ["description", () => db.createStringAttribute(DB_ID, "shared_contexts", "description", 2000, false)],
    ["memoryIds",   () => db.createStringAttribute(DB_ID, "shared_contexts", "memoryIds",   36,   false, undefined, true)],
    ["isPublic",    () => db.createBooleanAttribute(DB_ID,"shared_contexts", "isPublic",    true, false)],
    ["shareToken",  () => db.createStringAttribute(DB_ID, "shared_contexts", "shareToken",  64,   true)],
    ["expiresAt",   () => db.createStringAttribute(DB_ID, "shared_contexts", "expiresAt",   64,   false)],
  ] as [string, () => Promise<unknown>][]) {
    await tryCreate(`  attr shared_contexts.${key}`, fn);
  }
  await tryCreate("index: shared_contexts.ownerId", () =>
    db.createIndex(DB_ID, "shared_contexts", "idx_ownerId", IndexType.Key, ["ownerId"])
  );
  await tryCreate("index: shared_contexts.shareToken", () =>
    db.createIndex(DB_ID, "shared_contexts", "idx_shareToken", IndexType.Unique, ["shareToken"])
  );

  // ── api_keys ───────────────────────────────────────────────────────────────
  await tryCreate("collection: api_keys", () =>
    db.createCollection(DB_ID, "api_keys", "api_keys")
  );
  for (const [key, fn] of [
    ["userId",    () => db.createStringAttribute(DB_ID, "api_keys", "userId",    36,   true)],
    ["name",      () => db.createStringAttribute(DB_ID, "api_keys", "name",      256,  true)],
    ["keyHash",   () => db.createStringAttribute(DB_ID, "api_keys", "keyHash",   256,  true)],
    ["keyPrefix", () => db.createStringAttribute(DB_ID, "api_keys", "keyPrefix", 32,   true)],
    ["scope",     () => db.createEnumAttribute(DB_ID,   "api_keys", "scope",     ["FULL","MEMORY_READ","MEMORY_WRITE","CHAT"], true, "FULL")],
    ["lastUsedAt",() => db.createStringAttribute(DB_ID, "api_keys", "lastUsedAt",64,   false)],
    ["expiresAt", () => db.createStringAttribute(DB_ID, "api_keys", "expiresAt", 64,   false)],
    ["isRevoked", () => db.createBooleanAttribute(DB_ID,"api_keys", "isRevoked", true, false)],
  ] as [string, () => Promise<unknown>][]) {
    await tryCreate(`  attr api_keys.${key}`, fn);
  }
  await tryCreate("index: api_keys.userId", () =>
    db.createIndex(DB_ID, "api_keys", "idx_userId", IndexType.Key, ["userId"])
  );
  await tryCreate("index: api_keys.keyHash", () =>
    db.createIndex(DB_ID, "api_keys", "idx_keyHash", IndexType.Unique, ["keyHash"])
  );

  console.log("\n✅ All collections and attributes created.\n");
  console.log("Next: add APPWRITE_DATABASE_ID to your .env and run npm run dev\n");
}

setupCollections().catch((e) => { console.error(e); process.exit(1); });
