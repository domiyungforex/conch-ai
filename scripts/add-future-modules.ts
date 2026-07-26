#!/usr/bin/env tsx
/**
 * One-time script to create the full future-module schema: platform
 * infrastructure (feature_flags, waitlist, audit_logs) plus dormant
 * collections for every future module (Business AI, Economic Intelligence,
 * Opportunity Engine, Financial Intelligence, Credit Intelligence,
 * Marketplace). Collections are created now so the architecture is real and
 * testable; the modules themselves stay disabled via feature_flags until
 * activated. Run with: npx tsx scripts/add-future-modules.ts
 */

import { Client, Databases, DatabasesIndexType as IndexType } from "node-appwrite";
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
  console.log("\n=== Building future-module schema (all dormant until enabled via feature_flags) ===\n");

  // ── Platform infrastructure — active now ──────────────────────────────
  await createCollectionWithAttrs(
    "feature_flags",
    "feature_flags",
    [
      ["key", () => db.createStringAttribute(DB_ID, "feature_flags", "key", 64, true)],
      ["status", () => db.createEnumAttribute(DB_ID, "feature_flags", "status", ["enabled", "disabled", "beta"], false, "disabled")],
      ["rolloutPercentage", () => db.createIntegerAttribute(DB_ID, "feature_flags", "rolloutPercentage", false, 0, 100, 0)],
      ["minPlan", () => db.createStringAttribute(DB_ID, "feature_flags", "minPlan", 32, false)],
      ["allowlistUserIds", () => db.createStringAttribute(DB_ID, "feature_flags", "allowlistUserIds", 36, false, undefined, true)],
      ["updatedBy", () => db.createStringAttribute(DB_ID, "feature_flags", "updatedBy", 36, false)],
    ],
    [["key", "idx_key", IndexType.Unique, ["key"]]]
  );

  await createCollectionWithAttrs(
    "waitlist",
    "waitlist",
    [
      ["userId", () => db.createStringAttribute(DB_ID, "waitlist", "userId", 36, false)],
      ["email", () => db.createStringAttribute(DB_ID, "waitlist", "email", 320, true)],
      ["module", () => db.createStringAttribute(DB_ID, "waitlist", "module", 64, true)],
      ["note", () => db.createStringAttribute(DB_ID, "waitlist", "note", 500, false)],
    ],
    [["module", "idx_module", IndexType.Key, ["module"]]]
  );

  await createCollectionWithAttrs(
    "audit_logs",
    "audit_logs",
    [
      ["actorId", () => db.createStringAttribute(DB_ID, "audit_logs", "actorId", 36, true)],
      ["action", () => db.createStringAttribute(DB_ID, "audit_logs", "action", 64, true)],
      ["target", () => db.createStringAttribute(DB_ID, "audit_logs", "target", 128, true)],
      ["metadata", () => db.createStringAttribute(DB_ID, "audit_logs", "metadata", 2000, false)],
    ],
    [["actorId", "idx_actorId", IndexType.Key, ["actorId"]]]
  );

  // ── Business AI (future — dormant) ─────────────────────────────────────
  await createCollectionWithAttrs(
    "businesses",
    "businesses",
    [
      ["userId", () => db.createStringAttribute(DB_ID, "businesses", "userId", 36, true)],
      ["name", () => db.createStringAttribute(DB_ID, "businesses", "name", 200, true)],
      ["industry", () => db.createStringAttribute(DB_ID, "businesses", "industry", 100, false)],
      ["description", () => db.createStringAttribute(DB_ID, "businesses", "description", 2000, false)],
      ["website", () => db.createStringAttribute(DB_ID, "businesses", "website", 500, false)],
      ["currency", () => db.createStringAttribute(DB_ID, "businesses", "currency", 8, false, "USD")],
      ["region", () => db.createStringAttribute(DB_ID, "businesses", "region", 8, false, "global")],
    ],
    [["userId", "idx_userId", IndexType.Key, ["userId"]]]
  );

  await createCollectionWithAttrs(
    "business_customers",
    "business_customers",
    [
      ["businessId", () => db.createStringAttribute(DB_ID, "business_customers", "businessId", 36, true)],
      ["name", () => db.createStringAttribute(DB_ID, "business_customers", "name", 200, true)],
      ["email", () => db.createStringAttribute(DB_ID, "business_customers", "email", 320, false)],
      ["phone", () => db.createStringAttribute(DB_ID, "business_customers", "phone", 32, false)],
      ["notes", () => db.createStringAttribute(DB_ID, "business_customers", "notes", 2000, false)],
      ["totalSpentUsd", () => db.createFloatAttribute(DB_ID, "business_customers", "totalSpentUsd", false, undefined, undefined, 0)],
    ],
    [["businessId", "idx_businessId", IndexType.Key, ["businessId"]]]
  );

  await createCollectionWithAttrs(
    "business_suppliers",
    "business_suppliers",
    [
      ["businessId", () => db.createStringAttribute(DB_ID, "business_suppliers", "businessId", 36, true)],
      ["name", () => db.createStringAttribute(DB_ID, "business_suppliers", "name", 200, true)],
      ["contact", () => db.createStringAttribute(DB_ID, "business_suppliers", "contact", 320, false)],
      ["notes", () => db.createStringAttribute(DB_ID, "business_suppliers", "notes", 2000, false)],
    ],
    [["businessId", "idx_businessId", IndexType.Key, ["businessId"]]]
  );

  await createCollectionWithAttrs(
    "business_products",
    "business_products",
    [
      ["businessId", () => db.createStringAttribute(DB_ID, "business_products", "businessId", 36, true)],
      ["name", () => db.createStringAttribute(DB_ID, "business_products", "name", 200, true)],
      ["sku", () => db.createStringAttribute(DB_ID, "business_products", "sku", 64, false)],
      ["priceUsd", () => db.createFloatAttribute(DB_ID, "business_products", "priceUsd", false, undefined, undefined, 0)],
      ["costUsd", () => db.createFloatAttribute(DB_ID, "business_products", "costUsd", false)],
      ["category", () => db.createStringAttribute(DB_ID, "business_products", "category", 100, false)],
    ],
    [["businessId", "idx_businessId", IndexType.Key, ["businessId"]]]
  );

  await createCollectionWithAttrs(
    "business_orders",
    "business_orders",
    [
      ["businessId", () => db.createStringAttribute(DB_ID, "business_orders", "businessId", 36, true)],
      ["customerId", () => db.createStringAttribute(DB_ID, "business_orders", "customerId", 36, false)],
      ["itemsJson", () => db.createStringAttribute(DB_ID, "business_orders", "itemsJson", 5000, true)],
      ["totalUsd", () => db.createFloatAttribute(DB_ID, "business_orders", "totalUsd", false, undefined, undefined, 0)],
      ["status", () => db.createEnumAttribute(DB_ID, "business_orders", "status", ["pending", "fulfilled", "cancelled"], false, "pending")],
      ["orderedAt", () => db.createStringAttribute(DB_ID, "business_orders", "orderedAt", 64, true)],
    ],
    [["businessId", "idx_businessId", IndexType.Key, ["businessId"]]]
  );

  await createCollectionWithAttrs(
    "business_inventory",
    "business_inventory",
    [
      ["businessId", () => db.createStringAttribute(DB_ID, "business_inventory", "businessId", 36, true)],
      ["productId", () => db.createStringAttribute(DB_ID, "business_inventory", "productId", 36, true)],
      ["quantity", () => db.createIntegerAttribute(DB_ID, "business_inventory", "quantity", false, 0, undefined, 0)],
      ["reorderThreshold", () => db.createIntegerAttribute(DB_ID, "business_inventory", "reorderThreshold", false, 0, undefined, 0)],
      ["location", () => db.createStringAttribute(DB_ID, "business_inventory", "location", 200, false)],
    ],
    [["businessId", "idx_businessId", IndexType.Key, ["businessId"]]]
  );

  await createCollectionWithAttrs(
    "business_expenses",
    "business_expenses",
    [
      ["businessId", () => db.createStringAttribute(DB_ID, "business_expenses", "businessId", 36, true)],
      ["category", () => db.createStringAttribute(DB_ID, "business_expenses", "category", 100, true)],
      ["amountUsd", () => db.createFloatAttribute(DB_ID, "business_expenses", "amountUsd", false, undefined, undefined, 0)],
      ["incurredAt", () => db.createStringAttribute(DB_ID, "business_expenses", "incurredAt", 64, true)],
      ["notes", () => db.createStringAttribute(DB_ID, "business_expenses", "notes", 2000, false)],
    ],
    [["businessId", "idx_businessId", IndexType.Key, ["businessId"]]]
  );

  await createCollectionWithAttrs(
    "business_revenues",
    "business_revenues",
    [
      ["businessId", () => db.createStringAttribute(DB_ID, "business_revenues", "businessId", 36, true)],
      ["source", () => db.createStringAttribute(DB_ID, "business_revenues", "source", 200, true)],
      ["amountUsd", () => db.createFloatAttribute(DB_ID, "business_revenues", "amountUsd", false, undefined, undefined, 0)],
      ["receivedAt", () => db.createStringAttribute(DB_ID, "business_revenues", "receivedAt", 64, true)],
      ["notes", () => db.createStringAttribute(DB_ID, "business_revenues", "notes", 2000, false)],
    ],
    [["businessId", "idx_businessId", IndexType.Key, ["businessId"]]]
  );

  // ── Economic Intelligence + Opportunity Engine (future — dormant) ──────
  await createCollectionWithAttrs(
    "economic_signals",
    "economic_signals",
    [
      ["region", () => db.createStringAttribute(DB_ID, "economic_signals", "region", 8, false, "global")],
      ["category", () => db.createStringAttribute(DB_ID, "economic_signals", "category", 100, true)],
      ["title", () => db.createStringAttribute(DB_ID, "economic_signals", "title", 300, true)],
      ["description", () => db.createStringAttribute(DB_ID, "economic_signals", "description", 4000, true)],
      ["source", () => db.createStringAttribute(DB_ID, "economic_signals", "source", 200, true)],
      ["sourceUrl", () => db.createStringAttribute(DB_ID, "economic_signals", "sourceUrl", 500, false)],
      ["confidence", () => db.createFloatAttribute(DB_ID, "economic_signals", "confidence", false, 0, 1, 0.5)],
      ["methodology", () => db.createStringAttribute(DB_ID, "economic_signals", "methodology", 1000, true)],
      ["observedAt", () => db.createStringAttribute(DB_ID, "economic_signals", "observedAt", 64, true)],
      ["createdBy", () => db.createStringAttribute(DB_ID, "economic_signals", "createdBy", 36, true)],
    ],
    [["region", "idx_region", IndexType.Key, ["region"]]]
  );

  await createCollectionWithAttrs(
    "opportunities",
    "opportunities",
    [
      ["userId", () => db.createStringAttribute(DB_ID, "opportunities", "userId", 36, true)],
      ["businessId", () => db.createStringAttribute(DB_ID, "opportunities", "businessId", 36, false)],
      ["title", () => db.createStringAttribute(DB_ID, "opportunities", "title", 300, true)],
      // Appwrite Cloud rejected this collection's original text-field sizes
      // once title+description+evidenceJson+dataSourcesJson+riskFactorsJson
      // combined got large enough ("maximum number or size of attributes" —
      // a per-collection row-size cap, not an attribute-count cap). Trimmed.
      ["description", () => db.createStringAttribute(DB_ID, "opportunities", "description", 1500, true)],
      ["evidenceJson", () => db.createStringAttribute(DB_ID, "opportunities", "evidenceJson", 1500, true)],
      ["dataSourcesJson", () => db.createStringAttribute(DB_ID, "opportunities", "dataSourcesJson", 2000, true)],
      ["estimatedSizeUsd", () => db.createFloatAttribute(DB_ID, "opportunities", "estimatedSizeUsd", false)],
      ["riskFactorsJson", () => db.createStringAttribute(DB_ID, "opportunities", "riskFactorsJson", 2000, true)],
      ["confidence", () => db.createFloatAttribute(DB_ID, "opportunities", "confidence", false, 0, 1, 0.5)],
      ["status", () => db.createEnumAttribute(DB_ID, "opportunities", "status", ["open", "dismissed", "pursued"], false, "open")],
    ],
    [["userId", "idx_userId", IndexType.Key, ["userId"]]]
  );

  // ── Financial + Credit Intelligence (future — dormant) ─────────────────
  await createCollectionWithAttrs(
    "financial_accounts",
    "financial_accounts",
    [
      ["userId", () => db.createStringAttribute(DB_ID, "financial_accounts", "userId", 36, true)],
      ["businessId", () => db.createStringAttribute(DB_ID, "financial_accounts", "businessId", 36, false)],
      ["provider", () => db.createStringAttribute(DB_ID, "financial_accounts", "provider", 64, true)],
      ["accountType", () => db.createStringAttribute(DB_ID, "financial_accounts", "accountType", 64, true)],
      ["currency", () => db.createStringAttribute(DB_ID, "financial_accounts", "currency", 8, false, "USD")],
      // Never a raw credential — an opaque reference the provider integration
      // resolves server-side, same trust boundary as the wallet address model.
      ["externalRef", () => db.createStringAttribute(DB_ID, "financial_accounts", "externalRef", 256, false)],
      ["lastSyncedAt", () => db.createStringAttribute(DB_ID, "financial_accounts", "lastSyncedAt", 64, false)],
    ],
    [["userId", "idx_userId", IndexType.Key, ["userId"]]]
  );

  await createCollectionWithAttrs(
    "financial_transactions",
    "financial_transactions",
    [
      ["accountId", () => db.createStringAttribute(DB_ID, "financial_transactions", "accountId", 36, true)],
      ["amountUsd", () => db.createFloatAttribute(DB_ID, "financial_transactions", "amountUsd", true)],
      ["category", () => db.createStringAttribute(DB_ID, "financial_transactions", "category", 100, false)],
      ["description", () => db.createStringAttribute(DB_ID, "financial_transactions", "description", 500, false)],
      ["occurredAt", () => db.createStringAttribute(DB_ID, "financial_transactions", "occurredAt", 64, true)],
      ["source", () => db.createStringAttribute(DB_ID, "financial_transactions", "source", 64, true)],
    ],
    [["accountId", "idx_accountId", IndexType.Key, ["accountId"]]]
  );

  await createCollectionWithAttrs(
    "credit_profiles",
    "credit_profiles",
    [
      ["businessId", () => db.createStringAttribute(DB_ID, "credit_profiles", "businessId", 36, true)],
      ["dataPointsJson", () => db.createStringAttribute(DB_ID, "credit_profiles", "dataPointsJson", 4000, true)],
      ["disclaimer", () => db.createStringAttribute(DB_ID, "credit_profiles", "disclaimer", 1000, true)],
      ["consentGiven", () => db.createBooleanAttribute(DB_ID, "credit_profiles", "consentGiven", false, false)],
      ["consentAt", () => db.createStringAttribute(DB_ID, "credit_profiles", "consentAt", 64, false)],
      ["generatedAt", () => db.createStringAttribute(DB_ID, "credit_profiles", "generatedAt", 64, false)],
    ],
    [["businessId", "idx_businessId", IndexType.Unique, ["businessId"]]]
  );

  // ── Marketplace (future — dormant) ──────────────────────────────────────
  await createCollectionWithAttrs(
    "marketplace_listings",
    "marketplace_listings",
    [
      ["ownerId", () => db.createStringAttribute(DB_ID, "marketplace_listings", "ownerId", 36, true)],
      ["businessId", () => db.createStringAttribute(DB_ID, "marketplace_listings", "businessId", 36, false)],
      ["type", () => db.createEnumAttribute(DB_ID, "marketplace_listings", "type", ["business", "product", "service", "opportunity"], true)],
      ["title", () => db.createStringAttribute(DB_ID, "marketplace_listings", "title", 300, true)],
      ["description", () => db.createStringAttribute(DB_ID, "marketplace_listings", "description", 4000, true)],
      ["region", () => db.createStringAttribute(DB_ID, "marketplace_listings", "region", 8, false, "global")],
      ["status", () => db.createEnumAttribute(DB_ID, "marketplace_listings", "status", ["draft", "active", "closed"], false, "draft")],
    ],
    [["region", "idx_region", IndexType.Key, ["region"]]]
  );

  console.log("\n✅ Done. All future-module collections exist; every module stays \"disabled\" in feature_flags until explicitly activated.\n");
}

run().catch((e) => { console.error(e); process.exit(1); });
