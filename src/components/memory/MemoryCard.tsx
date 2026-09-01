"use client";

import { useState } from "react";
import { MoreHorizontal, Archive, Trash2, Edit2, Brain, ShieldCheck, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { GlassCard } from "@/components/shared/GlassCard";
import { cn, formatRelativeTime } from "@/lib/utils";
import type { MemoryDoc, AppwriteDoc } from "@/lib/db";
type Memory = AppwriteDoc<MemoryDoc>;

const categoryConfig: Record<string, { label: string; color: string; bg: string }> = {
  EPISODIC:   { label: "Episodic",   color: "text-coral-400", bg: "bg-coral-500/10" },
  SEMANTIC:   { label: "Semantic",   color: "text-teal-400",   bg: "bg-teal-500/10" },
  PREFERENCE: { label: "Preference", color: "text-gold-400",   bg: "bg-gold-500/10" },
  PROCEDURAL: { label: "Procedural", color: "text-coral-400",  bg: "bg-coral-500/10" },
};

const DEFAULT_CFG = { label: "Memory", color: "text-slate-400", bg: "bg-white/5" };

interface Props {
  memory: Memory;
  onEdit: (memory: Memory) => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
  onVerify?: (id: string) => void;
  verifying?: boolean;
}

export function MemoryCard({ memory, onEdit, onArchive, onDelete, onVerify, verifying }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);

  if (!memory?.$id) return null;

  const cfg = (typeof memory.category === "string" && categoryConfig[memory.category]) ? categoryConfig[memory.category] : DEFAULT_CFG;
  const rawImportance = typeof memory.importance === "number" ? memory.importance : parseFloat(String(memory.importance));
  const importance = isNaN(rawImportance) ? 0.5 : Math.max(0, Math.min(1, rawImportance));
  const importancePct = Math.round(importance * 100);
  const importanceTier =
    importance >= 0.75 ? "max" :
    importance >= 0.5  ? "high" :
    importance >= 0.25 ? "medium" : "low";

  const rawTags = Array.isArray(memory.tags) ? memory.tags : [];
  const tags = rawTags
    .filter((t) => t !== null && t !== undefined)
    .map((t) => String(t));

  const content = typeof memory.content === "string" ? memory.content : String(memory.content ?? "");
  const createdAt = memory.$createdAt ? new Date(memory.$createdAt) : new Date();

  return (
    <GlassCard
      className={cn(
        "p-4 flex flex-col gap-3",
        memory.isArchived && "opacity-50"
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div
          className={cn(
            "inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-medium",
            cfg.bg,
            cfg.color
          )}
        >
          {cfg.label}
        </div>

        <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-7 w-7 text-slate-500 hover:text-foreground opacity-100",
                !menuOpen && "md:opacity-0 md:group-hover:opacity-100"
              )}
            >
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(memory)}>
              <Edit2 className="w-4 h-4 text-slate-400" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onArchive(memory.$id)}>
              <Archive className="w-4 h-4 text-slate-400" /> Archive
            </DropdownMenuItem>
            {onVerify && memory.verificationStatus !== "verified" && (
              <DropdownMenuItem onClick={() => onVerify(memory.$id)} disabled={verifying}>
                <Link2 className="w-4 h-4 text-slate-400" /> {verifying ? "Verifying…" : "Verify on-chain"}
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-400 focus:text-red-300 focus:bg-red-500/10"
              onClick={() => onDelete(memory.$id)}
            >
              <Trash2 className="w-4 h-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Content */}
      <p className="text-sm text-slate-300 leading-relaxed line-clamp-3">
        {content}
      </p>

      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {tags.slice(0, 4).map((tag, i) => (
            <span
              key={`${tag}-${i}`}
              className="text-[11px] px-2 py-0.5 rounded-lg bg-white/[0.04] text-slate-400 border border-white/[0.04]"
            >
              {tag}
            </span>
          ))}
          {tags.length > 4 && (
            <span className="text-[11px] text-slate-600">+{tags.length - 4}</span>
          )}
        </div>
      )}

      {/* Related memories */}
      {Array.isArray(memory.relatedSnippets) && memory.relatedSnippets.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {memory.relatedSnippets.slice(0, 3).map((r) => (
            <span
              key={r.$id}
              className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-lg bg-coral-500/10 text-coral-400 border border-coral-500/10"
              title={r.content}
            >
              <Link2 className="w-3 h-3 shrink-0" />
              {r.content.length > 28 ? `${r.content.slice(0, 28)}…` : r.content}
            </span>
          ))}
          {memory.relatedSnippets.length > 3 && (
            <span className="text-[11px] text-slate-600">+{memory.relatedSnippets.length - 3} more</span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-white/5">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-600">{formatRelativeTime(createdAt)}</span>
          {memory.verificationStatus === "verified" && memory.attestationUid && (
            <a
              href={`https://base.easscan.org/attestation/view/${memory.attestationUid}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-teal-400 hover:text-teal-300 transition-colors"
              title="Verified on Base. View attestation"
            >
              <ShieldCheck className="w-3 h-3" /> Verified
            </a>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <div
            className={`importance-dot importance-dot--${importanceTier}`}
            title={`Importance: ${importancePct}%`}
          />
          <span className="text-xs text-slate-600">{importancePct}%</span>
        </div>
      </div>
    </GlassCard>
  );
}
