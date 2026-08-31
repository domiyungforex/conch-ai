"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Code2,
  Copy,
  Check,
  Package,
  BookOpen,
  Zap,
  Search,
  MessageSquare,
  Users,
  CreditCard,
  Key,
  ExternalLink,
  ChevronRight,
  FileCode,
  Terminal,
} from "lucide-react";
import { GlassCard } from "@/components/shared/GlassCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ── Code Block Component ─────────────────────────────────────────────────────

function CodeBlock({ code, language, title }: { code: string; language: string; title?: string }) {
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group">
      {title && (
        <div className="flex items-center justify-between px-4 py-2 bg-white/5 border border-white/8 border-b-0 rounded-t-xl">
          <span className="text-xs font-medium text-slate-400">{title}</span>
          <Badge className="bg-white/10 text-slate-300 border-white/10 text-[10px]">
            {language}
          </Badge>
        </div>
      )}
      <div className="relative">
        <pre
          className={cn(
            "text-xs font-mono text-slate-300 bg-black/40 border border-white/8 overflow-x-auto whitespace-pre-wrap max-h-[500px] overflow-y-auto",
            title ? "rounded-b-xl p-4" : "rounded-xl p-4"
          )}
        >
          {code}
        </pre>
        <button
          onClick={copyCode}
          className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/20"
          title="Copy code"
        >
          {copied ? (
            <Check className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <Copy className="w-3.5 h-3.5 text-slate-400" />
          )}
        </button>
      </div>
    </div>
  );
}

// ── Navigation ───────────────────────────────────────────────────────────────

const NAV_SECTIONS = [
  {
    title: "Getting Started",
    items: [
      { id: "installation", label: "Installation", icon: Package },
      { id: "quickstart", label: "Quick Start", icon: Zap },
      { id: "authentication", label: "Authentication", icon: Key },
    ],
  },
  {
    title: "Core Concepts",
    items: [
      { id: "memory", label: "Memory", icon: FileCode },
      { id: "search", label: "Search", icon: Search },
      { id: "chat", label: "Chat", icon: MessageSquare },
      { id: "agents", label: "Agents", icon: Users },
    ],
  },
  {
    title: "API Reference",
    items: [
      { id: "types", label: "Types", icon: Code2 },
      { id: "errors", label: "Error Handling", icon: FileCode },
      { id: "ratelimits", label: "Rate Limits", icon: Zap },
    ],
  },
];

function SidebarNav({ activeSection }: { activeSection: string }) {
  return (
    <nav className="space-y-6">
      {NAV_SECTIONS.map((section) => (
        <div key={section.title}>
          <h3 className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2 px-3">
            {section.title}
          </h3>
          <div className="space-y-0.5">
            {section.items.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-colors",
                  activeSection === item.id
                    ? "bg-coral-600/20 text-coral-300"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                )}
              >
                <item.icon className="w-3.5 h-3.5" />
                {item.label}
              </a>
            ))}
          </div>
        </div>
      ))}
    </nav>
  );
}

// ── SDK Methods Reference ────────────────────────────────────────────────────

