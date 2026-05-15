"use client";

import { useState } from "react";
import { MoreHorizontal, Archive, Trash2, Edit2, Brain } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { GlassCard } from "@/components/shared/GlassCard";
import { cn, formatRelativeTime, truncate } from "@/lib/utils";
import type { Memory } from "@prisma/client";

const categoryConfig = {
  EPISODIC: { label: "Episodic", color: "text-violet-300", bg: "bg-violet-500/15 border-violet-500/30" },
  SEMANTIC: { label: "Semantic", color: "text-cyan-300", bg: "bg-cyan-500/15 border-cyan-500/30" },
  PREFERENCE: { label: "Preference", color: "text-amber-300", bg: "bg-amber-500/15 border-amber-500/30" },
  PROCEDURAL: { label: "Procedural", color: "text-emerald-300", bg: "bg-emerald-500/15 border-emerald-500/30" },
} as const;

interface Props {
  memory: Memory;
  onEdit: (memory: Memory) => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
}

export function MemoryCard({ memory, onEdit, onArchive, onDelete }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const cfg = categoryConfig[memory.category];
  const importancePct = Math.round(memory.importance * 100);

  return (
    <GlassCard className={cn("p-4 flex flex-col gap-3 group hover:bg-white/6 transition-colors relative", memory.isArchived && "opacity-50")}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border", cfg.bg, cfg.color)}>
          <Brain className="w-3 h-3" />
          {cfg.label}
        </div>

        <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn("h-7 w-7 text-slate-500 hover:text-white", !menuOpen && "opacity-0 group-hover:opacity-100")}
            >
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(memory)}>
              <Edit2 className="w-4 h-4 text-slate-400" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onArchive(memory.id)}>
              <Archive className="w-4 h-4 text-slate-400" /> Archive
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-400 focus:text-red-300 focus:bg-red-500/10"
              onClick={() => onDelete(memory.id)}
            >
              <Trash2 className="w-4 h-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Content */}
      <p className="text-sm text-slate-300 leading-relaxed line-clamp-3">
        {memory.content}
      </p>

      {/* Tags */}
      {memory.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {memory.tags.slice(0, 4).map((tag) => (
            <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-white/5 border border-white/8 text-slate-400">
              {tag}
            </span>
          ))}
          {memory.tags.length > 4 && (
            <span className="text-xs text-slate-600">+{memory.tags.length - 4}</span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-1 border-t border-white/5">
        <span className="text-xs text-slate-600">{formatRelativeTime(memory.createdAt)}</span>
        <div className="flex items-center gap-1.5">
          <div
            className="w-2 h-2 rounded-full"
            style={{
              background: `rgba(124, 58, 237, ${0.2 + memory.importance * 0.8})`,
              boxShadow: `0 0 ${4 + importancePct / 10}px rgba(124, 58, 237, ${memory.importance * 0.6})`,
            }}
            title={`Importance: ${importancePct}%`}
          />
          <span className="text-xs text-slate-600">{importancePct}%</span>
        </div>
      </div>
    </GlassCard>
  );
}
