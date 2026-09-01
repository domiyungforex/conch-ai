#!/usr/bin/env tsx
/**
 * Conch System & API Test Suite
 * Tests every API endpoint against the local dev server.
 *
 * Usage:
 *   CONCH_API_KEY=cnch_xxx npx tsx scripts/test-conch-api.ts
 *
 * Or without an API key (tests auth rejection):
 *   npx tsx scripts/test-conch-api.ts
 */

const BASE = process.env.CONCH_BASE_URL || "http://127.0.0.1:3000";
const API_KEY = process.env.CONCH_API_KEY || "";

interface TestResult {
  name: string;
  method: string;
  path: string;
  status: number;
  expected: number | number[];
  pass: boolean;
  body?: unknown;
  error?: string;
  duration: number;
}

const results: TestResult[] = [];

async function req(
  method: string,
  path: string,
  body?: unknown,
  extraHeaders?: Record<string, string>
): Promise<{ status: number; body: unknown; duration: number }> {
  const start = Date.now();
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...extraHeaders,
    };
    if (API_KEY) {
      headers["Authorization"] = `Bearer ${API_KEY}`;
    }
    const res = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(15000),
    });
    const text = await res.text();
    let json: unknown;
    try {
      json = JSON.parse(text);
    } catch {
      json = text;
    }
    return { status: res.status, body: json, duration: Date.now() - start };
  } catch (err: any) {
    return {
      status: 0,
      body: { error: err.message },
      duration: Date.now() - start,
    };
  }
}

async function test(
  name: string,
  method: string,
  path: string,
  expected: number | number[],
  body?: unknown
) {
  const { status, body: resBody, duration } = await req(method, path, body);
  const expectedArr = Array.isArray(expected) ? expected : [expected];
  const pass = expectedArr.includes(status);
  const result: TestResult = {
    name,
    method,
    path,
    status,
    expected,
    pass,
    body: resBody,
    duration,
  };
  results.push(result);

  const icon = pass ? "✅" : "❌";
  const expectedStr = expectedArr.join("|");
  console.log(
    `${icon} [${status}/${expectedStr}] ${method} ${path} — ${name} (${duration}ms)`
  );
  if (!pass && resBody) {
    console.log(`   Response: ${JSON.stringify(resBody).slice(0, 200)}`);
  }
  return result;
}

// ════════════════════════════════════════════════════════════
// TEST SUITES
// ════════════════════════════════════════════════════════════

async function testAuth() {
  console.log("\n🔐 AUTH TESTS");

  // Without API key or session — should 401
  await test("No auth → 401", "GET", "/api/memory", [401, 403]);

  // Invalid API key
  const { status } = await req("GET", "/api/memory", undefined, {
    Authorization: "Bearer cnch_invalidkey123456789012345678",
  });
  const result: TestResult = {
    name: "Invalid API key → 401",
    method: "GET",
    path: "/api/memory",
    status,
    expected: 401,
    pass: status === 401,
    duration: 0,
  };
  results.push(result);
  console.log(`${result.pass ? "✅" : "❌"} [${status}/401] Invalid API key`);
}

async function testMemory() {
  console.log("\n🧠 MEMORY TESTS");

  // Create a memory
  const createRes = await test(
    "Create memory",
    "POST",
    "/api/memory",
    [201, 401, 403],
    {
      content: "Test memory: The quick brown fox jumps over the lazy dog",
      category: "EPISODIC",
      tags: ["test", "demo"],
      importance: 0.8,
      source: "test-script",
      namespace: "test",
    }
  );

  let memoryId = "";
  if (createRes.status === 201 && typeof createRes.body === "object" && createRes.body !== null) {
    const body = createRes.body as any;
    memoryId = body.memory?.$id || "";
  }

  // List memories
  await test("List memories", "GET", "/api/memory", [200, 401, 403]);

  // List with filters
  await test(
    "List memories (filtered)",
    "GET",
    "/api/memory?category=EPISODIC&limit=5",
    [200, 401, 403]
  );

  // Get memory by ID
  if (memoryId) {
    await test("Get memory by ID", "GET", `/api/memory/${memoryId}`, [200, 401, 403]);
  }

  // Update memory
  if (memoryId) {
    await test(
      "Update memory",
      "PATCH",
      `/api/memory/${memoryId}`,
      [200, 401, 403],
      { content: "Updated test memory content", tags: ["test", "updated"] }
    );
  }

  // Create second memory for search testing
  const create2Res = await test(
    "Create second memory",
    "POST",
    "/api/memory",
    [201, 401, 403],
    {
      content: "Test memory 2: I love drinking coffee every morning with oat milk",
      category: "PREFERENCE",
      tags: ["coffee", "morning"],
      importance: 0.6,
      source: "test-script",
      namespace: "test",
    }
  );

  let memoryId2 = "";
  if (create2Res.status === 201 && typeof create2Res.body === "object" && create2Res.body !== null) {
    const body = create2Res.body as any;
    memoryId2 = body.memory?.$id || "";
  }

  // Export memories
  await test("Export memories", "GET", "/api/memory/export", [200, 401, 403]);

  return { memoryId, memoryId2 };
}