const SDK_METHODS = [
  {
    category: "Memory",
    methods: [
      {
        name: "createMemory",
        signature: "createMemory(options: MemoryCreateOptions): Promise<Memory>",
        description: "Create a new memory. Embeddings are generated automatically.",
        params: [
          { name: "content", type: "string", required: true, description: "The memory content" },
          { name: "category", type: "MemoryCategory", required: false, description: "EPISODIC, SEMANTIC, PREFERENCE, or PROCEDURAL" },
          { name: "tags", type: "string[]", required: false, description: "Tags for categorization" },
          { name: "importance", type: "number", required: false, description: "0-1 importance score" },
          { name: "source", type: "string", required: false, description: "Source of the memory" },
          { name: "namespace", type: "string", required: false, description: "Namespace for isolation" },
        ],
        example: `const memory = await conch.createMemory({
  content: "User prefers dark roast coffee",
  category: "PREFERENCE",
  tags: ["coffee", "preferences"],
  importance: 0.8,
});`,
      },
      {
        name: "listMemories",
        signature: "listMemories(options?: ListMemoriesOptions): Promise<{ memories: Memory[]; total: number }>",
        description: "List memories with optional filtering and pagination.",
        params: [
          { name: "category", type: "MemoryCategory", required: false, description: "Filter by category" },
          { name: "namespace", type: "string", required: false, description: "Filter by namespace" },
          { name: "archived", type: "boolean", required: false, description: "Include archived memories" },
          { name: "page", type: "number", required: false, description: "Page number" },
          { name: "limit", type: "number", required: false, description: "Items per page" },
        ],
        example: `const { memories, total } = await conch.listMemories({
  category: "PREFERENCE",
  limit: 10,
});`,
      },
      {
        name: "getMemory",
        signature: "getMemory(id: string): Promise<Memory>",
        description: "Get a single memory by ID.",
        params: [
          { name: "id", type: "string", required: true, description: "Memory ID" },
        ],
        example: `const memory = await conch.getMemory("mem_abc123");`,
      },
      {
        name: "updateMemory",
        signature: "updateMemory(id: string, options: MemoryUpdateOptions): Promise<Memory>",
        description: "Update a memory. Editing content re-generates the embedding.",
        params: [
          { name: "id", type: "string", required: true, description: "Memory ID" },
          { name: "content", type: "string", required: false, description: "New content" },
          { name: "category", type: "MemoryCategory", required: false, description: "New category" },
          { name: "tags", type: "string[]", required: false, description: "New tags" },
          { name: "importance", type: "number", required: false, description: "New importance" },
          { name: "isArchived", type: "boolean", required: false, description: "Archive status" },
        ],
        example: `await conch.updateMemory("mem_abc123", {
  content: "Updated memory content",
  importance: 0.9,
});`,
      },
      {
        name: "deleteMemory",
        signature: "deleteMemory(id: string): Promise<void>",
        description: "Permanently delete a memory.",
        params: [
          { name: "id", type: "string", required: true, description: "Memory ID" },
        ],
        example: `await conch.deleteMemory("mem_abc123");`,
      },
      {
        name: "exportMemories",
        signature: "exportMemories(options?: { includeArchived?: boolean }): Promise<{ memories: Memory[] }>",
        description: "Export all memories as JSON.",
        params: [
          { name: "includeArchived", type: "boolean", required: false, description: "Include archived memories" },
        ],
        example: `const { memories } = await conch.exportMemories({
  includeArchived: false,
});`,
      },
    ],
  },
  {
    category: "Search",
    methods: [
      {
        name: "search",
        signature: "search(options: SearchOptions): Promise<{ results: Array<{ memory: Memory; score: number }> }>",
        description: "Semantic search using cosine similarity.",
        params: [
          { name: "query", type: "string", required: true, description: "Search query" },
          { name: "topK", type: "number", required: false, description: "Number of results (default: 5)" },
          { name: "category", type: "MemoryCategory", required: false, description: "Filter by category" },
          { name: "minScore", type: "number", required: false, description: "Minimum similarity score" },
          { name: "namespace", type: "string", required: false, description: "Filter by namespace" },
        ],
        example: `const { results } = await conch.search({
  query: "coffee preferences",
  topK: 5,
  minScore: 0.7,
});

results.forEach(({ memory, score }) => {
  console.log(\`\${score.toFixed(2)}: \${memory.content}\`);
});`,
      },
      {
        name: "recall",
        signature: "recall(options: RecallOptions): Promise<{ context: string; memories: Memory[] }>",
        description: "Get AI-ready context block for injection into prompts.",
        params: [
          { name: "query", type: "string", required: true, description: "Context query" },
          { name: "topK", type: "number", required: false, description: "Number of memories" },
          { name: "category", type: "MemoryCategory", required: false, description: "Filter by category" },
          { name: "minScore", type: "number", required: false, description: "Minimum score" },
          { name: "namespace", type: "string", required: false, description: "Filter by namespace" },
        ],
        example: `const { context } = await conch.recall({
  query: "What does the user like to drink?",
});

// Use in your AI prompt
const prompt = \`
Context about the user:
\${context}

Answer the user's question based on this context.
\`;`,
      },
    ],
  },
  {
    category: "Chat",
    methods: [
      {
        name: "chat",
        signature: "chat(message: string, options?: ChatOptions): Promise<Response>",
        description: "Send a chat message and receive a streaming response.",
        params: [
          { name: "message", type: "string", required: true, description: "Message to send" },
          { name: "conversationId", type: "string", required: false, description: "Continue existing conversation" },
          { name: "agentId", type: "string", required: false, description: "Use a specific agent" },
        ],
        example: `const response = await conch.chat("Hello!", {
  conversationId: "conv_abc123",
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  process.stdout.write(decoder.decode(value));
}`,
      },
    ],
  },
  {
    category: "Agents",
    methods: [
      {
        name: "createAgent",
        signature: "createAgent(options: AgentCreateOptions): Promise<Agent>",
        description: "Create a custom AI agent persona.",
        params: [
          { name: "name", type: "string", required: true, description: "Agent name" },
          { name: "systemPrompt", type: "string", required: true, description: "System prompt" },
          { name: "description", type: "string", required: false, description: "Agent description" },
          { name: "modelId", type: "string", required: false, description: "AI model to use" },
          { name: "memoryScope", type: "MemoryScope", required: false, description: "user, agent, or global" },
          { name: "temperature", type: "number", required: false, description: "0-1 temperature" },
          { name: "maxTokens", type: "number", required: false, description: "Max response tokens" },
        ],
        example: `const agent = await conch.createAgent({
  name: "Code Assistant",
  systemPrompt: "You are a helpful coding assistant.",
  modelId: "claude-3-5-sonnet",
  temperature: 0.7,
});`,
      },
      {
        name: "listAgents",
        signature: "listAgents(): Promise<Agent[]>",
        description: "List all non-archived agents.",
        params: [],
        example: `const agents = await conch.listAgents();
console.log(\`You have \${agents.length} agents\`);`,
      },
      {
        name: "getAgent",
        signature: "getAgent(id: string): Promise<Agent>",
        description: "Get an agent by ID.",
        params: [
          { name: "id", type: "string", required: true, description: "Agent ID" },
        ],
        example: `const agent = await conch.getAgent("agent_abc123");`,
      },
      {
        name: "updateAgent",
        signature: "updateAgent(id: string, options: AgentUpdateOptions): Promise<Agent>",
        description: "Update an agent's properties.",
        params: [
          { name: "id", type: "string", required: true, description: "Agent ID" },
          { name: "name", type: "string", required: false, description: "New name" },
          { name: "systemPrompt", type: "string", required: false, description: "New system prompt" },
          { name: "status", type: "AgentStatus", required: false, description: "ACTIVE, PAUSED, or ARCHIVED" },
          { name: "temperature", type: "number", required: false, description: "New temperature" },
          { name: "maxTokens", type: "number", required: false, description: "New max tokens" },
        ],
        example: `await conch.updateAgent("agent_abc123", {
  temperature: 0.5,
  status: "PAUSED",
});`,
      },
      {
        name: "deleteAgent",
        signature: "deleteAgent(id: string): Promise<void>",
        description: "Archive an agent (soft-delete).",
        params: [
          { name: "id", type: "string", required: true, description: "Agent ID" },
        ],
        example: `await conch.deleteAgent("agent_abc123");`,
      },
    ],
  },
  {
    category: "Conversations",
    methods: [
      {
        name: "createConversation",
        signature: "createConversation(options?: { title?: string; agentId?: string }): Promise<Conversation>",
        description: "Create a new conversation.",
        params: [
          { name: "title", type: "string", required: false, description: "Conversation title" },
          { name: "agentId", type: "string", required: false, description: "Associate with an agent" },
        ],
        example: `const conv = await conch.createConversation({
  title: "Support Chat",
  agentId: "agent_abc123",
});`,
      },
      {
        name: "listConversations",
        signature: "listConversations(options?: { page?: number; limit?: number }): Promise<{ conversations: Conversation[]; total: number }>",
        description: "List conversations with pagination.",
        params: [
          { name: "page", type: "number", required: false, description: "Page number" },
          { name: "limit", type: "number", required: false, description: "Items per page" },
        ],
        example: `const { conversations, total } = await conch.listConversations({
  limit: 20,
});`,
      },
      {
        name: "getConversation",
        signature: "getConversation(id: string): Promise<Conversation & { messages: Message[] }>",
        description: "Get a conversation with full message history.",
        params: [
          { name: "id", type: "string", required: true, description: "Conversation ID" },
        ],
        example: `const conv = await conch.getConversation("conv_abc123");
console.log(\`Messages: \${conv.messages.length}\`);`,
      },
      {
        name: "deleteConversation",
        signature: "deleteConversation(id: string): Promise<void>",
        description: "Delete a conversation and its messages.",
        params: [
          { name: "id", type: "string", required: true, description: "Conversation ID" },
        ],
        example: `await conch.deleteConversation("conv_abc123");`,
      },
    ],
  },
  {
    category: "API Keys",
    methods: [
      {
        name: "createApiKey",
        signature: "createApiKey(name: string, options?: { scope?: ApiKeyScope; expiresAt?: string }): Promise<ApiKey & { rawKey?: string }>",
        description: "Create a new API key. Raw key shown once.",
        params: [
          { name: "name", type: "string", required: true, description: "Key name" },
          { name: "scope", type: "ApiKeyScope", required: false, description: "FULL, MEMORY_READ, MEMORY_WRITE, or CHAT" },
          { name: "expiresAt", type: "string", required: false, description: "Expiration date (ISO)" },
        ],
        example: `const { rawKey } = await conch.createApiKey("My App", {
  scope: "FULL",
});
console.log("Save this key:", rawKey);`,
      },
      {
        name: "listApiKeys",
        signature: "listApiKeys(): Promise<ApiKey[]>",
        description: "List all API keys (never returns raw key).",
        params: [],
        example: `const keys = await conch.listApiKeys();
keys.forEach(k => console.log(k.name, k.scope));`,
      },
      {
        name: "revokeApiKey",
        signature: "revokeApiKey(id: string): Promise<void>",
        description: "Immediately invalidate an API key.",
        params: [
          { name: "id", type: "string", required: true, description: "Key ID" },
        ],
        example: `await conch.revokeApiKey("key_abc123");`,
      },
    ],
  },
];

