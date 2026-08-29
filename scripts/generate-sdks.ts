#!/usr/bin/env npx tsx
/**
 * generate-sdks.ts
 * 
 * Reads the API spec from src/lib/apiDocsSpec.ts and generates
 * SDK packages for all supported programming languages.
 * 
 * Usage: npx tsx scripts/generate-sdks.ts
 * 
 * Output: sdks/{language}/
 */

import * as fs from "fs";
import * as path from "path";

// ── Types ────────────────────────────────────────────────────────────────────

type FieldKind = "string" | "number" | "boolean" | "enum" | "tags" | "textarea";

interface FieldSpec {
  name: string;
  kind: FieldKind;
  in: "path" | "query" | "body";
  required?: boolean;
  default?: string | number | boolean;
  enumValues?: string[];
  placeholder?: string;
  description: string;
}

interface EndpointSpec {
  id: string;
  group: string;
  method: "GET" | "POST" | "PATCH" | "DELETE";
  path: string;
  title: string;
  description: string;
  auth: string;
  rateLimit?: string;
  fields: FieldSpec[];
  responseShape: string;
  streaming?: boolean;
}

// ── Import the spec ──────────────────────────────────────────────────────────

// We'll inline the spec data to avoid ESM/CJS issues
const MEMORY_CATEGORY_VALUES = ["EPISODIC", "SEMANTIC", "PREFERENCE", "PROCEDURAL"];

const ENDPOINTS: EndpointSpec[] = [
  {
    id: "memory-list",
    group: "Memory",
    method: "GET",
    path: "/api/memory",
    title: "List memories",
    description: "Page through the caller's stored memories, newest first.",
    auth: "read",
    fields: [
      { name: "category", kind: "enum", in: "query", enumValues: MEMORY_CATEGORY_VALUES, description: "Restrict to one memory category." },
      { name: "namespace", kind: "string", in: "query", description: "Restrict to one namespace." },
      { name: "archived", kind: "boolean", in: "query", default: false, description: "true to list archived memories." },
      { name: "page", kind: "number", in: "query", default: 1, description: "1-indexed page number." },
      { name: "limit", kind: "number", in: "query", default: 20, description: "Page size, capped at 100." },
    ],
    responseShape: '{ "memories": [...], "total": 0, "page": 1, "limit": 20 }',
  },
  {
    id: "memory-create",
    group: "Memory",
    method: "POST",
    path: "/api/memory",
    title: "Create a memory",
    description: "Save a new memory. Embeddings generated automatically.",
    auth: "write",
    rateLimit: "20 requests / 60s",
    fields: [
      { name: "content", kind: "textarea", in: "body", required: true, description: "The memory text (max 5000 chars)." },
      { name: "category", kind: "enum", in: "body", enumValues: MEMORY_CATEGORY_VALUES, default: "SEMANTIC", description: "Memory category." },
      { name: "tags", kind: "tags", in: "body", description: "Comma-separated tags (max 10)." },
      { name: "importance", kind: "number", in: "body", default: 0.5, description: "0 to 1." },
      { name: "source", kind: "string", in: "body", description: "Optional origin label." },
      { name: "namespace", kind: "string", in: "body", default: "default", description: "Project/tenant isolation." },
    ],
    responseShape: '{ "memory": { ... } }',
  },
  {
    id: "memory-get",
    group: "Memory",
    method: "GET",
    path: "/api/memory/{id}",
    title: "Get a memory",
    description: "Fetch a single memory by ID.",
    auth: "read",
    fields: [
      { name: "id", kind: "string", in: "path", required: true, description: "The memory's $id." },
    ],
    responseShape: '{ "memory": { ... }, "related": [...] }',
  },
  {
    id: "memory-update",
    group: "Memory",
    method: "PATCH",
    path: "/api/memory/{id}",
    title: "Update a memory",
    description: "Partial update. Editing content re-generates the embedding.",
    auth: "write",
    fields: [
      { name: "id", kind: "string", in: "path", required: true, description: "The memory's $id." },
      { name: "content", kind: "textarea", in: "body", description: "New memory text." },
      { name: "category", kind: "enum", in: "body", enumValues: MEMORY_CATEGORY_VALUES, description: "New category." },
      { name: "tags", kind: "tags", in: "body", description: "Replaces the full tag list." },
      { name: "importance", kind: "number", in: "body", description: "0 to 1." },
      { name: "isArchived", kind: "boolean", in: "body", description: "Archive or restore." },
    ],
    responseShape: '{ "memory": { ... } }',
  },
  {
    id: "memory-delete",
    group: "Memory",
    method: "DELETE",
    path: "/api/memory/{id}",
    title: "Delete a memory",
    description: "Permanently deletes the memory.",
    auth: "write",
    fields: [
      { name: "id", kind: "string", in: "path", required: true, description: "The memory's $id." },
    ],
    responseShape: '{ "success": true }',
  },
  {
    id: "memory-export",
    group: "Memory",
    method: "GET",
    path: "/api/memory/export",
    title: "Export memories",
    description: "Downloads every memory as a JSON file.",
    auth: "read",
    fields: [
      { name: "includeArchived", kind: "boolean", in: "query", default: false, description: "Include archived memories." },
    ],
    responseShape: '{ "exportedAt": "...", "count": 0, "memories": [...] }',
  },
  {
    id: "search-query",
    group: "Search",
    method: "POST",
    path: "/api/search",
    title: "Semantic search",
    description: "Search memories by cosine similarity.",
    auth: "read",
    rateLimit: "30 requests / 60s",
    fields: [
      { name: "query", kind: "string", in: "body", required: true, description: "Search text (max 500 chars)." },
      { name: "topK", kind: "number", in: "body", default: 10, description: "Max results, 1 to 20." },
      { name: "category", kind: "enum", in: "body", enumValues: MEMORY_CATEGORY_VALUES, description: "Restrict to one category." },
      { name: "minScore", kind: "number", in: "body", default: 0.3, description: "Minimum cosine similarity." },
      { name: "namespace", kind: "string", in: "body", description: "Search only this namespace." },
    ],
    responseShape: '{ "results": [{ "memory": { ... }, "score": 0.0 }] }',
  },
  {
    id: "recall-query",
    group: "Search",
    method: "POST",
    path: "/api/memory/recall",
    title: "Recall memories (AI-ready)",
    description: "Semantic retrieval with ready-to-inject context block.",
    auth: "read",
    rateLimit: "30 requests / 60s",
    fields: [
      { name: "query", kind: "string", in: "body", required: true, description: "Recall text (max 500 chars)." },
      { name: "topK", kind: "number", in: "body", default: 10, description: "Max results." },
      { name: "category", kind: "enum", in: "body", enumValues: MEMORY_CATEGORY_VALUES, description: "Restrict to one category." },
      { name: "minScore", kind: "number", in: "body", default: 0.3, description: "Minimum cosine similarity." },
      { name: "namespace", kind: "string", in: "body", description: "Recall within this namespace." },
    ],
    responseShape: '{ "results": [...], "context": "..." }',
  },
  {
    id: "chat-send",
    group: "Chat",
    method: "POST",
    path: "/api/chat",
    title: "Send a chat message",
    description: "Streams a Claude response in real time.",
    auth: "chat",
    rateLimit: "30 requests / 60s",
    streaming: true,
    fields: [
      { name: "message", kind: "textarea", in: "body", required: true, description: "The user message (max 10,000 chars)." },
      { name: "conversationId", kind: "string", in: "body", description: "Continue an existing conversation." },
      { name: "agentId", kind: "string", in: "body", description: "Route through a specific agent." },
    ],
    responseShape: "Streaming response with X-Conversation-Id header",
  },
  {
    id: "agents-list",
    group: "Agents",
    method: "GET",
    path: "/api/agents",
    title: "List agents",
    description: "Lists non-archived agents, most recently updated first.",
    auth: "read",
    fields: [],
    responseShape: '{ "agents": [...] }',
  },
  {
    id: "agents-create",
    group: "Agents",
    method: "POST",
    path: "/api/agents",
    title: "Create an agent",
    description: "Creates a custom assistant persona.",
    auth: "write",
    fields: [
      { name: "name", kind: "string", in: "body", required: true, description: "Display name (max 100 chars)." },
      { name: "description", kind: "string", in: "body", description: "Optional description (max 500 chars)." },
      { name: "systemPrompt", kind: "textarea", in: "body", required: true, description: "System prompt (max 4000 chars)." },
      { name: "modelId", kind: "string", in: "body", description: "Anthropic model ID." },
      { name: "memoryScope", kind: "enum", in: "body", enumValues: ["user", "agent", "global"], default: "user", description: "Memory scope." },
      { name: "temperature", kind: "number", in: "body", default: 0.7, description: "0 to 2." },
      { name: "maxTokens", kind: "number", in: "body", default: 2000, description: "100 to 4000." },
    ],
    responseShape: '{ "agent": { ... } }',
  },
  {
    id: "agents-get",
    group: "Agents",
    method: "GET",
    path: "/api/agents/{id}",
    title: "Get an agent",
    description: "Fetch a single agent by ID.",
    auth: "read",
    fields: [
      { name: "id", kind: "string", in: "path", required: true, description: "The agent's $id." },
    ],
    responseShape: '{ "agent": { ... } }',
  },
  {
    id: "agents-update",
    group: "Agents",
    method: "PATCH",
    path: "/api/agents/{id}",
    title: "Update an agent",
    description: "Partial update of agent properties.",
    auth: "write",
    fields: [
      { name: "id", kind: "string", in: "path", required: true, description: "The agent's $id." },
      { name: "name", kind: "string", in: "body", description: "New display name." },
      { name: "systemPrompt", kind: "textarea", in: "body", description: "New system prompt." },
      { name: "status", kind: "enum", in: "body", enumValues: ["ACTIVE", "PAUSED", "ARCHIVED"], description: "New status." },
      { name: "temperature", kind: "number", in: "body", description: "0 to 2." },
      { name: "maxTokens", kind: "number", in: "body", description: "100 to 4000." },
    ],
    responseShape: '{ "agent": { ... } }',
  },
  {
    id: "agents-delete",
    group: "Agents",
    method: "DELETE",
    path: "/api/agents/{id}",
    title: "Archive an agent",
    description: "Soft-delete: sets status to ARCHIVED.",
    auth: "write",
    fields: [
      { name: "id", kind: "string", in: "path", required: true, description: "The agent's $id." },
    ],
    responseShape: '{ "success": true }',
  },
  {
    id: "conversations-list",
    group: "Conversations",
    method: "GET",
    path: "/api/conversations",
    title: "List conversations",
    description: "Page through conversations, most recently updated first.",
    auth: "read",
    fields: [
      { name: "page", kind: "number", in: "query", default: 1, description: "1-indexed page number." },
      { name: "limit", kind: "number", in: "query", default: 20, description: "Page size, capped at 50." },
    ],
    responseShape: '{ "conversations": [...], "total": 0, "page": 1, "limit": 20 }',
  },
  {
    id: "conversations-create",
    group: "Conversations",
    method: "POST",
    path: "/api/conversations",
    title: "Create a conversation",
    description: "Creates an empty conversation shell.",
    auth: "write",
    fields: [
      { name: "title", kind: "string", in: "body", description: "Optional title (max 200 chars)." },
      { name: "agentId", kind: "string", in: "body", description: "Optional agent to attach." },
    ],
    responseShape: '{ "conversation": { ... } }',
  },
  {
    id: "conversations-get",
    group: "Conversations",
    method: "GET",
    path: "/api/conversations/{id}",
    title: "Get a conversation",
    description: "Fetch a conversation with full message history.",
    auth: "read",
    fields: [
      { name: "id", kind: "string", in: "path", required: true, description: "The conversation's $id." },
    ],
    responseShape: '{ "conversation": { "messages": [...], "agent": { ... } } }',
  },
  {
    id: "conversations-delete",
    group: "Conversations",
    method: "DELETE",
    path: "/api/conversations/{id}",
    title: "Delete a conversation",
    description: "Permanently deletes the conversation and messages.",
    auth: "write",
    fields: [
      { name: "id", kind: "string", in: "path", required: true, description: "The conversation's $id." },
    ],
    responseShape: '{ "success": true }',
  },
  {
    id: "wallet-get",
    group: "Wallet",
    method: "GET",
    path: "/api/wallet",
    title: "Get linked wallet",
    description: "Returns the caller's primary linked wallet.",
    auth: "session",
    fields: [],
    responseShape: '{ "wallet": { ... }, "wallets": [...] }',
  },
  {
    id: "wallet-link",
    group: "Wallet",
    method: "POST",
    path: "/api/wallet",
    title: "Link / verify wallet",
    description: "Link a wallet via signature verification.",
    auth: "session",
    fields: [
      { name: "address", kind: "string", in: "body", required: true, description: "Wallet address (0x + 40 hex chars)." },
      { name: "signature", kind: "string", in: "body", required: true, description: "EIP-191 personal_sign signature." },
      { name: "message", kind: "string", in: "body", required: true, description: "The exact message that was signed." },
    ],
    responseShape: '{ "wallet": { ... } }',
  },
  {
    id: "wallet-unlink",
    group: "Wallet",
    method: "DELETE",
    path: "/api/wallet",
    title: "Disconnect wallet",
    description: "Soft-disconnects all wallets from the account.",
    auth: "session",
    fields: [],
    responseShape: "204 No Content",
  },
  {
    id: "subscription-get",
    group: "Subscription",
    method: "GET",
    path: "/api/subscription",
    title: "Get subscription status",
    description: "Returns current subscription status and payment history.",
    auth: "session",
    fields: [],
    responseShape: '{ "status": "active", "plan": "pro", "planExpiresAt": "...", "payments": [...] }',
  },
  {
    id: "subscription-confirm",
    group: "Subscription",
    method: "POST",
    path: "/api/subscription/confirm",
    title: "Confirm a payment",
    description: "Submit tx hash for server-side verification.",
    auth: "session",
    rateLimit: "5 requests / 10 min",
    fields: [
      { name: "txHash", kind: "string", in: "body", required: true, description: "On-chain transaction hash." },
      { name: "billingCycle", kind: "enum", in: "body", required: true, enumValues: ["monthly", "annual"], description: "Billing cycle." },
      { name: "plan", kind: "enum", in: "body", required: true, enumValues: ["starter", "pro", "premium", "enterprise"], description: "Subscription plan." },
    ],
    responseShape: '{ "user": { ... }, "payment": { ... } }',
  },
  {
    id: "billing-overview",
    group: "Billing",
    method: "GET",
    path: "/api/billing/overview",
    title: "Billing overview (admin)",
    description: "Admin-only revenue metrics and payment stats.",
    auth: "session",
    fields: [],
    responseShape: '{ "overview": { ... }, "revenue": { ... }, "recentPayments": [...] }',
  },
  {
    id: "billing-verify-base",
    group: "Billing",
    method: "POST",
    path: "/api/billing/base/verify",
    title: "Verify Base transaction",
    description: "Verify a Base blockchain transaction exists and is valid.",
    auth: "session",
    rateLimit: "10 requests / 60s",
    fields: [
      { name: "txHash", kind: "string", in: "body", required: true, description: "Base transaction hash." },
    ],
    responseShape: '{ "verified": true, "from": "0x...", "to": "0x...", "amountUsdc": 5.0 }',
  },
  {
    id: "apikeys-list",
    group: "API Keys",
    method: "GET",
    path: "/api/api-keys",
    title: "List API keys",
    description: "Lists active API keys (never returns raw key).",
    auth: "session",
    fields: [],
    responseShape: '{ "apiKeys": [...] }',
  },
  {
    id: "apikeys-create",
    group: "API Keys",
    method: "POST",
    path: "/api/api-keys",
    title: "Create an API key",
    description: "Mints a new key. Raw key shown once.",
    auth: "session",
    fields: [
      { name: "name", kind: "string", in: "body", required: true, description: "Label for this key." },
      { name: "scope", kind: "enum", in: "body", enumValues: ["FULL", "MEMORY_READ", "MEMORY_WRITE", "CHAT"], default: "FULL", description: "Access level." },
      { name: "expiresAt", kind: "string", in: "body", description: "Optional ISO 8601 expiry." },
    ],
    responseShape: '{ "apiKey": { ... }, "fullKey": "cnch_..." }',
  },
  {
    id: "apikeys-delete",
    group: "API Keys",
    method: "DELETE",
    path: "/api/api-keys/{id}",
    title: "Revoke an API key",
    description: "Immediately invalidates the key.",
    auth: "session",
    fields: [
      { name: "id", kind: "string", in: "path", required: true, description: "The key's $id." },
    ],
    responseShape: '{ "success": true }',
  },
];

