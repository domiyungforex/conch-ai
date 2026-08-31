"use client";

import { useState } from "react";
import { Plus, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AgentCard } from "@/components/agents/AgentCard";
import { AgentCreateDialog } from "@/components/agents/AgentCreateDialog";
import { AgentEditDialog } from "@/components/agents/AgentEditDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { UpgradeGate } from "@/components/shared/UpgradeGate";
import { useAgent } from "@/hooks/useAgent";
import type { AgentDoc, AppwriteDoc } from "@/lib/db";
type Agent = AppwriteDoc<AgentDoc>;

export default function AgentsPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Agent | null>(null);
  const { data: agents, isLoading, update, remove } = useAgent();

  const handleToggleStatus = (id: string, current: string) => {
    update.mutate({ id, data: { status: current === "ACTIVE" ? "PAUSED" : "ACTIVE" } });
  };

  return (
    <UpgradeGate>
    <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-6">
      <div className="flex items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl sm:text-2xl font-normal text-white">Agents</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">Custom AI personas that draw on your memory</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2 shrink-0">
          <Plus className="w-4 h-4" /> <span className="hidden sm:inline">New Agent</span><span className="sm:hidden">New</span>
        </Button>
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-52 rounded-2xl bg-white/5" />)}
        </div>
      ) : !agents?.length ? (
        <EmptyState
          icon={Bot}
          title="No agents yet"
          description="Create a custom AI agent with its own personality, system prompt, and memory scope."
          action={{ label: "Create Agent", onClick: () => setCreateOpen(true) }}
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map((agent) => (
            <AgentCard
              key={agent.$id}
              agent={agent}
              onEdit={setEditTarget}
              onToggleStatus={handleToggleStatus}
              onDelete={(id) => remove.mutate(id)}
            />
          ))}
        </div>
      )}

      <AgentCreateDialog open={createOpen} onClose={() => setCreateOpen(false)} />
      <AgentEditDialog agent={editTarget} onClose={() => setEditTarget(null)} />
    </div>
    </UpgradeGate>
  );
}
