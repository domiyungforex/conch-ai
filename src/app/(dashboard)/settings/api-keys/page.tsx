"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Copy, Trash2, Eye, Key } from "lucide-react";
import { GlassCard } from "@/components/shared/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { toast } from "@/components/ui/toaster";
import { formatDate } from "@/lib/utils";
import type { ApiKeyPublic, ApiKeyCreated } from "@/types/api";

async function fetchKeys(): Promise<ApiKeyPublic[]> {
  const res = await fetch("/api/api-keys");
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? "Failed to fetch API keys");
  }
  const data = await res.json();
  return Array.isArray(data.apiKeys) ? data.apiKeys : [];
}

async function createKey(data: { name: string; scope: string }): Promise<ApiKeyCreated> {
  const res = await fetch("/api/api-keys", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? "Failed to create API key");
  }
  const body = await res.json();
  return { ...body.apiKey, fullKey: body.fullKey };
}

async function revokeKey(id: string): Promise<void> {
  const res = await fetch(`/api/api-keys/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? "Failed to revoke key");
  }
}

export default function ApiKeysPage() {
  const qc = useQueryClient();
  const { data: keys, isLoading } = useQuery({ queryKey: ["api-keys"], queryFn: fetchKeys });
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [scope, setScope] = useState("FULL");
  const [newKey, setNewKey] = useState<ApiKeyCreated | null>(null);
  const [copied, setCopied] = useState(false);

  const create = useMutation({
    mutationFn: createKey,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["api-keys"] });
      setNewKey(data);
      setCreateOpen(false);
      setName(""); setScope("FULL");
      toast({ title: "API key created" });
    },
    onError: (err: Error) => toast({ title: "Failed to create key", description: err.message, variant: "destructive" }),
  });

  const revoke = useMutation({
    mutationFn: revokeKey,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["api-keys"] });
      toast({ title: "Key revoked" });
    },
    onError: (err: Error) => toast({ title: "Failed to revoke key", description: err.message, variant: "destructive" }),
  });

  const copyKey = () => {
    if (!newKey) return;
    navigator.clipboard.writeText(newKey.fullKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-white">API Keys</h2>
          <p className="text-xs text-slate-400 mt-0.5">Use these keys to access Conch programmatically.</p>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)} className="gap-1.5">
          <Plus className="w-3.5 h-3.5" /> New Key
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1,2].map((i) => <Skeleton key={i} className="h-16 rounded-xl bg-white/5" />)}</div>
      ) : !keys?.length ? (
        <EmptyState icon={Key} title="No API keys" description="Create a key to access Conch from your own apps." action={{ label: "Create Key", onClick: () => setCreateOpen(true) }} />
      ) : (
        <div className="space-y-3">
          {keys.map((k) => (
            <GlassCard key={k.$id} className="px-4 py-3 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white">{k.name}</span>
                  <Badge className="text-xs bg-coral-500/15 text-coral-300 border-coral-500/30">{k.scope}</Badge>
                  {k.isRevoked && <Badge className="text-xs bg-red-500/15 text-red-300 border-red-500/30">Revoked</Badge>}
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <code className="text-xs text-slate-500 font-mono">{k.keyPrefix}…</code>
                  {k.lastUsedAt && <span className="text-xs text-slate-600">Last used {formatDate(k.lastUsedAt)}</span>}
                  {k.expiresAt && <span className="text-xs text-slate-600">Expires {formatDate(k.expiresAt)}</span>}
                </div>
              </div>
              {!k.isRevoked && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => revoke.mutate(k.$id)}
                  disabled={revoke.isPending && revoke.variables === k.$id}
                  className="h-7 px-2 text-xs shrink-0"
                >
                  {revoke.isPending && revoke.variables === k.$id ? <LoadingSpinner size="sm" /> : <Trash2 className="w-3.5 h-3.5" />}
                </Button>
              )}
            </GlassCard>
          ))}
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="glass border-white/10 max-w-md">
          <DialogHeader><DialogTitle className="text-white">Create API Key</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label className="text-slate-300 mb-1.5 block">Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="My App" className="bg-white/5 border-white/10 text-white placeholder:text-slate-500" />
            </div>
            <div>
              <Label className="text-slate-300 mb-1.5 block">Scope</Label>
              <Select value={scope} onValueChange={setScope}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="FULL">Full Access</SelectItem>
                  <SelectItem value="MEMORY_READ">Memory Read</SelectItem>
                  <SelectItem value="MEMORY_WRITE">Memory Write</SelectItem>
                  <SelectItem value="CHAT">Chat Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-3 mt-4 justify-end">
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={() => create.mutate({ name, scope })} disabled={!name.trim() || create.isPending}>
              {create.isPending && <LoadingSpinner size="sm" />}
              {create.isPending ? "Creating…" : "Create Key"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Key reveal dialog */}
      <Dialog open={!!newKey} onOpenChange={(o) => { if (!o) setNewKey(null); }}>
        <DialogContent className="glass border-white/10 max-w-md">
          <DialogHeader><DialogTitle className="text-white">Your New API Key</DialogTitle></DialogHeader>
          <div className="mt-2">
            <p className="text-sm text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2 mb-4">
              ⚠ Copy this key now — it will not be shown again.
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs font-mono text-coral-300 bg-white/5 rounded-xl px-3 py-2 border border-white/8 break-all">
                {newKey?.fullKey}
              </code>
              <Button variant="secondary" size="icon" onClick={copyKey} className="shrink-0">
                {copied ? <Eye className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={() => setNewKey(null)}>Done</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
