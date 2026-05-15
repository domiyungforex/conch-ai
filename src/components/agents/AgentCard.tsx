"use client";

import { MoreHorizontal, Play, Pause, Trash2, Edit2, MessageSquare, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { GlassCard } from "@/components/shared/GlassCard";
import { cn } from "@/lib/utils";
import type { Agent } from "@prisma/client";

const statusConfig = {
  ACTIVE: { label: "Active", color: "text-emerald-300", bg: "bg-emerald-500/15 border-emerald-500/30" },
  PAUSED: { label: "Paused", color: "text-amber-300", bg: "bg-amber-500/15 border-amber-500/30" },
  ARCHIVED: { label: "Archived", color: "text-slate-400", bg: "bg-slate-500/15 border-slate-500/30" },
} as const;

const gradients = [
  "from-violet-500 to-indigo-500",
  "from-cyan-500 to-blue-500",
  "from-emerald-500 to-teal-500",
  "from-rose-500 to-pink-500",
  "from-amber-500 to-orange-500",
];

interface Props {
  agent: Agent & { _count?: { conversations?: number; memories?: number } };
  onEdit: (agent: Agent) => void;
  onToggleStatus: (id: string, currentStatus: string) => void;
  onDelete: (id: string) => void;
}

export function AgentCard({ agent, onEdit, onToggleStatus, onDelete }: Props) {
  const statusCfg = statusConfig[agent.status as keyof typeof statusConfig] ?? statusConfig.ACTIVE;
  const gradient = gradients[agent.name.charCodeAt(0) % gradients.length];

  return (
    <GlassCard className="p-5 flex flex-col gap-4 group hover:bg-white/6 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={cn("w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center text-white font-bold text-sm shadow-lg", gradient)}>
            {agent.name[0].toUpperCase()}
          </div>
          <div>
            <h3 className="font-semibold text-white leading-tight">{agent.name}</h3>
            {agent.modelId && (
              <span className="text-xs text-slate-500 font-mono">{agent.modelId}</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border", statusCfg.bg, statusCfg.color)}>
            {statusCfg.label}
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-500 hover:text-white opacity-0 group-hover:opacity-100">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(agent)}>
                <Edit2 className="w-4 h-4 text-slate-400" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onToggleStatus(agent.id, agent.status)}>
                {agent.status === "ACTIVE"
                  ? <><Pause className="w-4 h-4 text-slate-400" /> Pause</>
                  : <><Play className="w-4 h-4 text-slate-400" /> Activate</>}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-400 focus:text-red-300 focus:bg-red-500/10"
                onClick={() => onDelete(agent.id)}
              >
                <Trash2 className="w-4 h-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Description */}
      {agent.description && (
        <p className="text-sm text-slate-400 leading-relaxed line-clamp-2">{agent.description}</p>
      )}

      {/* System prompt preview */}
      {agent.systemPrompt && (
        <p className="text-xs text-slate-600 line-clamp-2 font-mono bg-white/3 rounded-lg px-3 py-2 border border-white/5">
          {agent.systemPrompt}
        </p>
      )}

      {/* Stats */}
      <div className="flex items-center gap-4 pt-2 border-t border-white/5 text-xs text-slate-500">
        <div className="flex items-center gap-1">
          <MessageSquare className="w-3.5 h-3.5" />
          {agent._count?.conversations ?? 0} chats
        </div>
        <div className="flex items-center gap-1">
          <Brain className="w-3.5 h-3.5" />
          {agent._count?.memories ?? 0} memories
        </div>
        <div className="ml-auto">
          T: {agent.temperature} · {agent.maxTokens} tok
        </div>
      </div>
    </GlassCard>
  );
}