// ── Method Display Component ─────────────────────────────────────────────────

function MethodCard({ method }: { method: (typeof SDK_METHODS)[0]["methods"][0] }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-white/8 rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-3 bg-white/5 hover:bg-white/[0.07] transition-colors text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <code className="text-xs font-mono text-coral-300 truncate">{method.name}</code>
          <span className="text-[10px] text-slate-500 hidden sm:block truncate">{method.description}</span>
        </div>
        <ChevronRight
          className={cn(
            "w-4 h-4 text-slate-500 shrink-0 transition-transform",
            expanded && "rotate-90"
          )}
        />
      </button>

      {expanded && (
        <div className="p-4 border-t border-white/8 space-y-4">
          {/* Signature */}
          <div>
            <p className="text-[10px] font-semibold text-slate-500 uppercase mb-1">Signature</p>
            <code className="text-xs font-mono text-teal-300 bg-black/30 px-2 py-1 rounded-lg block overflow-x-auto">
              {method.signature}
            </code>
          </div>

          {/* Description */}
          <div>
            <p className="text-[10px] font-semibold text-slate-500 uppercase mb-1">Description</p>
            <p className="text-xs text-slate-300">{method.description}</p>
          </div>

          {/* Parameters */}
          {method.params.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-slate-500 uppercase mb-2">Parameters</p>
              <div className="space-y-1">
                {method.params.map((param) => (
                  <div
                    key={param.name}
                    className="flex items-start gap-3 p-2 bg-white/5 rounded-lg"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <code className="text-[11px] font-mono text-white">{param.name}</code>
                        <code className="text-[10px] font-mono text-slate-500">{param.type}</code>
                        {param.required && (
                          <Badge className="bg-coral-500/15 text-coral-300 border-coral-500/30 text-[9px]">
                            required
                          </Badge>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">{param.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Example */}
          <div>
            <p className="text-[10px] font-semibold text-slate-500 uppercase mb-1">Example</p>
            <CodeBlock code={method.example} language="typescript" />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

export function SdkDocs() {
  const [activeSection, setActiveSection] = useState("installation");

  return (
    <div className="max-w-6xl px-4 sm:px-6 flex gap-6">
      {/* Sidebar */}
      <aside className="hidden lg:block w-48 shrink-0">
        <div className="sticky top-24">
          <SidebarNav activeSection={activeSection} />
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 min-w-0 space-y-6">
        {/* Hero */}
        <GlassCard className="p-6 md:p-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-linear-to-br from-coral-600/10 via-transparent to-gold-600/5 pointer-events-none" />
          <div className="relative">
            <Badge className="mb-3 bg-coral-500/15 text-coral-300 border-coral-500/30 text-xs">
              SDK Documentation
            </Badge>
            <h1 className="font-display text-2xl md:text-3xl text-white mb-2">
              Conch TypeScript SDK
            </h1>
            <p className="text-sm md:text-base text-slate-400 max-w-2xl mb-4">
              Full-featured SDK for integrating Conch&apos;s memory, search, and chat
              capabilities into your TypeScript or JavaScript applications.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild className="gap-2">
                <a href="#installation">
                  <Package className="w-4 h-4" /> Get Started
                </a>
              </Button>
              <Button variant="secondary" asChild className="gap-2">
                <a href="#types">
                  <Code2 className="w-4 h-4" /> API Reference
                </a>
              </Button>
              <Button variant="secondary" asChild className="gap-2">
                <Link href="/developers/api">
                  <Terminal className="w-4 h-4" /> REST API
                </Link>
              </Button>
            </div>
          </div>
        </GlassCard>

        {/* Installation */}
        <section id="installation">
          <GlassCard className="p-5 md:p-6">
            <div className="flex items-center gap-2 mb-4">
              <Package className="w-4 h-4 text-coral-400" />
              <h2 className="text-base font-semibold text-white">Installation</h2>
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-white/5 rounded-xl border border-white/8">
                <p className="text-xs font-semibold text-white mb-2">npm</p>
                <CodeBlock code="npm install @conch/sdk" language="bash" />
              </div>
              <div className="p-3 bg-white/5 rounded-xl border border-white/8">
                <p className="text-xs font-semibold text-white mb-2">yarn</p>
                <CodeBlock code="yarn add @conch/sdk" language="bash" />
              </div>
              <div className="p-3 bg-white/5 rounded-xl border border-white/8">
                <p className="text-xs font-semibold text-white mb-2">pnpm</p>
                <CodeBlock code="pnpm add @conch/sdk" language="bash" />
              </div>
            </div>

            <div className="mt-4 p-3 bg-white/[0.03] border border-white/8 rounded-xl">
              <p className="text-xs text-slate-400">
                <span className="text-slate-300 font-semibold">Requirements:</span> Node.js 18+ 
                (uses native <code className="text-coral-300">fetch</code>)
              </p>
            </div>
          </GlassCard>
        </section>

        {/* Quick Start */}
        <section id="quickstart">
          <GlassCard className="p-5 md:p-6">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-4 h-4 text-coral-400" />
              <h2 className="text-base font-semibold text-white">Quick Start</h2>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-white mb-2">1. Initialize the client</p>
                <CodeBlock
                  code={`import { ConchClient } from "@conch/sdk";

const conch = new ConchClient({
  apiKey: process.env.CONCH_API_KEY,
});`}
                  language="typescript"
                />
              </div>

              <div>
                <p className="text-xs font-semibold text-white mb-2">2. Store a memory</p>
                <CodeBlock
                  code={`const memory = await conch.createMemory({
  content: "User prefers dark roast coffee",
  category: "PREFERENCE",
  tags: ["coffee", "preferences"],
  importance: 0.8,
});

console.log("Stored:", memory.$id);`}
                  language="typescript"
                />
              </div>

              <div>
                <p className="text-xs font-semibold text-white mb-2">3. Search memories</p>
                <CodeBlock
                  code={`const { results } = await conch.search({
  query: "coffee preferences",
  topK: 5,
});

results.forEach(({ memory, score }) => {
  console.log(\`\${score.toFixed(2)}: \${memory.content}\`);
});`}
                  language="typescript"
                />
              </div>

              <div>
                <p className="text-xs font-semibold text-white mb-2">4. Recall context for AI</p>
                <CodeBlock
                  code={`const { context } = await conch.recall({
  query: "What does the user like to drink?",
});

// Inject into your AI prompt
const prompt = \`
Context about the user:
\${context}

Answer based on this context.
\`;`}
                  language="typescript"
                />
              </div>
            </div>
          </GlassCard>
        </section>

        {/* Authentication */}
        <section id="authentication">
          <GlassCard className="p-5 md:p-6">
            <div className="flex items-center gap-2 mb-4">
              <Key className="w-4 h-4 text-coral-400" />
              <h2 className="text-base font-semibold text-white">Authentication</h2>
            </div>

            <p className="text-xs text-slate-400 mb-4">
              All API requests require a valid API key. Create one at{" "}
              <Link href="/settings/api-keys" className="text-coral-300 hover:text-coral-200 underline">
                Settings → API Keys
              </Link>
              .
            </p>

            <CodeBlock
              code={`// Option 1: Direct configuration
const conch = new ConchClient({
  apiKey: "cnch_your_api_key",
});

// Option 2: Environment variable (recommended)
const conch = new ConchClient({
  apiKey: process.env.CONCH_API_KEY,
});

// Option 3: Custom base URL
const conch = new ConchClient({
  apiKey: process.env.CONCH_API_KEY,
  baseUrl: "https://custom-domain.com",
  timeout: 60000, // 60 seconds
});`}
              language="typescript"
              title="Configuration"
            />

            <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
              <p className="text-xs text-amber-300">
                <span className="font-semibold">Security tip:</span> Never expose your API key in client-side code. 
                Use environment variables and only use the SDK server-side.
              </p>
            </div>
          </GlassCard>
        </section>

        {/* API Reference */}
        <section id="types">
          <GlassCard className="p-5 md:p-6">
            <div className="flex items-center gap-2 mb-4">
              <Code2 className="w-4 h-4 text-coral-400" />
              <h2 className="text-base font-semibold text-white">API Reference</h2>
            </div>

            <p className="text-xs text-slate-400 mb-4">
              Complete reference for all SDK methods, types, and parameters.
            </p>

            <div className="space-y-6">
              {SDK_METHODS.map((group) => (
                <div key={group.category}>
                  <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-coral-400" />
                    {group.category}
                  </h3>
                  <div className="space-y-2">
                    {group.methods.map((method) => (
                      <MethodCard key={method.name} method={method} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </section>

        {/* Types */}
        <section id="types-reference">
          <GlassCard className="p-5 md:p-6">
            <div className="flex items-center gap-2 mb-4">
              <FileCode className="w-4 h-4 text-coral-400" />
              <h2 className="text-base font-semibold text-white">Type Definitions</h2>
            </div>

            <CodeBlock
              code={`// Memory categories
type MemoryCategory = "EPISODIC" | "SEMANTIC" | "PREFERENCE" | "PROCEDURAL";

// Agent status
type AgentStatus = "ACTIVE" | "PAUSED" | "ARCHIVED";

// Memory scope
type MemoryScope = "user" | "agent" | "global";

// API key scopes
type ApiKeyScope = "FULL" | "MEMORY_READ" | "MEMORY_WRITE" | "CHAT";

// Memory interface
interface Memory {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  userId: string;
  content: string;
  category: MemoryCategory;
  tags: string[];
  importance: number;
  accessCount: number;
  lastAccessed: string | null;
  source: string | null;
  agentId: string | null;
  isArchived: boolean;
  namespace: string;
}

// Agent interface
interface Agent {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  userId: string;
  name: string;
  description: string | null;
  systemPrompt: string;
  avatarUrl: string | null;
  status: AgentStatus;
  memoryScope: MemoryScope;
  modelId: string;
  temperature: number;
  maxTokens: number;
}

// Conversation interface
interface Conversation {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  userId: string;
  agentId: string | null;
  title: string;
  summary: string | null;
}

// Message interface
interface Message {
  $id: string;
  conversationId: string;
  role: "user" | "assistant";
  content: string;
  tokensUsed: number | null;
  memoryIds: string[];
}

// API Key interface
interface ApiKey {
  $id: string;
  userId: string;
  name: string;
  keyPrefix: string;
  scope: ApiKeyScope;
  lastUsedAt: string | null;
  expiresAt: string | null;
  isRevoked: boolean;
}`}
              language="typescript"
              title="Core Types"
            />
          </GlassCard>
        </section>

        {/* Error Handling */}
        <section id="errors">
          <GlassCard className="p-5 md:p-6">
            <div className="flex items-center gap-2 mb-4">
              <FileCode className="w-4 h-4 text-coral-400" />
              <h2 className="text-base font-semibold text-white">Error Handling</h2>
            </div>

            <CodeBlock
              code={`import { ConchClient, ConchError } from "@conch/sdk";

try {
  const memory = await conch.createMemory({
    content: "test",
  });
} catch (error) {
  if (error instanceof ConchError) {
    console.error(\`API Error \${error.status}: \${error.message}\`);
    console.error("Response body:", error.body);
    
    // Handle specific error codes
    switch (error.status) {
      case 401:
        console.error("Invalid API key");
        break;
      case 429:
        console.error("Rate limited - slow down");
        break;
      case 500:
        console.error("Server error - try again later");
        break;
    }
  } else {
    console.error("Unexpected error:", error);
  }
}`}
              language="typescript"
              title="Error Handling"
            />
          </GlassCard>
        </section>

        {/* Rate Limits */}
        <section id="ratelimits">
          <GlassCard className="p-5 md:p-6">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-4 h-4 text-coral-400" />
              <h2 className="text-base font-semibold text-white">Rate Limits</h2>
            </div>

            <div className="space-y-3">
              {[
                { operation: "Memory CRUD", limit: "20 requests/60s", icon: FileCode },
                { operation: "Search", limit: "30 requests/60s", icon: Search },
                { operation: "Recall", limit: "30 requests/60s", icon: Search },
                { operation: "Chat", limit: "30 requests/60s", icon: MessageSquare },
                { operation: "API Keys", limit: "10 requests/60s", icon: Key },
              ].map((item) => (
                <div
                  key={item.operation}
                  className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/8"
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="w-4 h-4 text-slate-500" />
                    <span className="text-xs text-white">{item.operation}</span>
                  </div>
                  <code className="text-xs font-mono text-teal-300">{item.limit}</code>
                </div>
              ))}
            </div>

            <div className="mt-4 p-3 bg-white/[0.03] border border-white/8 rounded-xl">
              <p className="text-xs text-slate-400">
                Rate limits are per API key. If you hit a limit, wait 60 seconds before retrying.
                The SDK does not automatically retry on rate limits.
              </p>
            </div>
          </GlassCard>
        </section>

        {/* Next Steps */}
        <GlassCard className="p-5 md:p-6">
          <h2 className="text-base font-semibold text-white mb-4">Next Steps</h2>

          <div className="grid sm:grid-cols-2 gap-3">
            <Link
              href="/developers/api"
              className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/8 hover:bg-white/10 transition-colors"
            >
              <Terminal className="w-4 h-4 text-coral-400 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-white">REST API Reference</p>
                <p className="text-[10px] text-slate-400">Interactive API explorer</p>
              </div>
              <ExternalLink className="w-3 h-3 text-slate-500 ml-auto shrink-0" />
            </Link>

            <Link
              href="/developers/install"
              className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/8 hover:bg-white/10 transition-colors"
            >
              <Package className="w-4 h-4 text-coral-400 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-white">Other Languages</p>
                <p className="text-[10px] text-slate-400">Python, Go, Ruby, Rust, and more</p>
              </div>
              <ExternalLink className="w-3 h-3 text-slate-500 ml-auto shrink-0" />
            </Link>

            <Link
              href="/settings/api-keys"
              className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/8 hover:bg-white/10 transition-colors"
            >
              <Key className="w-4 h-4 text-coral-400 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-white">Create API Key</p>
                <p className="text-[10px] text-slate-400">Get your credentials</p>
              </div>
              <ExternalLink className="w-3 h-3 text-slate-500 ml-auto shrink-0" />
            </Link>

            <a
              href="https://github.com/conch-ai/conch-sdk-ts"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/8 hover:bg-white/10 transition-colors"
            >
              <Code2 className="w-4 h-4 text-coral-400 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-white">GitHub</p>
                <p className="text-[10px] text-slate-400">Source code & issues</p>
              </div>
              <ExternalLink className="w-3 h-3 text-slate-500 ml-auto shrink-0" />
            </a>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
