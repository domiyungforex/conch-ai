// Single source of truth for the /developers API reference + live console.
// Kept in sync by hand with the Zod schemas in validators.ts and the route
// handlers themselves — there is no runtime introspection.

export type FieldKind = "string" | "number" | "boolean" | "enum" | "tags" | "textarea";

export interface FieldSpec {
  name: string;
  kind: FieldKind;
  in: "path" | "query" | "body";
  required?: boolean;
  default?: string | number | boolean;
  enumValues?: string[];
  placeholder?: string;
  description: string;
}

export type AuthRequirement = "read" | "write" | "chat" | "session";

export interface EndpointSpec {
  id: string;
  group: string;
  method: "GET" | "POST" | "PATCH" | "DELETE";
  path: string; // template, e.g. /api/memory/{id}
  title: string;
  description: string;
  auth: AuthRequirement;
  rateLimit?: string;
  fields: FieldSpec[];
  responseShape: string;
  streaming?: boolean;
}

export const GROUPS = ["Memory", "Search", "Chat", "Agents", "Conversations", "API Keys"] as const;

const MEMORY_CATEGORY_VALUES = ["EPISODIC", "SEMANTIC", "PREFERENCE", "PROCEDURAL"];

export const ENDPOINTS: EndpointSpec[] = [
  // ── Memory ──────────────────────────────────────────────────────────
  {
    id: "memory-list",
    group: "Memory",
    method: "GET",
    path: "/api/memory",
    title: "List memories",
    description: "Page through the caller's stored memories, newest first. Filter by category or archived state.",
    auth: "read",
    fields: [
      { name: "category", kind: "enum", in: "query", enumValues: MEMORY_CATEGORY_VALUES, description: "Restrict to one memory category." },
      { name: "archived", kind: "boolean", in: "query", default: false, description: "true to list archived memories instead of active ones." },
      { name: "page", kind: "number", in: "query", default: 1, description: "1-indexed page number." },
      { name: "limit", kind: "number", in: "query", default: 20, description: "Page size, capped at 100." },
    ],
    responseShape: `{
  "memories": [{
    "$id": "string", "$createdAt": "ISO 8601", "$updatedAt": "ISO 8601",
    "userId": "string", "content": "string",
    "category": "EPISODIC" | "SEMANTIC" | "PREFERENCE" | "PROCEDURAL",
    "tags": ["string"], "importance": 0.0, "accessCount": 0,
    "lastAccessed": "ISO 8601 | null", "source": "string | null",
    "agentId": "string | null", "isArchived": false
  }],
  "total": 0, "page": 1, "limit": 20
}`,
  },
  {
    id: "memory-create",
    group: "Memory",
    method: "POST",
    path: "/api/memory",
    title: "Create a memory",
    description: "Save a new memory. Embeddings are generated automatically (Voyage AI voyage-3.5) so it's searchable immediately.",
    auth: "write",
    rateLimit: "20 requests / 60s per caller",
    fields: [
      { name: "content", kind: "textarea", in: "body", required: true, placeholder: "The user prefers dark roast coffee, no sugar.", description: "The memory text (max 5000 chars)." },
      { name: "category", kind: "enum", in: "body", enumValues: MEMORY_CATEGORY_VALUES, default: "SEMANTIC", description: "EPISODIC (events), SEMANTIC (facts), PREFERENCE, or PROCEDURAL (how-to)." },
      { name: "tags", kind: "tags", in: "body", placeholder: "coffee, preferences", description: "Comma-separated tags (max 10)." },
      { name: "importance", kind: "number", in: "body", default: 0.5, description: "0 to 1. Used as a tiebreaker in similarity ranking." },
      { name: "source", kind: "string", in: "body", placeholder: "onboarding-form", description: "Optional free-text origin label." },
    ],
    responseShape: `{ "memory": { /* full memory document, see List memories */ } }  — 201 Created`,
  },
  {
    id: "memory-get",
    group: "Memory",
    method: "GET",
    path: "/api/memory/{id}",
    title: "Get a memory",
    description: "Fetch a single memory by ID. Returns 404 if it doesn't exist or belongs to another user.",
    auth: "read",
    fields: [
      { name: "id", kind: "string", in: "path", required: true, placeholder: "68f2c1a9000b1e...", description: "The memory's $id." },
    ],
    responseShape: `{ "memory": { /* full memory document */ } }`,
  },
  {
    id: "memory-update",
    group: "Memory",
    method: "PATCH",
    path: "/api/memory/{id}",
    title: "Update a memory",
    description: "Partial update. Editing content re-generates the embedding so search stays accurate.",
    auth: "write",
    fields: [
      { name: "id", kind: "string", in: "path", required: true, placeholder: "68f2c1a9000b1e...", description: "The memory's $id." },
      { name: "content", kind: "textarea", in: "body", description: "New memory text (max 5000 chars)." },
      { name: "category", kind: "enum", in: "body", enumValues: MEMORY_CATEGORY_VALUES, description: "New category." },
      { name: "tags", kind: "tags", in: "body", placeholder: "coffee, preferences", description: "Replaces the full tag list." },
      { name: "importance", kind: "number", in: "body", description: "0 to 1." },
      { name: "isArchived", kind: "boolean", in: "body", description: "Archive or restore this memory." },
    ],
    responseShape: `{ "memory": { /* updated memory document */ } }`,
  },
  {
    id: "memory-delete",
    group: "Memory",
    method: "DELETE",
    path: "/api/memory/{id}",
    title: "Delete a memory",
    description: "Permanently deletes the memory and decrements the caller's reputation memory count.",
    auth: "write",
    fields: [
      { name: "id", kind: "string", in: "path", required: true, placeholder: "68f2c1a9000b1e...", description: "The memory's $id." },
    ],
    responseShape: `{ "success": true }`,
  },

  // ── Search ──────────────────────────────────────────────────────────
  {
    id: "search-query",
    group: "Search",
    method: "POST",
    path: "/api/search",
    title: "Semantic search",
    description: "Embeds the query with Voyage AI and ranks the caller's memories by cosine similarity, blended with importance as a tiebreaker.",
    auth: "read",
    rateLimit: "30 requests / 60s per caller",
    fields: [
      { name: "query", kind: "string", in: "body", required: true, placeholder: "what does the user drink", description: "Natural-language search text (max 500 chars)." },
      { name: "topK", kind: "number", in: "body", default: 10, description: "Max results to return, 1 to 20." },
      { name: "category", kind: "enum", in: "body", enumValues: MEMORY_CATEGORY_VALUES, description: "Restrict to one memory category." },
      { name: "minScore", kind: "number", in: "body", default: 0.3, description: "Minimum cosine similarity, 0 to 1." },
    ],
    responseShape: `{
  "results": [{ "memory": { /* memory document */ }, "score": 0.0 }]
}`,
  },

  // ── Chat ────────────────────────────────────────────────────────────
  {
    id: "chat-send",
    group: "Chat",
    method: "POST",
    path: "/api/chat",
    title: "Send a chat message",
    description:
      "Streams a Claude response in real time. The model can call tools — saveMemory, searchMemory, listMemories, forgetMemory, calculate — mid-response. Creates a conversation automatically if conversationId is omitted.",
    auth: "chat",
    rateLimit: "30 requests / 60s per caller · 60s max duration",
    streaming: true,
    fields: [
      { name: "message", kind: "textarea", in: "body", required: true, placeholder: "What do you remember about my coffee order?", description: "The user message (max 10,000 chars)." },
      { name: "conversationId", kind: "string", in: "body", placeholder: "leave blank to start a new conversation", description: "Continue an existing conversation." },
      { name: "agentId", kind: "string", in: "body", placeholder: "leave blank for the default assistant", description: "Route through a specific agent's persona/model/tools." },
    ],
    responseShape: `Response body: text/plain stream of lines "0:\\"<chunk>\\"\\n" (one JSON-encoded text delta per line — same
wire format as the Vercel AI SDK data stream). Concatenate the decoded chunks in order for the full reply.

Header: X-Conversation-Id — the conversation this message belongs to (new or existing).`,
  },

  // ── Agents ──────────────────────────────────────────────────────────
  {
    id: "agents-list",
    group: "Agents",
    method: "GET",
    path: "/api/agents",
    title: "List agents",
    description: "Lists the caller's non-archived agents, most recently updated first (max 50).",
    auth: "read",
    fields: [],
    responseShape: `{
  "agents": [{
    "$id": "string", "$createdAt": "ISO 8601", "$updatedAt": "ISO 8601",
    "userId": "string", "name": "string", "description": "string | null",
    "systemPrompt": "string", "avatarUrl": "string | null",
    "status": "ACTIVE" | "PAUSED" | "ARCHIVED", "memoryScope": "user" | "agent" | "global",
    "modelId": "string", "temperature": 0.7, "maxTokens": 2000
  }]
}`,
  },
  {
    id: "agents-create",
    group: "Agents",
    method: "POST",
    path: "/api/agents",
    title: "Create an agent",
    description: "Creates a custom assistant persona with its own system prompt, model, and memory scope.",
    auth: "write",
    fields: [
      { name: "name", kind: "string", in: "body", required: true, placeholder: "Support Bot", description: "Display name (max 100 chars)." },
      { name: "description", kind: "string", in: "body", placeholder: "Handles tier-1 customer questions", description: "Optional short description (max 500 chars)." },
      { name: "systemPrompt", kind: "textarea", in: "body", required: true, placeholder: "You are a concise, friendly support agent for...", description: "The agent's system prompt (max 4000 chars)." },
      { name: "modelId", kind: "string", in: "body", placeholder: "claude-haiku-4-5-20251001", description: "Anthropic model ID. Defaults to Haiku." },
      { name: "memoryScope", kind: "enum", in: "body", enumValues: ["user", "agent", "global"], default: "user", description: "Which memories this agent can draw on." },
      { name: "temperature", kind: "number", in: "body", default: 0.7, description: "0 to 2." },
      { name: "maxTokens", kind: "number", in: "body", default: 2000, description: "100 to 4000." },
    ],
    responseShape: `{ "agent": { /* full agent document */ } }  — 201 Created`,
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
      { name: "id", kind: "string", in: "path", required: true, placeholder: "68f2c1a9000b1e...", description: "The agent's $id." },
    ],
    responseShape: `{ "agent": { /* full agent document */ } }`,
  },
  {
    id: "agents-update",
    group: "Agents",
    method: "PATCH",
    path: "/api/agents/{id}",
    title: "Update an agent",
    description: "Partial update — any subset of the create fields, plus status.",
    auth: "write",
    fields: [
      { name: "id", kind: "string", in: "path", required: true, placeholder: "68f2c1a9000b1e...", description: "The agent's $id." },
      { name: "name", kind: "string", in: "body", description: "New display name." },
      { name: "systemPrompt", kind: "textarea", in: "body", description: "New system prompt." },
      { name: "status", kind: "enum", in: "body", enumValues: ["ACTIVE", "PAUSED", "ARCHIVED"], description: "Pause or archive the agent." },
      { name: "temperature", kind: "number", in: "body", description: "0 to 2." },
      { name: "maxTokens", kind: "number", in: "body", description: "100 to 4000." },
    ],
    responseShape: `{ "agent": { /* updated agent document */ } }`,
  },
  {
    id: "agents-delete",
    group: "Agents",
    method: "DELETE",
    path: "/api/agents/{id}",
    title: "Archive an agent",
    description: "Soft-delete: sets status to ARCHIVED rather than removing the document.",
    auth: "write",
    fields: [
      { name: "id", kind: "string", in: "path", required: true, placeholder: "68f2c1a9000b1e...", description: "The agent's $id." },
    ],
    responseShape: `{ "success": true }`,
  },

  // ── Conversations ───────────────────────────────────────────────────
  {
    id: "conversations-list",
    group: "Conversations",
    method: "GET",
    path: "/api/conversations",
    title: "List conversations",
    description: "Page through the caller's conversations, most recently updated first.",
    auth: "read",
    fields: [
      { name: "page", kind: "number", in: "query", default: 1, description: "1-indexed page number." },
      { name: "limit", kind: "number", in: "query", default: 20, description: "Page size, capped at 50." },
    ],
    responseShape: `{
  "conversations": [{
    "$id": "string", "$createdAt": "ISO 8601", "$updatedAt": "ISO 8601",
    "userId": "string", "agentId": "string | null", "title": "string", "summary": "string | null"
  }],
  "total": 0, "page": 1, "limit": 20
}`,
  },
  {
    id: "conversations-create",
    group: "Conversations",
    method: "POST",
    path: "/api/conversations",
    title: "Create a conversation",
    description: "Creates an empty conversation shell. Usually unnecessary — POST /api/chat creates one automatically on first message.",
    auth: "write",
    fields: [
      { name: "title", kind: "string", in: "body", placeholder: "New Conversation", description: "Optional title (max 200 chars)." },
      { name: "agentId", kind: "string", in: "body", placeholder: "leave blank for the default assistant", description: "Optional agent to attach." },
    ],
    responseShape: `{ "conversation": { /* full conversation document */ } }  — 201 Created`,
  },
  {
    id: "conversations-get",
    group: "Conversations",
    method: "GET",
    path: "/api/conversations/{id}",
    title: "Get a conversation",
    description: "Fetch a conversation with its full message history (up to 500 messages) and attached agent summary.",
    auth: "read",
    fields: [
      { name: "id", kind: "string", in: "path", required: true, placeholder: "68f2c1a9000b1e...", description: "The conversation's $id." },
    ],
    responseShape: `{
  "conversation": {
    "$id": "string", "userId": "string", "agentId": "string | null", "title": "string", "summary": "string | null",
    "messages": [{ "$id": "string", "conversationId": "string", "role": "user" | "assistant", "content": "string", "tokensUsed": "number | null", "memoryIds": ["string"] }],
    "agent": { "$id": "string", "name": "string", "avatarUrl": "string | null" } | null
  }
}`,
  },
  {
    id: "conversations-delete",
    group: "Conversations",
    method: "DELETE",
    path: "/api/conversations/{id}",
    title: "Delete a conversation",
    description: "Permanently deletes the conversation and cascades to all of its messages.",
    auth: "write",
    fields: [
      { name: "id", kind: "string", in: "path", required: true, placeholder: "68f2c1a9000b1e...", description: "The conversation's $id." },
    ],
    responseShape: `{ "success": true }`,
  },

  // ── API Keys ────────────────────────────────────────────────────────
  {
    id: "apikeys-list",
    group: "API Keys",
    method: "GET",
    path: "/api/api-keys",
    title: "List API keys",
    description: "Lists the caller's active (non-revoked) API keys. Never returns the raw key, only its prefix.",
    auth: "session",
    fields: [],
    responseShape: `{
  "apiKeys": [{
    "$id": "string", "userId": "string", "name": "string", "keyPrefix": "cnch_ab12cd34",
    "scope": "FULL" | "MEMORY_READ" | "MEMORY_WRITE" | "CHAT",
    "lastUsedAt": "ISO 8601 | null", "expiresAt": "ISO 8601 | null", "isRevoked": false
  }]
}`,
  },
  {
    id: "apikeys-create",
    group: "API Keys",
    method: "POST",
    path: "/api/api-keys",
    title: "Create an API key",
    description: "Mints a new key. The raw key is only ever returned once, in this response — store it immediately.",
    auth: "session",
    fields: [
      { name: "name", kind: "string", in: "body", required: true, placeholder: "My App", description: "Label to identify this key later (max 100 chars)." },
      { name: "scope", kind: "enum", in: "body", enumValues: ["FULL", "MEMORY_READ", "MEMORY_WRITE", "CHAT"], default: "FULL", description: "Access level — see the Authentication section." },
      { name: "expiresAt", kind: "string", in: "body", placeholder: "2027-01-01T00:00:00Z", description: "Optional ISO 8601 expiry." },
    ],
    responseShape: `{ "apiKey": { /* key metadata, no hash */ }, "fullKey": "cnch_...(shown once)..." }  — 201 Created`,
  },
  {
    id: "apikeys-delete",
    group: "API Keys",
    method: "DELETE",
    path: "/api/api-keys/{id}",
    title: "Revoke an API key",
    description: "Immediately invalidates the key. Requests already in flight may still complete.",
    auth: "session",
    fields: [
      { name: "id", kind: "string", in: "path", required: true, placeholder: "68f2c1a9000b1e...", description: "The key's $id (not the raw key)." },
    ],
    responseShape: `{ "success": true }`,
  },
];

export function endpointsByGroup(group: string): EndpointSpec[] {
  return ENDPOINTS.filter((e) => e.group === group);
}
