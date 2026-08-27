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
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

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

async function tryDeleteCollection(label: string, collectionId: string) {
  try {
    await db.deleteCollection(DB_ID, collectionId);
    console.log(`  ✗ ${label} (deleted for re-creation)`);
  } catch {
    // Collection may not exist — that's fine
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

  // ── Conch 2.0: Context Engine collections ─────────────────────────────────
  console.log("\n=== Creating Conch 2.0 context engine collections ===\n");

  // Delete incomplete collections so they can be recreated with all attributes.
  for (const col of ["context_objects", "decisions", "constraints", "agent_handoffs", "context_permissions"]) {
    await tryDeleteCollection(col, col);
  }

  // ── projects ──────────────────────────────────────────────────────────────
  await tryCreate("collection: projects", () =>
    db.createCollection(DB_ID, "projects", "projects")
  );
  for (const [key, fn] of [
    ["userId",      () => db.createStringAttribute(DB_ID, "projects", "userId",      36,   true)],
    ["name",        () => db.createStringAttribute(DB_ID, "projects", "name",        256,  true)],
    ["description", () => db.createStringAttribute(DB_ID, "projects", "description", 2000, false)],
    ["status",      () => db.createEnumAttribute(DB_ID,   "projects", "status",      ["active","paused","completed","archived"], true)],
    ["tags",        () => db.createStringAttribute(DB_ID, "projects", "tags",        256,  false, undefined, true)],
    ["agentIds",    () => db.createStringAttribute(DB_ID, "projects", "agentIds",    36,   false, undefined, true)],
    ["memoryIds",   () => db.createStringAttribute(DB_ID, "projects", "memoryIds",   36,   false, undefined, true)],
  ] as [string, () => Promise<unknown>][]) {
    await tryCreate(`  attr projects.${key}`, fn);
  }
  await tryCreate("index: projects.userId", () =>
    db.createIndex(DB_ID, "projects", "idx_userId", IndexType.Key, ["userId"])
  );

  // ── context_objects ────────────────────────────────────────────────────────
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
    ["version",        () => db.createIntegerAttribute(DB_ID,"context_objects", "version",        false, 1)],
    ["embedding",      () => db.createFloatAttribute(DB_ID,  "context_objects", "embedding",      false, undefined, undefined, undefined, true)],
  ] as [string, () => Promise<unknown>][]) {
    await tryCreate(`  attr context_objects.${key}`, fn);
  }
  await tryCreate("index: context_objects.userId", () =>
    db.createIndex(DB_ID, "context_objects", "idx_userId", IndexType.Key, ["userId"])
  );
  await tryCreate("index: context_objects.projectId", () =>
    db.createIndex(DB_ID, "context_objects", "idx_projectId", IndexType.Key, ["projectId"])
  );

  // ── decisions ──────────────────────────────────────────────────────────────
  await tryCreate("collection: decisions", () =>
    db.createCollection(DB_ID, "decisions", "decisions")
  );
  for (const [key, fn] of [
    ["userId",             () => db.createStringAttribute(DB_ID, "decisions", "userId",             36,    true)],
    ["projectId",          () => db.createStringAttribute(DB_ID, "decisions", "projectId",          36,    false)],
    ["what",               () => db.createStringAttribute(DB_ID, "decisions", "what",               2000,  true)],
    ["why",                () => db.createStringAttribute(DB_ID, "decisions", "why",                2000,  true)],
    ["who",                () => db.createStringAttribute(DB_ID, "decisions", "who",                200,   true, "user")],
    ["alternatives",       () => db.createStringAttribute(DB_ID, "decisions", "alternatives",       2000,  false)],
    ["constraints",        () => db.createStringAttribute(DB_ID, "decisions", "constraints",        2000,  false)],
    ["assumptions",        () => db.createStringAttribute(DB_ID, "decisions", "assumptions",        2000,  false)],
    ["fallbackCondition",  () => db.createStringAttribute(DB_ID, "decisions", "fallbackCondition",  1000,  false)],
    ["status",             () => db.createEnumAttribute(DB_ID,   "decisions", "status",             ["active","superseded","archived"], true)],
    ["supersededBy",       () => db.createStringAttribute(DB_ID, "decisions", "supersededBy",       36,    false)],
    ["agentId",            () => db.createStringAttribute(DB_ID, "decisions", "agentId",            36,    false)],
    ["confidence",         () => db.createFloatAttribute(DB_ID,  "decisions", "confidence",         false, 0, 1, 0.5)],
    ["tags",               () => db.createStringAttribute(DB_ID, "decisions", "tags",               256,   false, undefined, true)],
  ] as [string, () => Promise<unknown>][]) {
    await tryCreate(`  attr decisions.${key}`, fn);
  }
  await tryCreate("index: decisions.userId", () =>
    db.createIndex(DB_ID, "decisions", "idx_userId", IndexType.Key, ["userId"])
  );

  // ── constraints ────────────────────────────────────────────────────────────
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

  // ── agent_state ────────────────────────────────────────────────────────────
  await tryCreate("collection: agent_state", () =>
    db.createCollection(DB_ID, "agent_state", "agent_state")
  );
  for (const [key, fn] of [
    ["agentId",          () => db.createStringAttribute(DB_ID, "agent_state", "agentId",          36,   true)],
    ["userId",           () => db.createStringAttribute(DB_ID, "agent_state", "userId",           36,   true)],
    ["projectId",        () => db.createStringAttribute(DB_ID, "agent_state", "projectId",        36,   false)],
    ["currentState",     () => db.createStringAttribute(DB_ID, "agent_state", "currentState",     2000, true)],
    ["currentTask",      () => db.createStringAttribute(DB_ID, "agent_state", "currentTask",      2000, false)],
    ["lastActiveAt",     () => db.createStringAttribute(DB_ID, "agent_state", "lastActiveAt",     64,   true)],
    ["contextVersion",   () => db.createIntegerAttribute(DB_ID,"agent_state", "contextVersion",   false, 1)],
    ["memorySnapshot",   () => db.createStringAttribute(DB_ID, "agent_state", "memorySnapshot",   36,   false, undefined, true)],
  ] as [string, () => Promise<unknown>][]) {
    await tryCreate(`  attr agent_state.${key}`, fn);
  }
  await tryCreate("index: agent_state.agentId", () =>
    db.createIndex(DB_ID, "agent_state", "idx_agentId", IndexType.Unique, ["agentId"])
  );

  // ── agent_handoffs ─────────────────────────────────────────────────────────
  await tryCreate("collection: agent_handoffs", () =>
    db.createCollection(DB_ID, "agent_handoffs", "agent_handoffs")
  );
  for (const [key, fn] of [
    ["fromAgentId",       () => db.createStringAttribute(DB_ID, "agent_handoffs", "fromAgentId",       36,    true)],
    ["toAgentId",         () => db.createStringAttribute(DB_ID, "agent_handoffs", "toAgentId",         36,    true)],
    ["userId",            () => db.createStringAttribute(DB_ID, "agent_handoffs", "userId",            36,    true)],
    ["projectId",         () => db.createStringAttribute(DB_ID, "agent_handoffs", "projectId",         36,    false)],
    ["objective",         () => db.createStringAttribute(DB_ID, "agent_handoffs", "objective",         2000,  true)],
    ["workCompleted",     () => db.createStringAttribute(DB_ID, "agent_handoffs", "workCompleted",     5000,  true)],
    ["findings",          () => db.createStringAttribute(DB_ID, "agent_handoffs", "findings",          5000,  false)],
    ["decisions",         () => db.createStringAttribute(DB_ID, "agent_handoffs", "decisions",         5000,  false)],
    ["reasoning",         () => db.createStringAttribute(DB_ID, "agent_handoffs", "reasoning",         5000,  false)],
    ["constraints",       () => db.createStringAttribute(DB_ID, "agent_handoffs", "constraints",       5000,  false)],
    ["unresolvedIssues",  () => db.createStringAttribute(DB_ID, "agent_handoffs", "unresolvedIssues",  5000,  false)],
    ["assumptions",       () => db.createStringAttribute(DB_ID, "agent_handoffs", "assumptions",       5000,  false)],
    ["requiredAction",    () => db.createStringAttribute(DB_ID, "agent_handoffs", "requiredAction",    2000,  true)],
    ["relevantMemoryIds", () => db.createStringAttribute(DB_ID, "agent_handoffs", "relevantMemoryIds", 36,    false, undefined, true)],
    ["sources",           () => db.createStringAttribute(DB_ID, "agent_handoffs", "sources",           2000,  false)],
    ["confidence",        () => db.createFloatAttribute(DB_ID,  "agent_handoffs", "confidence",        false, 0, 1, 0.5)],
    ["status",            () => db.createEnumAttribute(DB_ID,   "agent_handoffs", "status",            ["pending","accepted","rejected","completed"], true)],
    ["contextVersion",    () => db.createIntegerAttribute(DB_ID,"agent_handoffs", "contextVersion",    false, 1)],
  ] as [string, () => Promise<unknown>][]) {
    await tryCreate(`  attr agent_handoffs.${key}`, fn);
  }
  await tryCreate("index: agent_handoffs.userId", () =>
    db.createIndex(DB_ID, "agent_handoffs", "idx_userId", IndexType.Key, ["userId"])
  );
  await tryCreate("index: agent_handoffs.toAgentId", () =>
    db.createIndex(DB_ID, "agent_handoffs", "idx_toAgentId", IndexType.Key, ["toAgentId"])
  );

  // ── context_permissions ─────────────────────────────────────────────────────
  await tryCreate("collection: context_permissions", () =>
    db.createCollection(DB_ID, "context_permissions", "context_permissions")
  );
  for (const [key, fn] of [
    ["userId",       () => db.createStringAttribute(DB_ID, "context_permissions", "userId",       36,   true)],
    ["contextId",    () => db.createStringAttribute(DB_ID, "context_permissions", "contextId",    36,   true)],
    ["contextType",  () => db.createStringAttribute(DB_ID, "context_permissions", "contextType",  64,   true)],
    ["granteeType",  () => db.createEnumAttribute(DB_ID,   "context_permissions", "granteeType",  ["agent","user","application"], true)],
    ["granteeId",    () => db.createStringAttribute(DB_ID, "context_permissions", "granteeId",    36,   true)],
    ["level",        () => db.createEnumAttribute(DB_ID,   "context_permissions", "level",        ["PRIVATE","USER_ONLY","PROJECT","TEAM","AGENT","APPLICATION","PUBLIC"], true)],
    ["expiresAt",    () => db.createStringAttribute(DB_ID, "context_permissions", "expiresAt",    64,   false)],
  ] as [string, () => Promise<unknown>][]) {
    await tryCreate(`  attr context_permissions.${key}`, fn);
  }
  await tryCreate("index: context_permissions.contextId", () =>
    db.createIndex(DB_ID, "context_permissions", "idx_contextId", IndexType.Key, ["contextId"])
  );

  // ── context_provenance ─────────────────────────────────────────────────────
  await tryCreate("collection: context_provenance", () =>
    db.createCollection(DB_ID, "context_provenance", "context_provenance")
  );
  for (const [key, fn] of [
    ["contextId",     () => db.createStringAttribute(DB_ID, "context_provenance", "contextId",     36,   true)],
    ["contextType",   () => db.createStringAttribute(DB_ID, "context_provenance", "contextType",   64,   true)],
    ["source",        () => db.createEnumAttribute(DB_ID,   "context_provenance", "source",        ["user","conversation","document","agent","external_api","database","developer","system","verified_source"], true)],
    ["sourceDetail",  () => db.createStringAttribute(DB_ID, "context_provenance", "sourceDetail",  500,  false)],
    ["agentId",       () => db.createStringAttribute(DB_ID, "context_provenance", "agentId",       36,   false)],
    ["verifiedAt",    () => db.createStringAttribute(DB_ID, "context_provenance", "verifiedAt",    64,   false)],
    ["confidence",    () => db.createFloatAttribute(DB_ID,  "context_provenance", "confidence",    false, 0, 1, 0.5)],
  ] as [string, () => Promise<unknown>][]) {
    await tryCreate(`  attr context_provenance.${key}`, fn);
  }
  await tryCreate("index: context_provenance.contextId", () =>
    db.createIndex(DB_ID, "context_provenance", "idx_contextId", IndexType.Key, ["contextId"])
  );

  // ── push_subscriptions ─────────────────────────────────────────────────────
  await tryCreate("collection: push_subscriptions", () =>
    db.createCollection(DB_ID, "push_subscriptions", "push_subscriptions")
  );
  for (const [key, fn] of [
    ["userId",    () => db.createStringAttribute(DB_ID, "push_subscriptions", "userId",    36,    true)],
    ["endpoint",  () => db.createStringAttribute(DB_ID, "push_subscriptions", "endpoint",  1024,  true)],
    ["p256dh",    () => db.createStringAttribute(DB_ID, "push_subscriptions", "p256dh",    256,   true)],
    ["auth",      () => db.createStringAttribute(DB_ID, "push_subscriptions", "auth",      256,   true)],
    ["userAgent", () => db.createStringAttribute(DB_ID, "push_subscriptions", "userAgent", 1024,  false)],
  ] as [string, () => Promise<unknown>][]) {
    await tryCreate(`  attr push_subscriptions.${key}`, fn);
  }
  await tryCreate("index: push_subscriptions.userId", () =>
    db.createIndex(DB_ID, "push_subscriptions", "idx_userId", IndexType.Key, ["userId"])
  );

  // ── reminders ──────────────────────────────────────────────────────────────
  await tryCreate("collection: reminders", () =>
    db.createCollection(DB_ID, "reminders", "reminders")
  );
  for (const [key, fn] of [
    ["userId",             () => db.createStringAttribute(DB_ID, "reminders", "userId",             36,    true)],
    ["title",              () => db.createStringAttribute(DB_ID, "reminders", "title",              200,   true)],
    ["message",            () => db.createStringAttribute(DB_ID, "reminders", "message",            1000,  true)],
    ["scheduledAt",        () => db.createStringAttribute(DB_ID, "reminders", "scheduledAt",        64,    true)],
    ["status",             () => db.createStringAttribute(DB_ID, "reminders", "status",             32,    true, "pending")],
    ["source",             () => db.createStringAttribute(DB_ID, "reminders", "source",             100,   false)],
    ["recurrence",         () => db.createStringAttribute(DB_ID, "reminders", "recurrence",         32,    true, "none")],
    ["recurrenceEndDate",  () => db.createStringAttribute(DB_ID, "reminders", "recurrenceEndDate",  64,    false)],
  ] as [string, () => Promise<unknown>][]) {
    await tryCreate(`  attr reminders.${key}`, fn);
  }
  await tryCreate("index: reminders.userId", () =>
    db.createIndex(DB_ID, "reminders", "idx_userId", IndexType.Key, ["userId"])
  );
  await tryCreate("index: reminders.status_scheduledAt", () =>
    db.createIndex(DB_ID, "reminders", "idx_status_scheduledAt", IndexType.Key, ["status", "scheduledAt"])
  );

  console.log("\n✅ All collections and attributes created.\n");
  console.log("Next: add APPWRITE_DATABASE_ID to your .env and run npm run dev\n");
}

setupCollections().catch((e) => { console.error(e); process.exit(1); });
