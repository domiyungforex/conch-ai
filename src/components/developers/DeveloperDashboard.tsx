"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Key,
  Code2,
  BarChart3,
  Zap,
  Shield,
  Plus,
  Copy,
  Check,
  Trash2,
  ExternalLink,
  Clock,
  ArrowRight,
  Brain,
  Bot,
  Layers,
  RefreshCw,
  Download,
  Terminal,
} from "lucide-react";
import { GlassCard } from "@/components/shared/GlassCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";
import type { ApiKeyDoc, AppwriteDoc } from "@/lib/db";

// ── Hero Section ───────────────────────────────────────────────────────────

function DeveloperHero() {
  return (
    <GlassCard className="p-6 md:p-8 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 bg-linear-to-br from-coral-600/10 via-transparent to-gold-600/5 pointer-events-none" />

      <div className="relative">
        <Badge className="mb-3 bg-coral-500/15 text-coral-300 border-coral-500/30 text-xs">
          For Developers
        </Badge>
        <h1 className="font-display text-2xl md:text-3xl text-white mb-2">
          Give your agents memory.
        </h1>
        <p className="text-sm md:text-base text-slate-400 max-w-2xl mb-6">
          Connect your application to Conch and give AI agents access to persistent
          context, memory, decisions, constraints, and agent state.
        </p>

        {/* Architecture diagram */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-0 mb-6 text-xs">
          {[
            { icon: Code2, label: "Your App", color: "text-teal-400" },
            { icon: Zap, label: "Conch API", color: "text-coral-400" },
            { icon: Layers, label: "Context Engine", color: "text-gold-400" },
            { icon: Brain, label: "Memory + Decisions + State", color: "text-purple-400" },
          ].map((step, i) => (
            <div key={step.label} className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 border border-white/8">
                <step.icon className={`w-3.5 h-3.5 ${step.color}`} />
                <span className="text-slate-300 whitespace-nowrap">{step.label}</span>
              </div>
              {i < 3 && (
                <ArrowRight className="w-3.5 h-3.5 text-slate-600 shrink-0 hidden sm:block" />
              )}
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div className="flex flex-wrap gap-3">
          <Button asChild className="gap-2">
            <Link href="/developers/install">
              <Download className="w-4 h-4" /> Install Conch
            </Link>
          </Button>
          <Button asChild className="gap-2">
            <Link href="/settings/api-keys">
              <Key className="w-4 h-4" /> Get Your API Key
            </Link>
          </Button>
          <Button variant="secondary" asChild className="gap-2">
            <Link href="/developers/api">
              <Terminal className="w-4 h-4" /> Explore API
            </Link>
          </Button>
        </div>
      </div>
    </GlassCard>
  );
}

// ── Feature Cards ──────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: Layers,
    title: "Store context",
    desc: "Send memories, decisions, constraints, and project state to Conch's context engine.",
    color: "text-coral-400",
  },
  {
    icon: Brain,
    title: "Retrieve context",
    desc: "Semantic search and recall surface the most relevant context for any query.",
    color: "text-gold-400",
  },
  {
    icon: Bot,
    title: "Continue work",
    desc: "Agents pick up where they left off with persistent state across sessions.",
    color: "text-purple-400",
  },
  {
    icon: RefreshCw,
    title: "Transfer meaning",
    desc: "Hand off context between agents with structured agent handoffs.",
    color: "text-teal-400",
  },
];

function FeatureCards() {
  return (
    <div className="grid sm:grid-cols-2 gap-4">
      <Link href="/developers/install" className="block">
        <GlassCard className="p-5 hover:bg-white/[0.07] transition-colors cursor-pointer">
          <Download className="w-5 h-5 text-coral-400 mb-3" />
          <h3 className="text-sm font-semibold text-white mb-1">Install Conch</h3>
          <p className="text-xs text-slate-400">
            Add Conch to your app in any language — JavaScript, Python, Go, Ruby, Rust, Java, PHP, and more.
          </p>
        </GlassCard>
      </Link>
      {FEATURES.map((f) => (
        <GlassCard key={f.title} className="p-5">
          <f.icon className={`w-5 h-5 ${f.color} mb-3`} />
          <h3 className="text-sm font-semibold text-white mb-1">{f.title}</h3>
          <p className="text-xs text-slate-400">{f.desc}</p>
        </GlassCard>
      ))}
    </div>
  );
}

// ── API Keys Section ───────────────────────────────────────────────────────

const SCOPE_LABELS: Record<string, { label: string; color: string }> = {
  FULL: { label: "Full Access", color: "bg-coral-500/15 text-coral-300 border-coral-500/30" },
  MEMORY_READ: { label: "Read", color: "bg-teal-500/15 text-teal-300 border-teal-500/30" },
  MEMORY_WRITE: { label: "Write", color: "bg-gold-500/15 text-gold-300 border-gold-500/30" },
  CHAT: { label: "Chat", color: "bg-purple-500/15 text-purple-300 border-purple-500/30" },
};

function ApiKeysSection() {
  const [keys, setKeys] = useState<(AppwriteDoc<ApiKeyDoc> & { fullKey?: string })[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyScope, setNewKeyScope] = useState("FULL");
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchKeys = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/api-keys");
      if (res.ok) {
        const data = await res.json();
        setKeys(data.apiKeys ?? []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchKeys();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreate = async () => {
    if (!newKeyName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newKeyName.trim(), scope: newKeyScope }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to create key");
      }
      const data = await res.json();
      setCreatedKey(data.fullKey);
      setNewKeyName("");
      setNewKeyScope("FULL");
      fetchKeys();
      toast({ title: "API key created" });
    } catch (err) {
      toast({
        title: "Failed to create key",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (id: string) => {
    try {
      const res = await fetch(`/api/api-keys/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to revoke");
      fetchKeys();
      toast({ title: "Key revoked" });
    } catch (err) {
      toast({
        title: "Failed to revoke key",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <GlassCard className="p-5 md:p-6" id="api-keys">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold text-white">API Keys</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Create keys to authenticate external applications.
          </p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => setCreatedKey(null)}>
          <Plus className="w-3.5 h-3.5" /> New Key
        </Button>
      </div>

      {/* Created key banner */}
      {createdKey && (
        <div className="mb-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
          <p className="text-xs text-emerald-300 font-semibold mb-1">
            Your API key (copy it now — it won&apos;t be shown again):
          </p>
          <div className="flex items-center gap-2">
            <code className="text-xs font-mono text-emerald-200 bg-black/30 px-3 py-2 rounded-lg flex-1 overflow-x-auto">
              {createdKey}
            </code>
            <Button size="sm" variant="ghost" onClick={() => copyKey(createdKey)}>
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Create form */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4 p-3 bg-white/5 rounded-xl border border-white/8">
        <Input
          value={newKeyName}
          onChange={(e) => setNewKeyName(e.target.value)}
          placeholder="Key name (e.g. My App)"
          className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 h-9 text-sm"
        />
        <Select value={newKeyScope} onValueChange={setNewKeyScope}>
          <SelectTrigger className="w-full sm:w-40 h-9 text-xs bg-white/5 border-white/10">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="FULL">Full Access</SelectItem>
            <SelectItem value="MEMORY_READ">Memory Read</SelectItem>
            <SelectItem value="MEMORY_WRITE">Memory Write</SelectItem>
            <SelectItem value="CHAT">Chat Only</SelectItem>
          </SelectContent>
        </Select>
        <Button
          size="sm"
          onClick={handleCreate}
          disabled={!newKeyName.trim() || creating}
          className="gap-1.5 shrink-0"
        >
          {creating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
          Create
        </Button>
      </div>

      {/* Keys list */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-14 rounded-xl bg-white/5" />
          ))}
        </div>
      ) : !keys?.length ? (
        <div className="text-center py-8 text-slate-500 text-sm">
          <Key className="w-8 h-8 mx-auto mb-2 opacity-30" />
          No API keys yet. Create one above to get started.
        </div>
      ) : (
        <div className="space-y-2">
          {keys.map((key) => {
            const scope = SCOPE_LABELS[key.scope] ?? SCOPE_LABELS.FULL;
            return (
              <div
                key={key.$id}
                className="flex items-center justify-between gap-3 p-3 bg-white/5 rounded-xl border border-white/8"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-white">{key.name}</span>
                    <Badge className={cn("text-[10px]", scope.color)}>
                      {scope.label}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 text-[11px] text-slate-500">
                    <code className="font-mono">{key.keyPrefix}…</code>
                    {key.lastUsedAt && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Last used {new Date(key.lastUsedAt).toLocaleDateString()}
                      </span>
                    )}
                    {key.expiresAt && (
                      <span>Expires {new Date(key.expiresAt).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 text-slate-500 hover:text-red-400"
                  onClick={() => handleRevoke(key.$id)}
                  title="Revoke key"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </GlassCard>
  );
}

// ── Usage Stats ────────────────────────────────────────────────────────────

function UsageStats() {
  const [stats, setStats] = useState<{
    totalRequests: number;
    byMethod: Record<string, number>;
    byPath: Record<string, number>;
    byStatus: Record<string, number>;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/usage")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setStats(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const getRequests = (method?: string) => {
    if (!stats) return 0;
    if (method) return stats.byMethod[method] ?? 0;
    return stats.totalRequests;
  };

  const getContextOps = () => {
    if (!stats) return 0;
    let count = 0;
    for (const [path, n] of Object.entries(stats.byPath)) {
      if (path.includes("context")) count += n;
    }
    return count;
  };

  const getAgentOps = () => {
    if (!stats) return 0;
    let count = 0;
    for (const [path, n] of Object.entries(stats.byPath)) {
      if (path.includes("agents")) count += n;
    }
    return count;
  };

  return (
    <GlassCard className="p-5 md:p-6">
      <h2 className="text-base font-semibold text-white mb-4">API Usage</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "API Requests", value: loading ? "—" : String(getRequests()), icon: BarChart3 },
          { label: "Context Ops", value: loading ? "—" : String(getContextOps()), icon: Layers },
          { label: "Agent Ops", value: loading ? "—" : String(getAgentOps()), icon: Bot },
          { label: "POST Requests", value: loading ? "—" : String(getRequests("POST")), icon: Zap },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white/5 rounded-xl p-3 border border-white/8 text-center"
          >
            <stat.icon className="w-4 h-4 text-slate-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-white">{stat.value}</p>
            <p className="text-[11px] text-slate-400">{stat.label}</p>
          </div>
        ))}
      </div>
      {!loading && stats && stats.totalRequests === 0 && (
        <p className="text-xs text-slate-500 mt-3 text-center">
          No API activity yet. Make your first API call to see usage data.
        </p>
      )}
    </GlassCard>
  );
}

// ── Documentation Section ──────────────────────────────────────────────────

const QUICK_START_STEPS = [
  "Create a Conch account",
  "Create an API key (Settings → API Keys)",
  "Install the SDK or use the HTTP API",
  "Send context to Conch",
  "Retrieve context",
  "Give an agent persistent context",
];

const CODE_EXAMPLES = {
  typescript: {
    label: "TypeScript",
    code: `// Store a memory via the Conch API
const res = await fetch("https://conchportal.com/api/v1/context", {
  method: "POST",
  headers: {
    "Authorization": "Bearer cnch_your_api_key",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    type: "memory",
    content: "The user prefers dark roast coffee, no sugar",
    importance: 0.8,
    tags: ["preference", "coffee"],
  }),
});

const { context } = await res.json();
console.log("Stored:", context.$id);`,
  },
  python: {
    label: "Python",
    code: `import requests

# Store a memory via the Conch API
res = requests.post(
    "https://conchportal.com/api/v1/context",
    headers={
        "Authorization": "Bearer cnch_your_api_key",
        "Content-Type": "application/json",
    },
    json={
        "type": "memory",
        "content": "The user prefers dark roast coffee, no sugar",
        "importance": 0.8,
        "tags": ["preference", "coffee"],
    },
)

context = res.json()["context"]
print(f"Stored: {context['\$id']}")`,
  },
  curl: {
    label: "cURL",
    code: `curl -X POST "https://conchportal.com/api/v1/context" \\
  -H "Authorization: Bearer cnch_your_api_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "type": "memory",
    "content": "The user prefers dark roast coffee, no sugar",
    "importance": 0.8,
    "tags": ["preference", "coffee"]
  }'`,
  },
};

function DocumentationSection() {
  const [activeExample, setActiveExample] = useState<keyof typeof CODE_EXAMPLES>("typescript");

  return (
    <GlassCard className="p-5 md:p-6" id="documentation">
      <h2 className="text-base font-semibold text-white mb-4">Quick Start</h2>

      {/* Steps */}
      <div className="space-y-2 mb-6">
        {QUICK_START_STEPS.map((step, i) => (
          <div key={i} className="flex items-start gap-3 text-sm">
            <span className="w-5 h-5 rounded-full bg-coral-500/15 text-coral-300 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
              {i + 1}
            </span>
            <span className="text-slate-300">{step}</span>
          </div>
        ))}
      </div>

      {/* Code examples */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          {(Object.keys(CODE_EXAMPLES) as Array<keyof typeof CODE_EXAMPLES>).map((lang) => (
            <button
              key={lang}
              onClick={() => setActiveExample(lang)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                activeExample === lang
                  ? "bg-coral-600/20 text-coral-300"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              )}
            >
              {CODE_EXAMPLES[lang].label}
            </button>
          ))}
        </div>

        <div className="relative">
          <pre className="text-xs font-mono text-slate-300 bg-black/40 border border-white/8 rounded-xl p-4 overflow-x-auto whitespace-pre-wrap">
            {CODE_EXAMPLES[activeExample].code}
          </pre>
        </div>
      </div>

      {/* Link to full docs */}
      <div className="mt-4 pt-4 border-t border-white/8">
        <Link
          href="/developers/api"
          className="flex items-center gap-2 text-sm text-coral-300 hover:text-coral-200 transition-colors"
        >
          <Code2 className="w-4 h-4" />
          Explore the full API reference
          <ExternalLink className="w-3 h-3" />
        </Link>
      </div>

      {/* Billing + Wallet API docs callout */}
      <div className="mt-4 p-3 bg-white/[0.03] border border-white/8 rounded-xl">
        <p className="text-xs text-slate-400">
          The API reference includes documentation for <span className="text-slate-300">Billing</span> (payment verification, subscription management) and <span className="text-slate-300">Wallet</span> (link, verify, disconnect) endpoints.
        </p>
      </div>
    </GlassCard>
  );
}

// ── Limits & Billing ───────────────────────────────────────────────────────

function LimitsSection() {
  return (
    <GlassCard className="p-5 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-white">Limits & Billing</h2>
        <Link
          href="/settings/billing"
          className="text-xs text-coral-300 hover:text-coral-200 flex items-center gap-1"
        >
          View billing <ExternalLink className="w-3 h-3" />
        </Link>
      </div>
      <div className="grid sm:grid-cols-3 gap-3">
        {[
          { label: "API Rate Limit", value: "30 req/min", icon: Shield },
          { label: "Max Memories", value: "Plan-based", icon: Brain },
          { label: "Max Agents", value: "Plan-based", icon: Bot },
        ].map((limit) => (
          <div
            key={limit.label}
            className="bg-white/5 rounded-xl p-3 border border-white/8"
          >
            <limit.icon className="w-4 h-4 text-slate-500 mb-1" />
            <p className="text-sm font-medium text-white">{limit.value}</p>
            <p className="text-[11px] text-slate-400">{limit.label}</p>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────────────

export function DeveloperDashboard() {
  return (
    <div className="max-w-4xl space-y-6">
      <DeveloperHero />
      <FeatureCards />
      <UsageStats />
      <ApiKeysSection />
      <DocumentationSection />
      <LimitsSection />
    </div>
  );
}
