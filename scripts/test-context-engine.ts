#!/usr/bin/env npx tsx
/**
 * Test script for Conch 2.0 Context Engine
 *
 * Verifies that context_objects, decisions, and constraints collections
 * are correctly set up and can store/retrieve documents.
 *
 * Usage: npx tsx scripts/test-context-engine.ts
 */

import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const TEST_USER_ID = "test-context-engine-user";
const TEST_PROJECT_ID = "test-project-001";

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

(async () => {
  // Debug: verify env vars are loaded
  console.log("ENV check:");
  console.log("  NEXT_PUBLIC_APPWRITE_ENDPOINT:", process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT ? "✅ set" : "❌ missing");
  console.log("  NEXT_PUBLIC_APPWRITE_PROJECT_ID:", process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID ? "✅ set" : "❌ missing");
  console.log("  APPWRITE_API_KEY:", process.env.APPWRITE_API_KEY ? "✅ set" : "❌ missing");
  console.log("  APPWRITE_DATABASE_ID:", process.env.APPWRITE_DATABASE_ID ? "✅ set" : "❌ missing");

  // Validate endpoint before importing anything that uses it
  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
  if (!endpoint || endpoint.trim() === "") {
    console.error("\n❌ NEXT_PUBLIC_APPWRITE_ENDPOINT is not set. Aborting.");
    process.exit(1);
  }
  try {
    new URL(endpoint);
    console.log(`  Endpoint URL valid: ${endpoint}\n`);
  } catch {
    console.error(`\n❌ NEXT_PUBLIC_APPWRITE_ENDPOINT is not a valid URL: "${endpoint}". Aborting.`);
    process.exit(1);
  }

  // Dynamic imports AFTER dotenv has loaded — appwrite.ts reads env vars at module scope
  const {
    storeContext,
    retrieveContext,
    storeDecision,
    retrieveDecisions,
    storeConstraint,
    retrieveConstraints,
  } = await import("../src/lib/contextEngine");

  const results: TestResult[] = [];

  async function runTest(name: string, fn: () => Promise<void>) {
    try {
      await fn();
      results.push({ name, passed: true });
      console.log(`  ✅ ${name}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      results.push({ name, passed: false, error: message });
      console.log(`  ❌ ${name}: ${message}`);
    }
  }

  // ── Context Objects ──────────────────────────────────────────────────────

  console.log("=== Testing Context Objects ===\n");

  await runTest("Store a context object", async () => {
    const doc = await storeContext({
      userId: TEST_USER_ID,
      type: "memory",
      content: "User prefers dark mode in all applications",
      importance: 0.8,
      confidence: 0.9,
      tags: ["preference", "ui"],
    });
    if (!doc?.$id) throw new Error("No document ID returned");
    console.log(`    Created context: ${doc.$id}`);
  });

  await runTest("Store a goal context", async () => {
    const doc = await storeContext({
      userId: TEST_USER_ID,
      type: "goal",
      content: "Complete the Q4 product launch by December 15th",
      projectId: TEST_PROJECT_ID,
      importance: 0.95,
      tags: ["product", "deadline"],
    });
    if (!doc?.$id) throw new Error("No document ID returned");
  });

  await runTest("Store an instruction context", async () => {
    const doc = await storeContext({
      userId: TEST_USER_ID,
      type: "instruction",
      content: "Always use TypeScript strict mode in new projects",
      importance: 0.85,
      confidence: 1.0,
    });
    if (!doc?.$id) throw new Error("No document ID returned");
  });

  await runTest("Retrieve context by query", async () => {
    const searchResults = await retrieveContext({
      userId: TEST_USER_ID,
      query: "dark mode preference",
      topK: 5,
    });
    if (searchResults.length === 0) throw new Error("No context retrieved");
    console.log(`    Retrieved ${searchResults.length} context object(s)`);
  });

  await runTest("Retrieve context by type filter", async () => {
    const searchResults = await retrieveContext({
      userId: TEST_USER_ID,
      query: "anything",
      types: ["goal"],
      topK: 10,
    });
    if (searchResults.length === 0) throw new Error("No goals retrieved");
    console.log(`    Retrieved ${searchResults.length} goal(s)`);
  });

  await runTest("Retrieve context by project filter", async () => {
    const searchResults = await retrieveContext({
      userId: TEST_USER_ID,
      query: "product launch",
      projectId: TEST_PROJECT_ID,
      topK: 10,
    });
    if (searchResults.length === 0) throw new Error("No project context retrieved");
  });

  // ── Decisions ────────────────────────────────────────────────────────────

  console.log("\n=== Testing Decisions ===\n");

  await runTest("Store a decision", async () => {
    const doc = await storeDecision({
      userId: TEST_USER_ID,
      projectId: TEST_PROJECT_ID,
      what: "Use Appwrite as the primary database",
      why: "Open source, self-hostable, and provides all needed features",
      alternatives: "Supabase, Firebase, MongoDB Atlas",
      constraints: "Must support real-time subscriptions and vector storage",
      confidence: 0.9,
      tags: ["infrastructure", "database"],
    });
    if (!doc?.$id) throw new Error("No decision ID returned");
    console.log(`    Created decision: ${doc.$id}`);
  });

  await runTest("Retrieve active decisions", async () => {
    const decisions = await retrieveDecisions({
      userId: TEST_USER_ID,
      projectId: TEST_PROJECT_ID,
    });
    if (decisions.length === 0) throw new Error("No decisions retrieved");
    console.log(`    Retrieved ${decisions.length} decision(s)`);
  });

  // ── Constraints ──────────────────────────────────────────────────────────

  console.log("\n=== Testing Constraints ===\n");

  await runTest("Store a hard constraint", async () => {
    const doc = await storeConstraint({
      userId: TEST_USER_ID,
      projectId: TEST_PROJECT_ID,
      content: "Must not expose API keys in client-side code",
      category: "security",
      severity: "hard",
      tags: ["security", "api-keys"],
    });
    if (!doc?.$id) throw new Error("No constraint ID returned");
    console.log(`    Created constraint: ${doc.$id}`);
  });

  await runTest("Store a soft constraint", async () => {
    const doc = await storeConstraint({
      userId: TEST_USER_ID,
      projectId: TEST_PROJECT_ID,
      content: "Prefer using React Query for data fetching",
      category: "architecture",
      severity: "soft",
      tags: ["react", "data-fetching"],
    });
    if (!doc?.$id) throw new Error("No constraint ID returned");
  });

  await runTest("Retrieve constraints by severity", async () => {
    const hardConstraints = await retrieveConstraints({
      userId: TEST_USER_ID,
      projectId: TEST_PROJECT_ID,
      severity: "hard",
    });
    if (hardConstraints.length === 0) throw new Error("No hard constraints retrieved");
    console.log(`    Retrieved ${hardConstraints.length} hard constraint(s)`);
  });

  await runTest("Retrieve all constraints", async () => {
    const allConstraints = await retrieveConstraints({
      userId: TEST_USER_ID,
      projectId: TEST_PROJECT_ID,
    });
    if (allConstraints.length < 2) throw new Error("Expected at least 2 constraints");
    console.log(`    Retrieved ${allConstraints.length} total constraint(s)`);
  });

  // ── Summary ────────────────────────────────────────────────────────────

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  console.log("\n═══════════════════════════════════════════════════════════════════════════════");
  console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed, ${results.length} total\n`);

  if (failed > 0) {
    console.log("❌ Failed tests:");
    results
      .filter((r) => !r.passed)
      .forEach((r) => console.log(`   - ${r.name}: ${r.error}`));
    process.exit(1);
  } else {
    console.log("✅ All tests passed! Context engine collections are working correctly.\n");
    process.exit(0);
  }
})().catch((err) => {
  console.error("\n💥 Fatal error:", err);
  process.exit(1);
});