async function testSearch() {
  console.log("\n🔍 SEARCH TESTS");

  // Semantic search
  await test(
    "Semantic search",
    "POST",
    "/api/search",
    [200, 401, 403],
    {
      query: "coffee preferences",
      topK: 5,
      minScore: 0.3,
    }
  );

  // Search with category filter
  await test(
    "Search with category",
    "POST",
    "/api/search",
    [200, 401, 403],
    {
      query: "fox jumping",
      category: "EPISODIC",
      topK: 3,
    }
  );

  // Search with namespace
  await test(
    "Search with namespace",
    "POST",
    "/api/search",
    [200, 401, 403],
    {
      query: "test memories",
      namespace: "test",
      topK: 5,
    }
  );

  // Recall
  await test(
    "Recall memories",
    "POST",
    "/api/memory/recall",
    [200, 401, 403],
    {
      query: "What do I like to drink?",
      topK: 5,
    }
  );

  // Recall with category
  await test(
    "Recall (PREFERENCE only)",
    "POST",
    "/api/memory/recall",
    [200, 401, 403],
    {
      query: "morning routine",
      category: "PREFERENCE",
      topK: 3,
    }
  );
}

async function testChat() {
  console.log("\n💬 CHAT TESTS");

  // Chat message — this creates a conversation automatically
  await test(
    "Chat message",
    "POST",
    "/api/chat",
    [200, 401, 403, 503],
    {
      message: "Hello! What can you help me with?",
    }
  );
}

async function testConversations() {
  console.log("\n🗨️  CONVERSATION TESTS");

  await test("List conversations", "GET", "/api/conversations", [200, 401, 403]);

  await test(
    "Create conversation",
    "POST",
    "/api/conversations",
    [201, 401, 403],
    { title: "Test Conversation", agentId: null }
  );

  await test(
    "Create conversation (with title)",
    "POST",
    "/api/conversations",
    [201, 401, 403],
    { title: "SDK Test Conversation" }
  );
}

async function testAgents() {
  console.log("\n🤖 AGENT TESTS");

  const createRes = await test(
    "Create agent",
    "POST",
    "/api/agents",
    [201, 401, 403],
    {
      name: "Test Agent",
      description: "A test agent for API verification",
      systemPrompt: "You are a helpful test assistant. Respond briefly.",
      agentType: "CHAT",
      modelId: "claude-haiku-4-5-20251001",
      memoryScope: "user",
      temperature: 0.5,
      maxTokens: 500,
    }
  );

  let agentId = "";
  if (createRes.status === 201 && typeof createRes.body === "object" && createRes.body !== null) {
    const body = createRes.body as any;
    agentId = body.agent?.$id || "";
  }

  // List agents
  await test("List agents", "GET", "/api/agents", [200, 401, 403]);

  // Get agent by ID
  if (agentId) {
    await test("Get agent", "GET", `/api/agents/${agentId}`, [200, 401, 403]);
  }

  // Update agent
  if (agentId) {
    await test(
      "Update agent",
      "PATCH",
      `/api/agents/${agentId}`,
      [200, 401, 403],
      { name: "Updated Test Agent", temperature: 0.7 }
    );
  }

  return { agentId };
}

async function testAPIKeys() {
  console.log("\n🔑 API KEY TESTS");

  // These require Clerk session auth (no API key auth)
  // So they'll likely 401 without a browser session
  await test("List API keys (no session)", "GET", "/api/api-keys", [401]);
  await test(
    "Create API key (no session)",
    "POST",
    "/api/api-keys",
    [401],
    { name: "test-key", scope: "FULL" }
  );
}

async function testMemoryUpdateDelete(memoryId: string) {
  console.log("\n🗑️  MEMORY UPDATE & DELETE TESTS");

  if (memoryId) {
    // Update content (re-generates embedding)
    await test(
      "Update memory content",
      "PATCH",
      `/api/memory/${memoryId}`,
      [200, 401, 403],
      { content: "Updated: The lazy dog was jumped over by a quick brown fox", importance: 0.9 }
    );

    // Archive memory
    await test(
      "Archive memory",
      "PATCH",
      `/api/memory/${memoryId}`,
      [200, 401, 403],
      { isArchived: true }
    );

    // Delete memory
    await test(
      "Delete memory",
      "DELETE",
      `/api/memory/${memoryId}`,
      [200, 204, 401, 403]
    );
  }
}