const BASE_URL = "https://conchportal.com";
const SDK_VERSION = "1.0.0";

// ── Helpers ──────────────────────────────────────────────────────────────────

function toSnakeCase(str: string): string {
  return str.replace(/([A-Z])/g, "_$1").toLowerCase().replace(/^_/, "");
}

function toCamelCase(str: string): string {
  return str.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

function toPascalCase(str: string): string {
  return str
    .split(/[-_\s]+/)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join("");
}

function toKebabCase(str: string): string {
  return str.replace(/([A-Z])/g, "-$1").toLowerCase().replace(/^-/, "");
}

function extractPathParams(path: string): string[] {
  const matches = path.match(/\{(\w+)\}/g);
  return matches ? matches.map((m) => m.slice(1, -1)) : [];
}

function mapFieldType(kind: FieldKind, enumValues?: string[]): { ts: string; py: string; go: string; rust: string; java: string; php: string } {
  switch (kind) {
    case "number":
      return { ts: "number", py: "float", go: "float64", rust: "f64", java: "double", php: "float" };
    case "boolean":
      return { ts: "boolean", py: "bool", go: "bool", rust: "bool", java: "boolean", php: "bool" };
    case "enum":
      return { ts: enumValues?.map((v) => `"${v}"`).join(" | ") ?? "string", py: "str", go: "string", rust: "String", java: "String", php: "string" };
    default:
      return { ts: "string", py: "str", go: "string", rust: "String", java: "String", php: "string" };
  }
}

// ── TypeScript Generator ─────────────────────────────────────────────────────

function generateTypeScript(): string {
  const lines: string[] = [];

  lines.push(`/**`);
  lines.push(` * Conch SDK for JavaScript/TypeScript`);
  lines.push(` * Auto-generated from API spec — do not edit manually.`);
  lines.push(` * Version: ${SDK_VERSION}`);
  lines.push(` */`);
  lines.push(``);
  lines.push(`const BASE_URL = "${BASE_URL}";`);
  lines.push(``);
  lines.push(`export interface ConchClientConfig {`);
  lines.push(`  apiKey: string;`);
  lines.push(`  baseUrl?: string;`);
  lines.push(`  timeout?: number;`);
  lines.push(`}`);
  lines.push(``);
  lines.push(`export class ConchError extends Error {`);
  lines.push(`  constructor(`);
  lines.push(`    public status: number,`);
  lines.push(`    message: string,`);
  lines.push(`    public body?: unknown`);
  lines.push(`  ) {`);
  lines.push(`    super(message);`);
  lines.push(`    this.name = "ConchError";`);
  lines.push(`  }`);
  lines.push(`}`);
  lines.push(``);

  // Generate types from response shapes
  lines.push(`// ── Types ──────────────────────────────────────────────────────`);
  lines.push(``);

  const types: string[] = [];
  types.push(`export type MemoryCategory = "EPISODIC" | "SEMANTIC" | "PREFERENCE" | "PROCEDURAL";`);
  types.push(`export type AgentStatus = "ACTIVE" | "PAUSED" | "ARCHIVED";`);
  types.push(`export type MemoryScope = "user" | "agent" | "global";`);
  types.push(`export type BillingCycle = "monthly" | "annual";`);
  types.push(`export type Plan = "starter" | "pro" | "premium" | "enterprise";`);
  types.push(`export type ApiKeyScope = "FULL" | "MEMORY_READ" | "MEMORY_WRITE" | "CHAT";`);
  types.push(``);
  types.push(`export interface Memory {`);
  types.push(`  $id: string;`);
  types.push(`  $createdAt: string;`);
  types.push(`  $updatedAt: string;`);
  types.push(`  userId: string;`);
  types.push(`  content: string;`);
  types.push(`  category: MemoryCategory;`);
  types.push(`  tags: string[];`);
  types.push(`  importance: number;`);
  types.push(`  accessCount: number;`);
  types.push(`  lastAccessed: string | null;`);
  types.push(`  source: string | null;`);
  types.push(`  agentId: string | null;`);
  types.push(`  isArchived: boolean;`);
  types.push(`  namespace: string;`);
  types.push(`}`);
  types.push(``);
  types.push(`export interface Agent {`);
  types.push(`  $id: string;`);
  types.push(`  $createdAt: string;`);
  types.push(`  $updatedAt: string;`);
  types.push(`  userId: string;`);
  types.push(`  name: string;`);
  types.push(`  description: string | null;`);
  types.push(`  systemPrompt: string;`);
  types.push(`  avatarUrl: string | null;`);
  types.push(`  status: AgentStatus;`);
  types.push(`  memoryScope: MemoryScope;`);
  types.push(`  modelId: string;`);
  types.push(`  temperature: number;`);
  types.push(`  maxTokens: number;`);
  types.push(`}`);
  types.push(``);
  types.push(`export interface Conversation {`);
  types.push(`  $id: string;`);
  types.push(`  $createdAt: string;`);
  types.push(`  $updatedAt: string;`);
  types.push(`  userId: string;`);
  types.push(`  agentId: string | null;`);
  types.push(`  title: string;`);
  types.push(`  summary: string | null;`);
  types.push(`}`);
  types.push(``);
  types.push(`export interface Message {`);
  types.push(`  $id: string;`);
  types.push(`  conversationId: string;`);
  types.push(`  role: "user" | "assistant";`);
  types.push(`  content: string;`);
  types.push(`  tokensUsed: number | null;`);
  types.push(`  memoryIds: string[];`);
  types.push(`}`);
  types.push(``);
  types.push(`export interface Wallet {`);
  types.push(`  $id: string;`);
  types.push(`  userId: string;`);
  types.push(`  address: string;`);
  types.push(`  chainId: number;`);
  types.push(`  ensName: string | null;`);
  types.push(`  isPrimary: boolean;`);
  types.push(`  verifiedAt: string | null;`);
  types.push(`  lastConnectedAt: string | null;`);
  types.push(`  disconnectedAt: string | null;`);
  types.push(`  walletType: string | null;`);
  types.push(`}`);
  types.push(``);
  types.push(`export interface Payment {`);
  types.push(`  $id: string;`);
  types.push(`  userId: string;`);
  types.push(`  txHash: string;`);
  types.push(`  walletAddress: string;`);
  types.push(`  chainId: number;`);
  types.push(`  plan: string;`);
  types.push(`  billingCycle: BillingCycle;`);
  types.push(`  amountUsdcBaseUnits: number;`);
  types.push(`  periodStart: string;`);
  types.push(`  periodEnd: string;`);
  types.push(`  blockNumber: number;`);
  types.push(`  confirmedAt: string;`);
  types.push(`  paymentState: string;`);
  types.push(`}`);
  types.push(``);
  types.push(`export interface ApiKey {`);
  types.push(`  $id: string;`);
  types.push(`  userId: string;`);
  types.push(`  name: string;`);
  types.push(`  keyPrefix: string;`);
  types.push(`  scope: ApiKeyScope;`);
  types.push(`  lastUsedAt: string | null;`);
  types.push(`  expiresAt: string | null;`);
  types.push(`  isRevoked: boolean;`);
  types.push(`}`);
  types.push(``);

  for (const t of types) {
    lines.push(t);
  }

  // Generate client class
  lines.push(``);
  lines.push(`// ── Client ─────────────────────────────────────────────────────`);
  lines.push(``);
  lines.push(`export class ConchClient {`);
  lines.push(`  private apiKey: string;`);
  lines.push(`  private baseUrl: string;`);
  lines.push(`  private timeout: number;`);
  lines.push(``);
  lines.push(`  constructor(config: ConchClientConfig) {`);
  lines.push(`    this.apiKey = config.apiKey;`);
  lines.push(`    this.baseUrl = config.baseUrl ?? "${BASE_URL}";`);
  lines.push(`    this.timeout = config.timeout ?? 30000;`);
  lines.push(`  }`);
  lines.push(``);
  lines.push(`  private async request<T>(`);
  lines.push(`    method: string,`);
  lines.push(`    path: string,`);
  lines.push(`    body?: Record<string, unknown>,`);
  lines.push(`    query?: Record<string, unknown>`);
  lines.push(`  ): Promise<T> {`);
  lines.push(`    let url = this.baseUrl + path;`);
  lines.push(`    if (query) {`);
  lines.push(`      const params = new URLSearchParams();`);
  lines.push(`      for (const [k, v] of Object.entries(query)) {`);
  lines.push(`        if (v !== undefined && v !== null) params.set(k, String(v));`);
  lines.push(`      }`);
  lines.push(`      const qs = params.toString();`);
  lines.push(`      if (qs) url += "?" + qs;`);
  lines.push(`    }`);
  lines.push(``);
  lines.push(`    const res = await fetch(url, {`);
  lines.push(`      method,`);
  lines.push(`      headers: {`);
  lines.push(`        Authorization: \`Bearer \${this.apiKey}\`,`);
  lines.push(`        "Content-Type": "application/json",`);
  lines.push(`      },`);
  lines.push(`      body: body ? JSON.stringify(body) : undefined,`);
  lines.push(`      signal: AbortSignal.timeout(this.timeout),`);
  lines.push(`    });`);
  lines.push(``);
  lines.push(`    if (!res.ok) {`);
  lines.push(`      const err = await res.json().catch(() => ({}));`);
  lines.push(`      throw new ConchError(res.status, err.error ?? res.statusText, err);`);
  lines.push(`    }`);
  lines.push(``);
  lines.push(`    if (res.status === 204) return undefined as T;`);
  lines.push(`    return res.json();`);
  lines.push(`  }`);
  lines.push(``);

  // Group endpoints by group
  const groups = new Map<string, EndpointSpec[]>();
  for (const ep of ENDPOINTS) {
    if (!groups.has(ep.group)) groups.set(ep.group, []);
    groups.get(ep.group)!.push(ep);
  }

  for (const [group, endpoints] of groups) {
    const groupName = toCamelCase(group.replace(/\s+/g, ""));
    lines.push(`  // ── ${group} ──────────────────────────────────────────────────`);
    lines.push(``);

    for (const ep of endpoints) {
      const methodName = toCamelCase(ep.id.replace(/-/g, "_"));
      const pathParams = extractPathParams(ep.path);
      const queryParams = ep.fields.filter((f) => f.in === "query");
      const bodyParams = ep.fields.filter((f) => f.in === "body");

      // Build method signature
      const params: string[] = [];
      for (const p of pathParams) {
        params.push(`${p}: string`);
      }
      if (queryParams.length > 0 || bodyParams.length > 0) {
        const optionalFields: string[] = [];
        for (const q of queryParams) {
          optionalFields.push(`${q.name}?: ${mapFieldType(q.kind, q.enumValues).ts}`);
        }
        for (const b of bodyParams) {
          if (b.required) {
            params.push(`${b.name}: ${mapFieldType(b.kind, b.enumValues).ts}`);
          } else {
            optionalFields.push(`${b.name}?: ${mapFieldType(b.kind, b.enumValues).ts}`);
          }
        }
        if (optionalFields.length > 0) {
          params.push(`options?: { ${optionalFields.join("; ")} }`);
        }
      }

      const returnType = ep.streaming ? "Promise<Response>" : "Promise<Record<string, unknown>>";

      lines.push(`  /**`);
      lines.push(`   * ${ep.title}`);
      lines.push(`   * ${ep.description}`);
      if (ep.rateLimit) lines.push(`   * Rate limit: ${ep.rateLimit}`);
      lines.push(`   */`);
      lines.push(`  async ${methodName}(${params.join(", ")}): ${returnType} {`);

      // Build path with params
      let pathStr = ep.path;
      for (const p of pathParams) {
        pathStr = pathStr.replace(`{${p}}`, `\${${p}}`);
      }
      if (pathParams.length > 0) {
        lines.push(`    const path = \`${pathStr.replace(/\$/g, "\\$")}\`;`);
      } else {
        lines.push(`    const path = "${ep.path}";`);
      }

      // Build query and body
      if (ep.streaming) {
        lines.push(`    const url = this.baseUrl + path;`);
        lines.push(`    const res = await fetch(url, {`);
        lines.push(`      method: "${ep.method}",`);
        lines.push(`      headers: {`);
        lines.push(`        Authorization: \`Bearer \${this.apiKey}\`,`);
        lines.push(`        "Content-Type": "application/json",`);
        lines.push(`      },`);
        if (bodyParams.length > 0) {
          lines.push(`      body: JSON.stringify(options ?? {}),`);
        }
        lines.push(`    });`);
        lines.push(`    if (!res.ok) {`);
        lines.push(`      const err = await res.json().catch(() => ({}));`);
        lines.push(`      throw new ConchError(res.status, err.error ?? res.statusText, err);`);
        lines.push(`    }`);
        lines.push(`    return res;`);
      } else {
        const queryObj = queryParams.length > 0
          ? `{ ${queryParams.map((q) => `${q.name}: options?.${q.name}`).join(", ")} }`
          : undefined;
        const bodyObj = bodyParams.length > 0
          ? bodyParams.every((b) => b.required)
            ? `{ ${bodyParams.map((b) => b.name).join(", ")} }`
            : `options`
          : undefined;

        lines.push(`    return this.request<Record<string, unknown>>(`);
        lines.push(`      "${ep.method}",`);
        lines.push(`      path,`);
        if (bodyObj) lines.push(`      ${bodyObj},`);
        if (queryObj) lines.push(`      ${queryObj}`);
        lines.push(`    );`);
      }

      lines.push(`  }`);
      lines.push(``);
    }
  }

  lines.push(`}`);
  lines.push(``);

  return lines.join("\n");
}

// ── Python Generator ─────────────────────────────────────────────────────────

function generatePython(): string {
  const lines: string[] = [];

  lines.push(`"""`);
  lines.push(`Conch SDK for Python`);
  lines.push(`Auto-generated from API spec — do not edit manually.`);
  lines.push(`Version: ${SDK_VERSION}`);
  lines.push(`"""`);
  lines.push(``);
  lines.push(`from __future__ import annotations`);
  lines.push(``);
  lines.push(`import json`);
  lines.push(`from typing import Any, Optional`);
  lines.push(`from dataclasses import dataclass`);
  lines.push(`import urllib.request`);
  lines.push(`import urllib.error`);
  lines.push(``);
  lines.push(``);
  lines.push(`class ConchError(Exception):`);
  lines.push(`    """Error returned by the Conch API."""`);
  lines.push(``);
  lines.push(`    def __init__(self, status: int, message: str, body: Any = None):`);
  lines.push(`        super().__init__(message)`);
  lines.push(`        self.status = status`);
  lines.push(`        self.body = body`);
  lines.push(``);
  lines.push(``);
  lines.push(`@dataclass`);
  lines.push(`class ConchClient:`);
  lines.push(`    """Conch API client."""`);
  lines.push(``);
  lines.push(`    api_key: str`);
  lines.push(`    base_url: str = "${BASE_URL}"`);
  lines.push(`    timeout: int = 30`);
  lines.push(``);
  lines.push(`    def _request(`);
  lines.push(`        self,`);
  lines.push(`        method: str,`);
  lines.push(`        path: str,`);
  lines.push(`        body: Optional[dict] = None,`);
  lines.push(`        params: Optional[dict] = None,`);
  lines.push(`    ) -> Any:`);
  lines.push(`        url = self.base_url + path`);
  lines.push(`        if params:`);
  lines.push(`            query = "&".join(f"{k}={v}" for k, v in params.items() if v is not None)`);
  lines.push(`            if query:`);
  lines.push(`                url += "?" + query`);
  lines.push(``);
  lines.push(`        data = json.dumps(body).encode() if body else None`);
  lines.push(`        req = urllib.request.Request(`);
  lines.push(`            url,`);
  lines.push(`            data=data,`);
  lines.push(`            method=method,`);
  lines.push(`            headers={`);
  lines.push(`                "Authorization": f"Bearer {self.api_key}",`);
  lines.push(`                "Content-Type": "application/json",`);
  lines.push(`            },`);
  lines.push(`        )`);
  lines.push(``);
  lines.push(`        try:`);
  lines.push(`            with urllib.request.urlopen(req, timeout=self.timeout) as resp:`);
  lines.push(`                if resp.status == 204:`);
  lines.push(`                    return None`);
  lines.push(`                return json.loads(resp.read().decode())`);
  lines.push(`        except urllib.error.HTTPError as e:`);
  lines.push(`            body = json.loads(e.read().decode()) if e.fp else {}`);
  lines.push(`            raise ConchError(e.code, body.get("error", str(e)), body)`);
  lines.push(``);
  lines.push(``);

  // Group endpoints
  const groups = new Map<string, EndpointSpec[]>();
  for (const ep of ENDPOINTS) {
    if (!groups.has(ep.group)) groups.set(ep.group, []);
    groups.get(ep.group)!.push(ep);
  }

  for (const [group, endpoints] of groups.entries()) {
    const className = toPascalCase(group.replace(/\s+/g, "")) + "API";
    lines.push(`class ${className}:`);
    lines.push(`    """${group} endpoints."""`);
    lines.push(``);
    lines.push(`    def __init__(self, client: ConchClient):`);
    lines.push(`        self._client = client`);
    lines.push(``);

    for (const ep of endpoints) {
      const methodName = toSnakeCase(ep.id.replace(/-/g, "_"));
      const pathParams = extractPathParams(ep.path);
      const queryParams = ep.fields.filter((f) => f.in === "query");
      const bodyParams = ep.fields.filter((f) => f.in === "body");

      // Build signature (required params first for Python)
      const requiredBodyParams = bodyParams.filter((b) => b.required);
      const optionalBodyParams = bodyParams.filter((b) => !b.required);
      const params: string[] = [];
      for (const p of pathParams) {
        params.push(`${toSnakeCase(p)}: str`);
      }
      for (const b of requiredBodyParams) {
        params.push(`${toSnakeCase(b.name)}: ${mapFieldType(b.kind, b.enumValues).py}`);
      }
      for (const b of optionalBodyParams) {
        params.push(`${toSnakeCase(b.name)}: Optional[${mapFieldType(b.kind, b.enumValues).py}] = None`);
      }
      if (queryParams.length > 0) {
        params.push(`**kwargs`);
      }

      lines.push(`    def ${methodName}(${params.join(", ")}) -> dict:`);
      lines.push(`        """${ep.title} — ${ep.description}"""`);

      // Build path
      let pathStr = ep.path;
      for (const p of pathParams) {
        pathStr = pathStr.replace(`{${p}}`, `{${toSnakeCase(p)}}`);
      }
      if (pathParams.length > 0) {
        lines.push(`        path = f"${pathStr}"`);
      } else {
        lines.push(`        path = "${ep.path}"`);
      }

      // Build body
      if (bodyParams.length > 0) {
        const bodyFields = bodyParams.map((b) => {
          const snakeName = toSnakeCase(b.name);
          if (b.required) return `            "${b.name}": ${snakeName}`;
          return `            "${b.name}": ${snakeName} if ${snakeName} is not None else None`;
        });
        lines.push(`        body = {`);
        lines.push(bodyFields.join(",\n"));
        lines.push(`        }`);
        lines.push(`        body = {k: v for k, v in body.items() if v is not None}`);
      }

      // Build query params
      if (queryParams.length > 0) {
        const qpFields = queryParams.map((q) => `"${q.name}": kwargs.get("${toSnakeCase(q.name)}")`);
        lines.push(`        params = {${qpFields.join(", ")}}`);
        lines.push(`        params = {k: v for k, v in params.items() if v is not None}`);
      }

      // Call
      const bodyArg = bodyParams.length > 0 ? "body" : "None";
      const queryArg = queryParams.length > 0 ? "params" : "None";
      lines.push(`        return self._client.request("${ep.method}", path, ${bodyArg}, ${queryArg})`);
      lines.push(``);
    }
  }

  // Add resource classes
  lines.push(``);
  lines.push(`# ── Resource Classes ─────────────────────────────────────────`);
  lines.push(``);
  lines.push(`class MemoryAPI:`);
  lines.push(`    """Memory endpoints."""`);
  lines.push(``);
  lines.push(`    def __init__(self, client: ConchClient):`);
  lines.push(`        self._client = client`);
  lines.push(``);
  lines.push(`    def list(self, *, category: Optional[str] = None, namespace: Optional[str] = None,`);
  lines.push(`             archived: bool = False, page: int = 1, limit: int = 20) -> dict:`);
  lines.push(`        """List memories."""`);
  lines.push(`        params = {"archived": str(archived).lower(), "page": page, "limit": limit}`);
  lines.push(`        if category:`);
  lines.push(`            params["category"] = category`);
  lines.push(`        if namespace:`);
  lines.push(`            params["namespace"] = namespace`);
  lines.push(`        return self._client.request("GET", "/api/memory", params=params)`);
  lines.push(``);
  lines.push(`    def create(self, content: str, *, category: str = "SEMANTIC",`);
  lines.push(`               tags: Optional[list[str]] = None, importance: float = 0.5,`);
  lines.push(`               source: Optional[str] = None, namespace: str = "default") -> dict:`);
  lines.push(`        """Create a memory."""`);
  lines.push(`        body = {"content": content, "category": category, "importance": importance, "namespace": namespace}`);
  lines.push(`        if tags:`);
  lines.push(`            body["tags"] = tags`);
  lines.push(`        if source:`);
  lines.push(`            body["source"] = source`);
  lines.push(`        return self._client.request("POST", "/api/memory", body=body)`);
  lines.push(``);
  lines.push(`    def get(self, memory_id: str) -> dict:`);
  lines.push(`        """Get a memory."""`);
  lines.push(`        return self._client.request("GET", f"/api/memory/{memory_id}")`);
  lines.push(``);
  lines.push(`    def update(self, memory_id: str, **kwargs) -> dict:`);
  lines.push(`        """Update a memory."""`);
  lines.push(`        body = {k: v for k, v in kwargs.items() if v is not None}`);
  lines.push(`        return self._client.request("PATCH", f"/api/memory/{memory_id}", body=body)`);
  lines.push(``);
  lines.push(`    def delete(self, memory_id: str) -> dict:`);
  lines.push(`        """Delete a memory."""`);
  lines.push(`        return self._client.request("DELETE", f"/api/memory/{memory_id}")`);
  lines.push(``);
  lines.push(`    def search(self, query: str, *, top_k: int = 10, category: Optional[str] = None,`);
  lines.push(`               min_score: float = 0.3, namespace: Optional[str] = None) -> dict:`);
  lines.push(`        """Semantic search."""`);
  lines.push(`        body = {"query": query, "topK": top_k, "minScore": min_score}`);
  lines.push(`        if category:`);
  lines.push(`            body["category"] = category`);
  lines.push(`        if namespace:`);
  lines.push(`            body["namespace"] = namespace`);
  lines.push(`        return self._client.request("POST", "/api/search", body=body)`);
  lines.push(``);
  lines.push(`    def recall(self, query: str, *, top_k: int = 10, category: Optional[str] = None,`);
  lines.push(`               min_score: float = 0.3, namespace: Optional[str] = None) -> dict:`);
  lines.push(`        """Recall memories (AI-ready)."""`);
  lines.push(`        body = {"query": query, "topK": top_k, "minScore": min_score}`);
  lines.push(`        if category:`);
  lines.push(`            body["category"] = category`);
  lines.push(`        if namespace:`);
  lines.push(`            body["namespace"] = namespace`);
  lines.push(`        return self._client.request("POST", "/api/memory/recall", body=body)`);
  lines.push(``);
  lines.push(``);
  lines.push(`class AgentAPI:`);
  lines.push(`    """Agent endpoints."""`);
  lines.push(``);
  lines.push(`    def __init__(self, client: ConchClient):`);
  lines.push(`        self._client = client`);
  lines.push(``);
  lines.push(`    def list(self) -> dict:`);
  lines.push(`        """List agents."""`);
  lines.push(`        return self._client.request("GET", "/api/agents")`);
  lines.push(``);
  lines.push(`    def create(self, name: str, system_prompt: str, **kwargs) -> dict:`);
  lines.push(`        """Create an agent."""`);
  lines.push(`        body = {"name": name, "systemPrompt": system_prompt}`);
  lines.push(`        body.update(kwargs)`);
  lines.push(`        return self._client.request("POST", "/api/agents", body=body)`);
  lines.push(``);
  lines.push(`    def get(self, agent_id: str) -> dict:`);
  lines.push(`        """Get an agent."""`);
  lines.push(`        return self._client.request("GET", f"/api/agents/{agent_id}")`);
  lines.push(``);
  lines.push(`    def update(self, agent_id: str, **kwargs) -> dict:`);
  lines.push(`        """Update an agent."""`);
  lines.push(`        body = {k: v for k, v in kwargs.items() if v is not None}`);
  lines.push(`        return self._client.request("PATCH", f"/api/agents/{agent_id}", body=body)`);
  lines.push(``);
  lines.push(`    def delete(self, agent_id: str) -> dict:`);
  lines.push(`        """Archive an agent."""`);
  lines.push(`        return self._client.request("DELETE", f"/api/agents/{agent_id}")`);
  lines.push(``);
  lines.push(``);

  return lines.join("\n");
}

// ── Go Generator ─────────────────────────────────────────────────────────────

function generateGo(): string {
  const lines: string[] = [];

  lines.push(`// Package conch provides a Go client for the Conch API.`);
  lines.push(`// Auto-generated from API spec — do not edit manually.`);
  lines.push(`package conch`);
  lines.push(``);
  lines.push(`import (`);
  lines.push(`\t"bytes"`);
  lines.push(`\t"context"`);
  lines.push(`\t"encoding/json"`);
  lines.push(`\t"fmt"`);
  lines.push(`\t"io"`);
  lines.push(`\t"net/http"`);
  lines.push(`\t"net/url"`);
  lines.push(`\t"strings"`);
  lines.push(`\t"time"`);
  lines.push(`)`);
  lines.push(``);
  lines.push(`const DefaultBaseURL = "${BASE_URL}"`);
  lines.push(`const Version = "${SDK_VERSION}"`);
  lines.push(``);
  lines.push(`// Client is the Conch API client.`);
  lines.push(`type Client struct {`);
  lines.push(`\tBaseURL    string`);
  lines.push(`\tAPIKey     string`);
  lines.push(`\tHTTPClient *http.Client`);
  lines.push(`}`);
  lines.push(``);
  lines.push(`// NewClient creates a new Conch API client.`);
  lines.push(`func NewClient(apiKey string) *Client {`);
  lines.push(`\treturn &Client{`);
  lines.push(`\t\tBaseURL:    DefaultBaseURL,`);
  lines.push(`\t\tAPIKey:     apiKey,`);
  lines.push(`\t\tHTTPClient: &http.Client{Timeout: 30 * time.Second},`);
  lines.push(`\t}`);
  lines.push(`}`);
  lines.push(``);
  lines.push(`// Error represents an API error.`);
  lines.push(`type Error struct {`);
  lines.push(`\tStatus int`);
  lines.push(`\tMsg    string`);
  lines.push(`\tBody   map[string]interface{}`);
  lines.push(`}`);
  lines.push(``);
  lines.push(`func (e *Error) Error() string { return fmt.Sprintf("conch: %d %s", e.Status, e.Msg) }`);
  lines.push(``);

  // Types
  lines.push(`// ── Types ──────────────────────────────────────────────────────`);
  lines.push(``);

  lines.push(`type Memory struct {`);
  lines.push(`\tID          string   \`json:"$id"\``);
  lines.push(`\tCreatedAt   string   \`json:"$createdAt"\``);
  lines.push(`\tUpdatedAt   string   \`json:"$updatedAt"\``);
  lines.push(`\tUserID      string   \`json:"userId"\``);
  lines.push(`\tContent     string   \`json:"content"\``);
  lines.push(`\tCategory    string   \`json:"category"\``);
  lines.push(`\tTags        []string \`json:"tags"\``);
  lines.push(`\tImportance  float64  \`json:"importance"\``);
  lines.push(`\tAccessCount int      \`json:"accessCount"\``);
  lines.push(`\tIsArchived  bool     \`json:"isArchived"\``);
  lines.push(`\tNamespace   string   \`json:"namespace"\``);
  lines.push(`}`);
  lines.push(``);
  lines.push(`type Agent struct {`);
  lines.push(`\tID           string  \`json:"$id"\``);
  lines.push(`\tName         string  \`json:"name"\``);
  lines.push(`\tDescription  string  \`json:"description"\``);
  lines.push(`\tSystemPrompt string  \`json:"systemPrompt"\``);
  lines.push(`\tStatus       string  \`json:"status"\``);
  lines.push(`\tMemoryScope  string  \`json:"memoryScope"\``);
  lines.push(`\tModelID      string  \`json:"modelId"\``);
  lines.push(`\tTemperature  float64 \`json:"temperature"\``);
  lines.push(`\tMaxTokens    int     \`json:"maxTokens"\``);
  lines.push(`}`);
  lines.push(``);
  lines.push(`type ListResult[T any] struct {`);
  lines.push(`\tItems []T \`json:"memories"\` // or "agents", etc.`);
  lines.push(`\tTotal int \`json:"total"\``);
  lines.push(`\tPage  int \`json:"page"\``);
  lines.push(`\tLimit int \`json:"limit"\``);
  lines.push(`}`);
  lines.push(``);
  lines.push(`type SearchResult struct {`);
  lines.push(`\tMemory Memory \`json:"memory"\``);
  lines.push(`\tScore  float64 \`json:"score"\``);
  lines.push(`}`);
  lines.push(``);
  lines.push(`type RecallResult struct {`);
  lines.push(`\tResults []SearchResult \`json:"results"\``);
  lines.push(`\tContext string          \`json:"context"\``);
  lines.push(`}`);
  lines.push(``);

  // Memory service
  lines.push(`// ── Memory ────────────────────────────────────────────────────`);
  lines.push(``);

  lines.push(`type MemoryService struct { client *Client }`);
  lines.push(``);
  lines.push(`func (c *Client) Memory() *MemoryService { return &MemoryService{client: c} }`);
  lines.push(``);

  lines.push(`type ListMemoryParams struct {`);
  lines.push(`\tCategory  string`);
  lines.push(`\tNamespace string`);
  lines.push(`\tArchived  bool`);
  lines.push(`\tPage      int`);
  lines.push(`\tLimit     int`);
  lines.push(`}`);
  lines.push(``);
  lines.push(`func (s *MemoryService) List(ctx context.Context, params *ListMemoryParams) (*ListResult[Memory], error) {`);
  lines.push(`\tvar result ListResult[Memory]`);
  lines.push(`\tq := url.Values{}`);
  lines.push(`\tif params != nil {`);
  lines.push(`\t\tif params.Category != "" { q.Set("category", params.Category) }`);
  lines.push(`\t\tif params.Namespace != "" { q.Set("namespace", params.Namespace) }`);
  lines.push(`\t\tif params.Archived { q.Set("archived", "true") }`);
  lines.push(`\t\tif params.Page > 0 { q.Set("page", fmt.Sprintf("%d", params.Page)) }`);
  lines.push(`\t\tif params.Limit > 0 { q.Set("limit", fmt.Sprintf("%d", params.Limit)) }`);
  lines.push(`\t}`);
  lines.push(`\terr := s.client.get(ctx, "/api/memory", q, &result)`);
  lines.push(`\treturn &result, err`);
  lines.push(`}`);
  lines.push(``);

  lines.push(`type CreateMemoryParams struct {`);
  lines.push(`\tContent    string   \`json:"content"\``);
  lines.push(`\tCategory   string   \`json:"category,omitempty"\``);
  lines.push(`\tTags       []string \`json:"tags,omitempty"\``);
  lines.push(`\tImportance float64  \`json:"importance,omitempty"\``);
  lines.push(`\tSource     string   \`json:"source,omitempty"\``);
  lines.push(`\tNamespace  string   \`json:"namespace,omitempty"\``);
  lines.push(`}`);
  lines.push(``);
  lines.push(`func (s *MemoryService) Create(ctx context.Context, params *CreateMemoryParams) (*Memory, error) {`);
  lines.push(`\tif params.Category == "" { params.Category = "SEMANTIC" }`);
  lines.push(`\tif params.Namespace == "" { params.Namespace = "default" }`);
  lines.push(`\tif params.Importance == 0 { params.Importance = 0.5 }`);
  lines.push(`\tvar result struct { Memory Memory \`json:"memory"\` }`);
  lines.push(`\terr := s.client.post(ctx, "/api/memory", params, &result)`);
  lines.push(`\treturn &result.Memory, err`);
  lines.push(`}`);
  lines.push(``);

  lines.push(`func (s *MemoryService) Get(ctx context.Context, id string) (*Memory, error) {`);
  lines.push(`\tvar result struct { Memory Memory \`json:"memory"\` }`);
  lines.push(`\terr := s.client.get(ctx, "/api/memory/"+id, nil, &result)`);
  lines.push(`\treturn &result.Memory, err`);
  lines.push(`}`);
  lines.push(``);

  lines.push(`func (s *MemoryService) Delete(ctx context.Context, id string) error {`);
  lines.push(`\treturn s.client.delete(ctx, "/api/memory/"+id)`);
  lines.push(`}`);
  lines.push(``);

  lines.push(`type SearchParams struct {`);
  lines.push(`\tQuery     string  \`json:"query"\``);
  lines.push(`\tTopK      int     \`json:"topK,omitempty"\``);
  lines.push(`\tCategory  string  \`json:"category,omitempty"\``);
  lines.push(`\tMinScore  float64 \`json:"minScore,omitempty"\``);
  lines.push(`\tNamespace string  \`json:"namespace,omitempty"\``);
  lines.push(`}`);
  lines.push(``);
  lines.push(`func (s *MemoryService) Search(ctx context.Context, params *SearchParams) ([]SearchResult, error) {`);
  lines.push(`\tif params.TopK == 0 { params.TopK = 10 }`);
  lines.push(`\tif params.MinScore == 0 { params.MinScore = 0.3 }`);
  lines.push(`\tvar result struct { Results []SearchResult \`json:"results"\` }`);
  lines.push(`\terr := s.client.post(ctx, "/api/search", params, &result)`);
  lines.push(`\treturn result.Results, err`);
  lines.push(`}`);
  lines.push(``);
  lines.push(`func (s *MemoryService) Recall(ctx context.Context, params *SearchParams) (*RecallResult, error) {`);
  lines.push(`\tif params.TopK == 0 { params.TopK = 10 }`);
  lines.push(`\tif params.MinScore == 0 { params.MinScore = 0.3 }`);
  lines.push(`\tvar result RecallResult`);
  lines.push(`\terr := s.client.post(ctx, "/api/memory/recall", params, &result)`);
  lines.push(`\treturn &result, err`);
  lines.push(`}`);
  lines.push(``);

  // Agent service
  lines.push(`// ── Agents ────────────────────────────────────────────────────`);
  lines.push(``);
  lines.push(`type AgentService struct { client *Client }`);
  lines.push(`func (c *Client) Agents() *AgentService { return &AgentService{client: c} }`);
  lines.push(``);
  lines.push(`func (s *AgentService) List(ctx context.Context) ([]Agent, error) {`);
  lines.push(`\tvar result struct { Agents []Agent \`json:"agents"\` }`);
  lines.push(`\terr := s.client.get(ctx, "/api/agents", nil, &result)`);
  lines.push(`\treturn result.Agents, err`);
  lines.push(`}`);
  lines.push(``);
  lines.push(`type CreateAgentParams struct {`);
  lines.push(`\tName         string  \`json:"name"\``);
  lines.push(`\tSystemPrompt string  \`json:"systemPrompt"\``);
  lines.push(`\tDescription  string  \`json:"description,omitempty"\``);
  lines.push(`\tModelID      string  \`json:"modelId,omitempty"\``);
  lines.push(`\tMemoryScope  string  \`json:"memoryScope,omitempty"\``);
  lines.push(`\tTemperature  float64 \`json:"temperature,omitempty"\``);
  lines.push(`\tMaxTokens    int     \`json:"maxTokens,omitempty"\``);
  lines.push(`}`);
  lines.push(``);
  lines.push(`func (s *AgentService) Create(ctx context.Context, params *CreateAgentParams) (*Agent, error) {`);
  lines.push(`\tvar result struct { Agent Agent \`json:"agent"\` }`);
  lines.push(`\terr := s.client.post(ctx, "/api/agents", params, &result)`);
  lines.push(`\treturn &result.Agent, err`);
  lines.push(`}`);
  lines.push(``);
  lines.push(`func (s *AgentService) Get(ctx context.Context, id string) (*Agent, error) {`);
  lines.push(`\tvar result struct { Agent Agent \`json:"agent"\` }`);
  lines.push(`\terr := s.client.get(ctx, "/api/agents/"+id, nil, &result)`);
  lines.push(`\treturn &result.Agent, err`);
  lines.push(`}`);
  lines.push(``);
  lines.push(`func (s *AgentService) Delete(ctx context.Context, id string) error {`);
  lines.push(`\treturn s.client.delete(ctx, "/api/agents/"+id)`);
  lines.push(`}`);
  lines.push(``);

  // HTTP helpers
  lines.push(`// ── HTTP Helpers ──────────────────────────────────────────────`);
  lines.push(``);
  lines.push(`func (c *Client) get(ctx context.Context, path string, query url.Values, out interface{}) error {`);
  lines.push(`\tu := c.BaseURL + path`);
  lines.push(`\tif query != nil && len(query) > 0 {`);
  lines.push(`\t\tu += "?" + query.Encode()`);
  lines.push(`\t}`);
  lines.push(`\treq, err := http.NewRequestWithContext(ctx, "GET", u, nil)`);
  lines.push(`\tif err != nil { return err }`);
  lines.push(`\treq.Header.Set("Authorization", "Bearer "+c.APIKey)`);
  lines.push(`\treturn c.do(req, out)`);
  lines.push(`}`);
  lines.push(``);
  lines.push(`func (c *Client) post(ctx context.Context, path string, body interface{}, out interface{}) error {`);
  lines.push(`\tdata, err := json.Marshal(body)`);
  lines.push(`\tif err != nil { return err }`);
  lines.push(`\treq, err := http.NewRequestWithContext(ctx, "POST", c.BaseURL+path, bytes.NewReader(data))`);
  lines.push(`\tif err != nil { return err }`);
  lines.push(`\treq.Header.Set("Authorization", "Bearer "+c.APIKey)`);
  lines.push(`\treq.Header.Set("Content-Type", "application/json")`);
  lines.push(`\treturn c.do(req, out)`);
  lines.push(`}`);
  lines.push(``);
  lines.push(`func (c *Client) delete(ctx context.Context, path string) error {`);
  lines.push(`\treq, err := http.NewRequestWithContext(ctx, "DELETE", c.BaseURL+path, nil)`);
  lines.push(`\tif err != nil { return err }`);
  lines.push(`\treq.Header.Set("Authorization", "Bearer "+c.APIKey)`);
  lines.push(`\treturn c.do(req, nil)`);
  lines.push(`}`);
  lines.push(``);
  lines.push(`func (c *Client) do(req *http.Request, out interface{}) error {`);
  lines.push(`\tresp, err := c.HTTPClient.Do(req)`);
  lines.push(`\tif err != nil { return err }`);
  lines.push(`\tdefer resp.Body.Close()`);
  lines.push(``);
  lines.push(`\tif resp.StatusCode == 204 { return nil }`);
  lines.push(``);
  lines.push(`\tbody, _ := io.ReadAll(resp.Body)`);
  lines.push(`\tif resp.StatusCode >= 400 {`);
  lines.push(`\t\tvar errBody map[string]interface{}`);
  lines.push(`\t\tjson.Unmarshal(body, &errBody)`);
  lines.push(`\t\tmsg, _ := errBody["error"].(string)`);
  lines.push(`\t\treturn &Error{Status: resp.StatusCode, Msg: msg, Body: errBody}`);
  lines.push(`\t}`);
  lines.push(``);
  lines.push(`\tif out != nil {`);
  lines.push(`\t\treturn json.Unmarshal(body, out)`);
  lines.push(`\t}`);
  lines.push(`\treturn nil`);
  lines.push(`}`);
  lines.push(``);

  return lines.join("\n");
}

// ── Ruby Generator ───────────────────────────────────────────────────────────

function generateRuby(): string {
  const lines: string[] = [];

  lines.push(`# frozen_string_literal: true`);
  lines.push(``);
  lines.push(`# Conch SDK for Ruby`);
  lines.push(`# Auto-generated from API spec — do not edit manually.`);
  lines.push(`# Version: ${SDK_VERSION}`);
  lines.push(``);
  lines.push(`require "net/http"`);
  lines.push(`require "json"`);
  lines.push(`require "uri"`);
  lines.push(``);
  lines.push(`module Conch`);
  lines.push(`  class Error < StandardError`);
  lines.push(`    attr_reader :status, :body`);
  lines.push(``);
  lines.push(`    def initialize(status, message, body = nil)`);
  lines.push(`      super(message)`);
  lines.push(`      @status = status`);
  lines.push(`      @body = body`);
  lines.push(`    end`);
  lines.push(`  end`);
  lines.push(``);
  lines.push(`  class Client`);
  lines.push(`    BASE_URL = "${BASE_URL}"`);
  lines.push(``);
  lines.push(`    attr_accessor :api_key, :base_url`);
  lines.push(``);
  lines.push(`    def initialize(api_key:, base_url: BASE_URL)`);
  lines.push(`      @api_key = api_key`);
  lines.push(`      @base_url = base_url`);
  lines.push(`    end`);
  lines.push(``);
  lines.push(`    # ── Memory ─────────────────────────────────────────────`);
  lines.push(``);
  lines.push(`    def memory`);
  lines.push(`      @memory ||= MemoryResource.new(self)`);
  lines.push(`    end`);
  lines.push(``);
  lines.push(`    def agents`);
  lines.push(`      @agents ||= AgentResource.new(self)`);
  lines.push(`    end`);
  lines.push(``);
  lines.push(`    def search(query:, top_k: 10, **opts)`);
  lines.push(`      body = { query: query, topK: top_k }.merge(opts.compact)`);
  lines.push(`      request(:post, "/api/search", body: body)`);
  lines.push(`    end`);
  lines.push(``);
  lines.push(`    def recall(query:, top_k: 10, **opts)`);
  lines.push(`      body = { query: query, topK: top_k }.merge(opts.compact)`);
  lines.push(`      request(:post, "/api/memory/recall", body: body)`);
  lines.push(`    end`);
  lines.push(``);
  lines.push(`    def chat(message:, conversation_id: nil, agent_id: nil)`);
  lines.push(`      body = { message: message }`);
  lines.push(`      body[:conversationId] = conversation_id if conversation_id`);
  lines.push(`      body[:agentId] = agent_id if agent_id`);
  lines.push(`      request(:post, "/api/chat", body: body)`);
  lines.push(`    end`);
  lines.push(``);
  lines.push(`    # ── HTTP ───────────────────────────────────────────────`);
  lines.push(``);
  lines.push(`    def request(method, path, body: nil, params: nil)`);
  lines.push(`      uri = URI.parse(base_url + path)`);
  lines.push(`      uri.query = URI.encode_www_form(params) if params`);
  lines.push(``);
  lines.push(`      http = Net::HTTP.new(uri.host, uri.port)`);
  lines.push(`      http.use_ssl = uri.scheme == "https"`);
  lines.push(``);
  lines.push(`      req = case method`);
  lines.push(`            when :get    then Net::HTTP::Get.new(uri)`);
  lines.push(`            when :post   then Net::HTTP::Post.new(uri)`);
  lines.push(`            when :patch  then Net::HTTP::Patch.new(uri)`);
  lines.push(`            when :delete then Net::HTTP::Delete.new(uri)`);
  lines.push(`            end`);
  lines.push(``);
  lines.push(`      req["Authorization"] = "Bearer #{api_key}"`);
  lines.push(`      req["Content-Type"] = "application/json"`);
  lines.push(`      req.body = body.to_json if body`);
  lines.push(``);
  lines.push(`      res = http.request(req)`);
  lines.push(`      return nil if res.code == "204"`);
  lines.push(``);
  lines.push(`      data = JSON.parse(res.body)`);
  lines.push(`      raise Error.new(res.code.to_i, data["error"] || res.message, data) if res.code.to_i >= 400`);
  lines.push(`      data`);
  lines.push(`    end`);
  lines.push(`  end`);
  lines.push(``);
  lines.push(`  class MemoryResource`);
  lines.push(`    def initialize(client)`);
  lines.push(`      @client = client`);
  lines.push(`    end`);
  lines.push(``);
  lines.push(`    def list(**opts)`);
  lines.push(`      @client.request(:get, "/api/memory", params: opts.compact)`);
  lines.push(`    end`);
  lines.push(``);
  lines.push(`    def create(content:, **opts)`);
  lines.push(`      @client.request(:post, "/api/memory", body: { content: content }.merge(opts.compact))`);
  lines.push(`    end`);
  lines.push(``);
  lines.push(`    def get(id)`);
  lines.push(`      @client.request(:get, "/api/memory/#{id}")`);
  lines.push(`    end`);
  lines.push(``);
  lines.push(`    def update(id, **opts)`);
  lines.push(`      @client.request(:patch, "/api/memory/#{id}", body: opts.compact)`);
  lines.push(`    end`);
  lines.push(``);
  lines.push(`    def delete(id)`);
  lines.push(`      @client.request(:delete, "/api/memory/#{id}")`);
  lines.push(`    end`);
  lines.push(`  end`);
  lines.push(``);
  lines.push(`  class AgentResource`);
  lines.push(`    def initialize(client)`);
  lines.push(`      @client = client`);
  lines.push(`    end`);
  lines.push(``);
  lines.push(`    def list`);
  lines.push(`      @client.request(:get, "/api/agents")`);
  lines.push(`    end`);
  lines.push(``);
  lines.push(`    def create(name:, system_prompt:, **opts)`);
  lines.push(`      body = { name: name, systemPrompt: system_prompt }.merge(opts.compact)`);
  lines.push(`      @client.request(:post, "/api/agents", body: body)`);
  lines.push(`    end`);
  lines.push(``);
  lines.push(`    def get(id)`);
  lines.push(`      @client.request(:get, "/api/agents/#{id}")`);
  lines.push(`    end`);
  lines.push(``);
  lines.push(`    def update(id, **opts)`);
  lines.push(`      @client.request(:patch, "/api/agents/#{id}", body: opts.compact)`);
  lines.push(`    end`);
  lines.push(``);
  lines.push(`    def delete(id)`);
  lines.push(`      @client.request(:delete, "/api/agents/#{id}")`);
  lines.push(`    end`);
  lines.push(`  end`);
  lines.push(`end`);
  lines.push(``);

  return lines.join("\n");
}

// ── Rust Generator ───────────────────────────────────────────────────────────

function generateRust(): string {
  const lines: string[] = [];

  lines.push(`//! Conch SDK for Rust`);
  lines.push(`//! Auto-generated from API spec — do not edit manually.`);
  lines.push(`//! Version: ${SDK_VERSION}`);
  lines.push(``);
  lines.push(`use serde::{Deserialize, Serialize};`);
  lines.push(`use std::collections::HashMap;`);
  lines.push(``);
  lines.push(`pub const BASE_URL: &str = "${BASE_URL}";`);
  lines.push(`pub const VERSION: &str = "${SDK_VERSION}";`);
  lines.push(``);
  lines.push(`#[derive(Debug, Clone)]`);
  lines.push(`pub struct ConchError {`);
  lines.push(`    pub status: u16,`);
  lines.push(`    pub message: String,`);
  lines.push(`}`);
  lines.push(``);
  lines.push(`impl std::fmt::Display for ConchError {`);
  lines.push(`    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {`);
  lines.push(`        write!(f, "conch: {} {}", self.status, self.message)`);
  lines.push(`    }`);
  lines.push(`}`);
  lines.push(``);
  lines.push(`impl std::error::Error for ConchError {}`);
  lines.push(``);
  lines.push(`pub type Result<T> = std::result::Result<T, ConchError>;`);
  lines.push(``);

  // Types
  lines.push(`// ── Types ──────────────────────────────────────────────────────`);
  lines.push(``);
  lines.push(`#[derive(Debug, Clone, Serialize, Deserialize)]`);
  lines.push(`pub struct Memory {`);
  lines.push(`    #[serde(rename = "$id")]`);
  lines.push(`    pub id: String,`);
  lines.push(`    pub content: String,`);
  lines.push(`    pub category: String,`);
  lines.push(`    pub tags: Vec<String>,`);
  lines.push(`    pub importance: f64,`);
  lines.push(`    pub namespace: String,`);
  lines.push(`}`);
  lines.push(``);
  lines.push(`#[derive(Debug, Clone, Serialize, Deserialize)]`);
  lines.push(`pub struct Agent {`);
  lines.push(`    #[serde(rename = "$id")]`);
  lines.push(`    pub id: String,`);
  lines.push(`    pub name: String,`);
  lines.push(`    pub system_prompt: String,`);
  lines.push(`    pub status: String,`);
  lines.push(`    pub model_id: String,`);
  lines.push(`}`);
  lines.push(``);
  lines.push(`#[derive(Debug, Clone, Serialize, Deserialize)]`);
  lines.push(`pub struct SearchResult {`);
  lines.push(`    pub memory: Memory,`);
  lines.push(`    pub score: f64,`);
  lines.push(`}`);
  lines.push(``);
  lines.push(`#[derive(Debug, Clone, Serialize, Deserialize)]`);
  lines.push(`pub struct RecallResult {`);
  lines.push(`    pub results: Vec<SearchResult>,`);
  lines.push(`    pub context: String,`);
  lines.push(`}`);
  lines.push(``);
  lines.push(`#[derive(Debug, Clone, Serialize, Deserialize)]`);
  lines.push(`pub struct ListResponse<T> {`);
  lines.push(`    pub memories: Option<Vec<T>>,`);
  lines.push(`    pub agents: Option<Vec<T>>,`);
  lines.push(`    pub total: Option<u64>,`);
  lines.push(`}`);
  lines.push(``);

  // Client
  lines.push(`// ── Client ──────────────────────────────────────────────────────`);
  lines.push(``);
  lines.push(`pub struct ConchClient {`);
  lines.push(`    api_key: String,`);
  lines.push(`    base_url: String,`);
  lines.push(`    client: reqwest::Client,`);
  lines.push(`}`);
  lines.push(``);
  lines.push(`impl ConchClient {`);
  lines.push(`    pub fn new(api_key: impl Into<String>) -> Self {`);
  lines.push(`        Self {`);
  lines.push(`            api_key: api_key.into(),`);
  lines.push(`            base_url: BASE_URL.to_string(),`);
  lines.push(`            client: reqwest::Client::new(),`);
  lines.push(`        }`);
  lines.push(`    }`);
  lines.push(``);
  lines.push(`    pub fn memory(&self) -> MemoryApi<'_> { MemoryApi { client: self } }`);
  lines.push(`    pub fn agents(&self) -> AgentApi<'_> { AgentApi { client: self } }`);
  lines.push(``);
  lines.push(`    pub async fn search(&self, query: &str, top_k: Option<u32>) -> Result<Vec<SearchResult>> {`);
  lines.push(`        let mut body = HashMap::new();`);
  lines.push(`        body.insert("query", query.to_string());`);
  lines.push(`        body.insert("topK", top_k.unwrap_or(10).to_string());`);
  lines.push(`        let res: serde_json::Value = self.post("/api/search", &body).await?;`);
  lines.push(`        Ok(serde_json::from_value(res["results"].clone())?)`);
  lines.push(`    }`);
  lines.push(``);
  lines.push(`    pub async fn recall(&self, query: &str, top_k: Option<u32>) -> Result<RecallResult> {`);
  lines.push(`        let mut body = HashMap::new();`);
  lines.push(`        body.insert("query", query.to_string());`);
  lines.push(`        body.insert("topK", top_k.unwrap_or(10).to_string());`);
  lines.push(`        self.post("/api/memory/recall", &body).await`);
  lines.push(`    }`);
  lines.push(`}`);
  lines.push(``);

  // Memory API
  lines.push(`pub struct MemoryApi<'a> { client: &'a ConchClient }`);
  lines.push(``);
  lines.push(`impl<'a> MemoryApi<'a> {`);
  lines.push(`    pub async fn list(&self, params: Option<HashMap<String, String>>) -> Result<ListResponse<Memory>> {`);
  lines.push(`        self.client.get("/api/memory", params).await`);
  lines.push(`    }`);
  lines.push(``);
  lines.push(`    pub async fn create(&self, content: &str, category: Option<&str>) -> Result<Memory> {`);
  lines.push(`        let mut body = HashMap::new();`);
  lines.push(`        body.insert("content", content.to_string());`);
  lines.push(`        body.insert("category", category.unwrap_or("SEMANTIC").to_string());`);
  lines.push(`        let res: serde_json::Value = self.client.post("/api/memory", &body).await?;`);
  lines.push(`        Ok(serde_json::from_value(res["memory"].clone())?)`);
  lines.push(`    }`);
  lines.push(``);
  lines.push(`    pub async fn get(&self, id: &str) -> Result<Memory> {`);
  lines.push(`        let res: serde_json::Value = self.client.get(&format!("/api/memory/{}", id), None).await?;`);
  lines.push(`        Ok(serde_json::from_value(res["memory"].clone())?)`);
  lines.push(`    }`);
  lines.push(``);
  lines.push(`    pub async fn delete(&self, id: &str) -> Result<()> {`);
  lines.push(`        self.client.delete(&format!("/api/memory/{}", id)).await`);
  lines.push(`    }`);
  lines.push(`}`);
  lines.push(``);

  // Agent API
  lines.push(`pub struct AgentApi<'a> { client: &'a ConchClient }`);
  lines.push(``);
  lines.push(`impl<'a> AgentApi<'a> {`);
  lines.push(`    pub async fn list(&self) -> Result<Vec<Agent>> {`);
  lines.push(`        let res: serde_json::Value = self.client.get("/api/agents", None).await?;`);
  lines.push(`        Ok(serde_json::from_value(res["agents"].clone())?)`);
  lines.push(`    }`);
  lines.push(``);
  lines.push(`    pub async fn create(&self, name: &str, system_prompt: &str) -> Result<Agent> {`);
  lines.push(`        let mut body = HashMap::new();`);
  lines.push(`        body.insert("name", name.to_string());`);
  lines.push(`        body.insert("systemPrompt", system_prompt.to_string());`);
  lines.push(`        let res: serde_json::Value = self.client.post("/api/agents", &body).await?;`);
  lines.push(`        Ok(serde_json::from_value(res["agent"].clone())?)`);
  lines.push(`    }`);
  lines.push(`}`);
  lines.push(``);

  return lines.join("\n");
}

// ── Java Generator ───────────────────────────────────────────────────────────

function generateJava(): string {
  const lines: string[] = [];

  lines.push(`package com.conch.sdk;`);
  lines.push(``);
  lines.push(`/**`);
  lines.push(` * Conch SDK for Java/Kotlin`);
  lines.push(` * Auto-generated from API spec — do not edit manually.`);
  lines.push(` * Version: ${SDK_VERSION}`);
  lines.push(` */`);
  lines.push(`public class ConchClient {`);
  lines.push(`    public static final String BASE_URL = "${BASE_URL}";`);
  lines.push(`    public static final String VERSION = "${SDK_VERSION}";`);
  lines.push(``);
  lines.push(`    private final String apiKey;`);
  lines.push(`    private final String baseUrl;`);
  lines.push(``);
  lines.push(`    public ConchClient(String apiKey) {`);
  lines.push(`        this(apiKey, BASE_URL);`);
  lines.push(`    }`);
  lines.push(``);
  lines.push(`    public ConchClient(String apiKey, String baseUrl) {`);
  lines.push(`        this.apiKey = apiKey;`);
  lines.push(`        this.baseUrl = baseUrl;`);
  lines.push(`    }`);
  lines.push(``);
  lines.push(`    public MemoryApi memory() { return new MemoryApi(this); }`);
  lines.push(`    public AgentApi agents() { return new AgentApi(this); }`);
  lines.push(``);
  lines.push(`    // ── Internal ─────────────────────────────────────────`);
  lines.push(``);
  lines.push(`    String getApiKey() { return apiKey; }`);
  lines.push(`    String getBaseUrl() { return baseUrl; }`);
  lines.push(`}`);
  lines.push(``);

  // Memory API
  lines.push(`class MemoryApi {`);
  lines.push(`    private final ConchClient client;`);
  lines.push(``);
  lines.push(`    MemoryApi(ConchClient client) { this.client = client; }`);
  lines.push(``);
  lines.push(`    public Memory create(String content) {`);
  lines.push(`        // POST /api/memory`);
  lines.push(`        throw new UnsupportedOperationException("Implement with HTTP client");`);
  lines.push(`    }`);
  lines.push(``);
  lines.push(`    public Memory get(String id) {`);
  lines.push(`        // GET /api/memory/{id}`);
  lines.push(`        throw new UnsupportedOperationException("Implement with HTTP client");`);
  lines.push(`    }`);
  lines.push(`}`);
  lines.push(``);

  // Agent API
  lines.push(`class AgentApi {`);
  lines.push(`    private final ConchClient client;`);
  lines.push(``);
  lines.push(`    AgentApi(ConchClient client) { this.client = client; }`);
  lines.push(`}`);
  lines.push(``);

  return lines.join("\n");
}

// ── PHP Generator ────────────────────────────────────────────────────────────

function generatePHP(): string {
  const lines: string[] = [];

  lines.push(`<?php`);
  lines.push(`/**`);
  lines.push(` * Conch SDK for PHP`);
  lines.push(` * Auto-generated from API spec — do not edit manually.`);
  lines.push(` * Version: ${SDK_VERSION}`);
  lines.push(` */`);
  lines.push(``);
  lines.push(`namespace Conch\\SDK;`);
  lines.push(``);
  lines.push(`class Client`);
  lines.push(`{`);
  lines.push(`    public const BASE_URL = '${BASE_URL}';`);
  lines.push(``);
  lines.push(`    private string $apiKey;`);
  lines.push(`    private string $baseUrl;`);
  lines.push(``);
  lines.push(`    public function __construct(string $apiKey, string $baseUrl = self::BASE_URL)`);
  lines.push(`    {`);
  lines.push(`        $this->apiKey = $apiKey;`);
  lines.push(`        $this->baseUrl = $baseUrl;`);
  lines.push(`    }`);
  lines.push(``);
  lines.push(`    public function memory(): MemoryApi`);
  lines.push(`    {`);
  lines.push(`        return new MemoryApi($this);`);
  lines.push(`    }`);
  lines.push(``);
  lines.push(`    public function agents(): AgentApi`);
  lines.push(`    {`);
  lines.push(`        return new AgentApi($this);`);
  lines.push(`    }`);
  lines.push(``);
  lines.push(`    public function search(string $query, int $topK = 10): array`);
  lines.push(`    {`);
  lines.push(`        return $this->request('POST', '/api/search', ['query' => $query, 'topK' => $topK]);`);
  lines.push(`    }`);
  lines.push(``);
  lines.push(`    public function recall(string $query, int $topK = 10): array`);
  lines.push(`    {`);
  lines.push(`        return $this->request('POST', '/api/memory/recall', ['query' => $query, 'topK' => $topK]);`);
  lines.push(`    }`);
  lines.push(``);
  lines.push(`    public function request(string $method, string $path, ?array $body = null, ?array $params = null): array`);
  lines.push(`    {`);
  lines.push(`        $url = $this->baseUrl . $path;`);
  lines.push(`        if ($params) {`);
  lines.push(`            $url .= '?' . http_build_query($params);`);
  lines.push(`        }`);
  lines.push(``);
  lines.push(`        $ch = curl_init($url);`);
  lines.push(`        curl_setopt_array($ch, [`);
  lines.push(`            CURLOPT_RETURNTRANSFER => true,`);
  lines.push(`            CURLOPT_HTTPHEADER => [`);
  lines.push(`                'Authorization: Bearer ' . $this->apiKey,`);
  lines.push(`                'Content-Type: application/json',`);
  lines.push(`            ],`);
  lines.push(`        ]);`);
  lines.push(``);
  lines.push(`        if ($method === 'POST') {`);
  lines.push(`            curl_setopt($ch, CURLOPT_POST, true);`);
  lines.push(`            if ($body) curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body));`);
  lines.push(`        } elseif ($method === 'PATCH') {`);
  lines.push(`            curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PATCH');`);
  lines.push(`            if ($body) curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body));`);
  lines.push(`        } elseif ($method === 'DELETE') {`);
  lines.push(`            curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'DELETE');`);
  lines.push(`        }`);
  lines.push(``);
  lines.push(`        $response = curl_exec($ch);`);
  lines.push(`        $statusCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);`);
  lines.push(`        curl_close($ch);`);
  lines.push(``);
  lines.push(`        $data = json_decode($response, true);`);
  lines.push(`        if ($statusCode >= 400) {`);
  lines.push(`            throw new \\Exception($data['error'] ?? 'Request failed', $statusCode);`);
  lines.push(`        }`);
  lines.push(`        return $data;`);
  lines.push(`    }`);
  lines.push(`}`);
  lines.push(``);

  // Memory API
  lines.push(`class MemoryApi`);
  lines.push(`{`);
  lines.push(`    private Client $client;`);
  lines.push(``);
  lines.push(`    public function __construct(Client $client) { $this->client = $client; }`);
  lines.push(``);
  lines.push(`    public function list(array $params = []): array`);
  lines.push(`    {`);
  lines.push(`        return $this->client->request('GET', '/api/memory', null, $params);`);
  lines.push(`    }`);
  lines.push(``);
  lines.push(`    public function create(string $content, array $opts = []): array`);
  lines.push(`    {`);
  lines.push(`        return $this->client->request('POST', '/api/memory', array_merge(['content' => $content], $opts));`);
  lines.push(`    }`);
  lines.push(``);
  lines.push(`    public function get(string $id): array`);
  lines.push(`    {`);
  lines.push(`        return $this->client->request('GET', "/api/memory/{$id}");`);
  lines.push(`    }`);
  lines.push(``);
  lines.push(`    public function update(string $id, array $opts): array`);
  lines.push(`    {`);
  lines.push(`        return $this->client->request('PATCH', "/api/memory/{$id}", $opts);`);
  lines.push(`    }`);
  lines.push(``);
  lines.push(`    public function delete(string $id): array`);
  lines.push(`    {`);
  lines.push(`        return $this->client->request('DELETE', "/api/memory/{$id}");`);
  lines.push(`    }`);
  lines.push(`}`);
  lines.push(``);

  // Agent API
  lines.push(`class AgentApi`);
  lines.push(`{`);
  lines.push(`    private Client $client;`);
  lines.push(``);
  lines.push(`    public function __construct(Client $client) { $this->client = $client; }`);
  lines.push(``);
  lines.push(`    public function list(): array`);
  lines.push(`    {`);
  lines.push(`        return $this->client->request('GET', '/api/agents');`);
  lines.push(`    }`);
  lines.push(``);
  lines.push(`    public function create(string $name, string $systemPrompt, array $opts = []): array`);
  lines.push(`    {`);
  lines.push(`        return $this->client->request('POST', '/api/agents', array_merge(['name' => $name, 'systemPrompt' => $systemPrompt], $opts));`);
  lines.push(`    }`);
  lines.push(`}`);
  lines.push(``);
  lines.push(`?>`);
  lines.push(``);

  return lines.join("\n");
}

// ── README Generator ─────────────────────────────────────────────────────────

function generateREADME(lang: string, installCmd: string, example: string): string {
  return `# Conch SDK for ${lang}

> Auto-generated from API spec — do not edit manually.
> Version: ${SDK_VERSION}

Connect your application to [Conch](https://conchportal.com) and give AI agents persistent memory and context.

## Installation

\`\`\`bash
${installCmd}
\`\`\`

## Quick Start

\`\`\`${lang === "Python" ? "python" : lang === "Go" ? "go" : lang === "Ruby" ? "ruby" : lang === "Rust" ? "rust" : lang === "PHP" ? "php" : lang === "Java" ? "java" : "typescript"}
${example}
\`\`\`

## API Reference

| Resource | Methods |
|----------|---------|
| Memory | \`list\`, \`create\`, \`get\`, \`update\`, \`delete\`, \`search\`, \`recall\` |
| Agents | \`list\`, \`create\`, \`get\`, \`update\`, \`delete\` |
| Conversations | \`list\`, \`create\`, \`get\`, \`delete\` |
| Chat | \`send\` (streaming) |
| Wallet | \`get\`, \`link\`, \`disconnect\` |
| Subscription | \`get\`, \`confirm\` |

## Authentication

All requests require an API key. Create one at [conchportal.com/settings/api-keys](https://conchportal.com/settings/api-keys).

\`\`\`
Authorization: Bearer cnch_your_api_key
\`\`\`

## Rate Limits

- Memory operations: 20 requests/60s
- Search/Recall: 30 requests/60s
- Chat: 30 requests/60s

## Learn More

- [API Documentation](https://conchportal.com/developers/api)
- [Developer Dashboard](https://conchportal.com/developers)
- [Install Guide](https://conchportal.com/developers/install)
`;
}

// ── Main ─────────────────────────────────────────────────────────────────────

function main() {
  const outputDir = path.join(process.cwd(), "sdks");

  console.log("🔧 Conch SDK Generator");
  console.log(`   Output: ${outputDir}`);
  console.log(`   Endpoints: ${ENDPOINTS.length}`);
  console.log();

  // Create output directory
  fs.mkdirSync(outputDir, { recursive: true });

  // Generate each SDK
  const sdks: Array<{
    lang: string;
    dir: string;
    files: Array<{ name: string; content: string }>;
  }> = [
    {
      lang: "TypeScript/JavaScript",
      dir: "typescript",
      files: [
        { name: "index.ts", content: generateTypeScript() },
        {
          name: "package.json",
          content: JSON.stringify(
            {
              name: "@conch/sdk",
              version: SDK_VERSION,
              description: "Conch API SDK for JavaScript/TypeScript",
              main: "index.ts",
              types: "index.ts",
              license: "MIT",
              repository: "https://github.com/conch-ai/conch-sdk-ts",
              keywords: ["conch", "ai", "memory", "context", "sdk"],
            },
            null,
            2
          ),
        },
        {
          name: "README.md",
          content: generateREADME(
            "TypeScript",
            "npm install @conch/sdk",
            `import { ConchClient } from "@conch/sdk";

const conch = new ConchClient({ apiKey: "cnch_your_api_key" });

// Store a memory
const memory = await conch.memoryCreate({
  content: "User prefers dark roast coffee",
  category: "PREFERENCE",
});

// Search memories
const results = await conch.searchQuery({
  query: "coffee preferences",
  topK: 5,
});`
          ),
        },
      ],
    },
    {
      lang: "Python",
      dir: "python",
      files: [
        { name: "conch_sdk.py", content: generatePython() },
        {
          name: "setup.py",
          content: `from setuptools import setup

setup(
    name="conch-sdk",
    version="${SDK_VERSION}",
    description="Conch API SDK for Python",
    py_modules=["conch_sdk"],
    python_requires=">=3.8",
    install_requires=[],
    author="Conch AI",
    url="https://github.com/conch-ai/conch-sdk-python",
)`,
        },
        {
          name: "README.md",
          content: generateREADME(
            "Python",
            "pip install conch-sdk",
            `from conch_sdk import ConchClient

client = ConchClient(api_key="cnch_your_api_key")

# Store a memory
memory = client.memory.create(
    content="User prefers dark roast coffee",
    category="PREFERENCE",
)

# Search memories
results = client.memory.search(
    query="coffee preferences",
    top_k=5,
)`
          ),
        },
      ],
    },
    {
      lang: "Go",
      dir: "go",
      files: [
        { name: "conch.go", content: generateGo() },
        {
          name: "go.mod",
          content: `module github.com/conch-ai/conch-go

go 1.21

require (
    github.com/google/uuid v1.6.0
)`,
        },
        {
          name: "README.md",
          content: generateREADME(
            "Go",
            "go get github.com/conch-ai/conch-go",
            `package main

import (
    "context"
    "fmt"
    "log"

    "github.com/conch-ai/conch-go"
)

func main() {
    client := conch.NewClient("cnch_your_api_key")
    ctx := context.Background()

    // Store a memory
    memory, err := client.Memory().Create(ctx, &conch.CreateMemoryParams{
        Content:  "User prefers dark roast coffee",
        Category: "PREFERENCE",
    })
    if err != nil {
        log.Fatal(err)
    }
    fmt.Printf("Stored: %s\\n", memory.ID)
}`
          ),
        },
      ],
    },
    {
      lang: "Ruby",
      dir: "ruby",
      files: [
        { name: "lib/conch.rb", content: generateRuby() },
        {
          name: "conch-sdk.gemspec",
          content: `Gem::Specification.new do |s|
  s.name = "conch-sdk"
  s.version = "${SDK_VERSION}"
  s.summary = "Conch API SDK for Ruby"
  s.authors = ["Conch AI"]
  s.files = ["lib/conch.rb"]
  s.required_ruby_version = ">= 3.0"
end`,
        },
        {
          name: "README.md",
          content: generateREADME(
            "Ruby",
            "gem install conch-sdk",
            `require "conch"

client = Conch::Client.new(api_key: "cnch_your_api_key")

# Store a memory
memory = client.memory.create(
  content: "User prefers dark roast coffee",
  category: "PREFERENCE",
)

# Search memories
results = client.search(
  query: "coffee preferences",
  top_k: 5,
)`
          ),
        },
      ],
    },
    {
      lang: "Rust",
      dir: "rust",
      files: [
        { name: "src/lib.rs", content: generateRust() },
        {
          name: "Cargo.toml",
          content: `[package]
name = "conch-sdk"
version = "${SDK_VERSION}"
edition = "2021"
description = "Conch API SDK for Rust"

[dependencies]
reqwest = { version = "0.12", features = ["json"] }
serde = { version = "1", features = ["derive"] }
serde_json = "1"
tokio = { version = "1", features = ["full"] }`,
        },
        {
          name: "README.md",
          content: generateREADME(
            "Rust",
            "cargo add conch-sdk",
            `use conch_sdk::{ConchClient, Memory};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let client = ConchClient::new("cnch_your_api_key");

    // Store a memory
    let memory = client.memory()
        .create("User prefers dark roast coffee", Some("PREFERENCE"))
        .await?;

    println!("Stored: {}", memory.id);
    Ok(())
}`
          ),
        },
      ],
    },
    {
      lang: "Java",
      dir: "java",
      files: [
        { name: "src/main/java/com/conch/sdk/ConchClient.java", content: generateJava() },
        {
          name: "build.gradle",
          content: `plugins {
    id 'java-library'
}

group = 'com.conch'
version = '${SDK_VERSION}'

repositories {
    mavenCentral()
}

dependencies {
    implementation 'com.google.code.gson:gson:2.10.1'
}`,
        },
        {
          name: "README.md",
          content: generateREADME(
            "Java",
            "implementation 'com.conch:sdk:1.0.0'",
            `import com.conch.sdk.ConchClient;

ConchClient client = new ConchClient("cnch_your_api_key");

// Store a memory
Memory memory = client.memory().create("User prefers dark roast coffee");

// Search
List<SearchResult> results = client.search("coffee preferences", 5);`
          ),
        },
      ],
    },
    {
      lang: "PHP",
      dir: "php",
      files: [
        { name: "src/Client.php", content: generatePHP() },
        {
          name: "composer.json",
          content: JSON.stringify(
            {
              name: "conch/sdk",
              description: "Conch API SDK for PHP",
              type: "library",
              license: "MIT",
              require: { php: ">=8.1" },
              autoload: { psr: { "Conch\\SDK\\": "src/" } },
            },
            null,
            2
          ),
        },
        {
          name: "README.md",
          content: generateREADME(
            "PHP",
            "composer require conch/sdk",
            `<?php
use Conch\\SDK\\Client;

$client = new Client("cnch_your_api_key");

// Store a memory
$memory = $client->memory()->create("User prefers dark roast coffee", [
    "category" => "PREFERENCE",
]);

// Search
$results = $client->search("coffee preferences", 5);`
          ),
        },
      ],
    },
  ];

  let totalFiles = 0;

  for (const sdk of sdks) {
    const sdkDir = path.join(outputDir, sdk.dir);
    fs.mkdirSync(sdkDir, { recursive: true });

    // Create nested directories for Java/Go/Ruby
    for (const file of sdk.files) {
      const filePath = path.join(sdkDir, file.name);
      const dir = path.dirname(filePath);
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(filePath, file.content, "utf-8");
      totalFiles++;
    }

    console.log(`✅ ${sdk.lang} → sdks/${sdk.dir}/`);
  }

  console.log();
  console.log(`🎉 Generated ${totalFiles} files across ${sdks.length} languages`);
  console.log();
  console.log("Next steps:");
  console.log("  1. Review generated code in sdks/");
  console.log("  2. Add tests for each SDK");
  console.log("  3. Publish to package registries (npm, PyPI, crates.io, etc.)");
  console.log("  4. Add CI/CD for automated releases");
}

main();
