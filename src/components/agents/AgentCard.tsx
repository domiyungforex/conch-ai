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
import type { AgentDoc, AppwriteDoc } from "@/lib/db";
type Agent = AppwriteDoc<AgentDoc>;

const statusConfig = {
  ACTIVE: { label: "Active", color: "text-emerald-300", bg: "bg-emerald-500/15 border-emerald-500/30" },
  PAUSED: { label: "Paused", color: "text-amber-300", bg: "bg-amber-500/15 border-amber-500/30" },
  ARCHIVED: { label: "Archived", color: "text-slate-400", bg: "bg-slate-500/15 border-slate-500/30" },
} as const;

const DEFAULT_STATUS = { label: "Active", color: "text-emerald-300", bg: "bg-emerald-500/15 border-emerald-500/30" };

// Complete, non-composed class strings so Tailwind v4 scanner includes them.
const avatarClasses = [
  "bg-linear-to-br from-coral-600 to-gold-500",
  "bg-linear-to-br from-teal-500 to-blue-600",
  "bg-linear-to-br from-emerald-500 to-teal-600",
  "bg-linear-to-br from-rose-500 to-pink-600",
  "bg-linear-to-br from-amber-500 to-orange-600",
];

interface Props {
  agent: Agent & { _count?: { conversations?: number; memories?: number } };
  onEdit: (agent: Agent & { _count?: { conversations?: number; memories?: number } }) => void;
  onToggleStatus: (id: string, currentStatus: string) => void;
  onDelete: (id: string) => void;
}

export function AgentCard({ agent, onEdit, onToggleStatus, onDelete }: Props) {
  if (!agent?.$id) return null;

  const statusKey = agent.status as keyof typeof statusConfig;
  const statusCfg = statusConfig[statusKey] ?? DEFAULT_STATUS;
  const nameStr = typeof agent.name === "string" && agent.name.length > 0 ? agent.name : "Agent";
  const avatarClass = avatarClasses[nameStr.charCodeAt(0) % avatarClasses.length];
  const initial = nameStr[0].toUpperCase();
  const description = typeof agent.description === "string" ? agent.description : null;
  const systemPrompt = typeof agent.systemPrompt === "string" ? agent.systemPrompt : null;
  const modelId = typeof agent.modelId === "string" ? agent.modelId : null;
  const temperature = typeof agent.temperature === "number" ? agent.temperature : 0.7;
  const maxTokens = typeof agent.maxTokens === "number" ? agent.maxTokens : 2000;

  return (
    <GlassCard className="p-5 flex flex-col gap-4 group hover:bg-white/6 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg shrink-0", avatarClass)}
          >
            {initial}
          </div>
          <div>
            <h3 className="font-semibold text-white leading-tight">{nameStr}</h3>
            {modelId && (
              <span className="text-xs text-slate-500 font-mono">{modelId}</span>
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
              <DropdownMenuItem onClick={() => onToggleStatus(agent.$id, agent.status)}>
                {agent.status === "ACTIVE"
                  ? <><Pause className="w-4 h-4 text-slate-400" /> Pause</>
                  : <><Play className="w-4 h-4 text-slate-400" /> Activate</>}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-400 focus:text-red-300 focus:bg-red-500/10"
                onClick={() => onDelete(agent.$id)}
              >
                <Trash2 className="w-4 h-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Description */}
      {description && (
        <p className="text-sm text-slate-400 leading-relaxed line-clamp-2">{description}</p>
      )}

      {/* System prompt preview */}
      {systemPrompt && (
        <p className="text-xs text-slate-600 line-clamp-2 font-mono bg-white/3 rounded-lg px-3 py-2 border border-white/5">
          {systemPrompt}
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
          T: {temperature.toFixed(1)} · {maxTokens} tok
        </div>
      </div>
    </GlassCard>
  );
}