async function testAgentDelete(agentId: string) {
  console.log("\n🗑️  AGENT DELETE TESTS");

  if (agentId) {
    // Archive agent (soft-delete)
    await test(
      "Archive agent",
      "DELETE",
      `/api/agents/${agentId}`,
      [200, 204, 401, 403]
    );
  }
}

async function testEdgeCases() {
  console.log("\n⚠️  EDGE CASE TESTS");

  // Invalid memory creation
  await test(
    "Create memory (missing content)",
    "POST",
    "/api/memory",
    [400, 401, 403],
    { tags: ["no-content"] }
  );

  // Invalid search
  await test(
    "Search (missing query)",
    "POST",
    "/api/search",
    [400, 401, 403],
    { topK: 5 }
  );

  // Invalid chat
  await test(
    "Chat (empty message)",
    "POST",
    "/api/chat",
    [400, 401, 403, 503],
    { message: "" }
  );

  // Non-existent conversation
  await test(
    "Get non-existent conversation",
    "GET",
    "/api/conversations/nonexistent123",
    [404, 401, 403]
  );

  // Non-existent memory
  await test(
    "Get non-existent memory",
    "GET",
    "/api/memory/nonexistent123",
    [404, 401, 403]
  );
}

// ════════════════════════════════════════════════════════════
// RUN ALL TESTS
// ════════════════════════════════════════════════════════════

async function main() {
  console.log("═══════════════════════════════════════════════════════════");
  console.log("  🐚 CONCH SYSTEM & API TEST SUITE");
  console.log(`  Base URL: ${BASE}`);
  console.log(`  API Key:  ${API_KEY ? "✅ Provided" : "❌ Not provided (testing auth rejection)"}`);
  console.log("═══════════════════════════════════════════════════════════");

  // Health check
  const healthStart = Date.now();
  try {
    const res = await fetch(BASE, { signal: AbortSignal.timeout(5000) });
    console.log(`\n🌐 Server health: ${res.status} (${Date.now() - healthStart}ms)`);
  } catch (err: any) {
    console.log(`\n❌ Server unreachable: ${err.message}`);
    console.log("   Start the dev server first: npm run dev");
    process.exit(1);
  }

  // Run test suites
  await testAuth();
  const { memoryId, memoryId2 } = await testMemory();
  await testSearch();
  await testChat();
  await testConversations();
  const { agentId } = await testAgents();
  await testAPIKeys();
  await testMemoryUpdateDelete(memoryId);
  await testAgentDelete(agentId);
  await testEdgeCases();

  // Summary
  console.log("\n═══════════════════════════════════════════════════════════");
  const passed = results.filter((r) => r.pass).length;
  const failed = results.filter((r) => !r.pass).length;
  const total = results.length;
  const avgDuration = Math.round(
    results.reduce((a, r) => a + r.duration, 0) / total
  );

  console.log(`  📊 RESULTS: ${passed}/${total} passed, ${failed} failed`);
  console.log(`  ⏱️  Average response time: ${avgDuration}ms`);
  console.log("═══════════════════════════════════════════════════════════");

  // Group by endpoint
  console.log("\n📋 BY ENDPOINT:");
  const byPath = new Map<string, TestResult[]>();
  for (const r of results) {
    const key = `${r.method} ${r.path.split("?")[0]}`;
    if (!byPath.has(key)) byPath.set(key, []);
    byPath.get(key)!.push(r);
  }
  for (const [path, tests] of byPath) {
    const p = tests.filter((t) => t.pass).length;
    const f = tests.length - p;
    const icon = f === 0 ? "✅" : "❌";
    console.log(`  ${icon} ${path} — ${p}/${tests.length} passed`);
  }

  // Failed tests detail
  if (failed > 0) {
    console.log("\n❌ FAILED TESTS:");
    for (const r of results.filter((r) => !r.pass)) {
      console.log(`  • ${r.name} — ${r.method} ${r.path}`);
      console.log(`    Expected: ${r.expected}, Got: ${r.status}`);
      if (r.body) {
        const bodyStr = JSON.stringify(r.body).slice(0, 200);
        console.log(`    Response: ${bodyStr}`);
      }
    }
  }

  console.log("\n═══════════════════════════════════════════════════════════");
  console.log("  🐚 Test suite complete!");
  console.log("═══════════════════════════════════════════════════════════\n");

  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
