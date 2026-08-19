"use client";

import { useState } from "react";
import { Plus, Folder, X, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { GlassCard } from "@/components/shared/GlassCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { UpgradeGate } from "@/components/shared/UpgradeGate";
import { useProjects } from "@/hooks/useProjects";
import { formatRelativeTime } from "@/lib/utils";
import type { ProjectDoc, AppwriteDoc } from "@/lib/db";

type Project = AppwriteDoc<ProjectDoc>;

const STATUS_COLORS: Record<string, string> = {
  active: "green",
  paused: "yellow",
  completed: "cyan",
  archived: "secondary",
};

// ── Project Card ───────────────────────────────────────────────────────────

function ProjectCard({ project }: { project: Project }) {
  return (
    <GlassCard hover className="p-5 h-full flex flex-col">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-coral-500/10 flex items-center justify-center">
            <Folder className="w-4.5 h-4.5 text-coral-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white leading-snug">{project.name}</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">{formatRelativeTime(project.$updatedAt)}</p>
          </div>
        </div>
        <Badge variant={(STATUS_COLORS[project.status] as "green" | "yellow" | "cyan" | "secondary") ?? "secondary"}>
          {project.status}
        </Badge>
      </div>

      {project.description && (
        <p className="text-sm text-slate-400 leading-relaxed mb-3 flex-1 line-clamp-3">
          {project.description}
        </p>
      )}

      {!project.description && <div className="flex-1" />}

      <div className="flex items-center gap-3 text-xs text-slate-500 mt-auto pt-3 border-t border-white/5">
        <span>{project.agentIds?.length ?? 0} agents</span>
        <span>·</span>
        <span>{project.memoryIds?.length ?? 0} memories</span>
      </div>

      {project.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {project.tags.slice(0, 4).map((t) => (
            <span key={t} className="px-1.5 py-0.5 rounded-full bg-white/5 border border-white/8 text-[10px] text-slate-400">
              {t}
            </span>
          ))}
          {project.tags.length > 4 && (
            <span className="text-[10px] text-slate-500">+{project.tags.length - 4}</span>
          )}
        </div>
      )}
    </GlassCard>
  );
}

// ── Create Dialog ──────────────────────────────────────────────────────────

function ProjectCreateDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const { create } = useProjects();

  const addTag = (raw: string) => {
    const newTags = raw.split(/[,\s]+/).map((t) => t.trim().toLowerCase()).filter(Boolean);
    setTags((prev) => [...new Set([...prev, ...newTags])]);
    setTagInput("");
  };

  const reset = () => { setName(""); setDescription(""); setTags([]); setTagInput(""); };

  const handleSubmit = async () => {
    if (!name.trim()) return;
    try {
      await create.mutateAsync({ name, description, tags });
      reset();
      onClose();
    } catch {
      // Error toast already shown
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { reset(); onClose(); } }}>
      <DialogContent className="glass border-white/10 max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-white">Create Project</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div>
            <Label className="text-slate-300 mb-1.5 block">Name *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Website Redesign, Mobile App v2"
              className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
              maxLength={200}
            />
          </div>

          <div>
            <Label className="text-slate-300 mb-1.5 block">Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this project about?"
              rows={3}
              className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 resize-none"
              maxLength={2000}
            />
          </div>

          <div>
            <Label className="text-slate-300 mb-1.5 block">Tags</Label>
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(tagInput); } }}
              onBlur={() => tagInput && addTag(tagInput)}
              placeholder="Add tags (press Enter or comma)"
              className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
            />
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {tags.map((t) => (
                  <span key={t} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-coral-500/15 border border-coral-500/30 text-xs text-coral-300">
                    {t}
                    <button onClick={() => setTags((prev) => prev.filter((x) => x !== t))} className="hover:text-white">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3 mt-4 justify-end">
          <Button variant="secondary" onClick={() => { reset(); onClose(); }}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!name.trim() || create.isPending}>
            {create.isPending && <LoadingSpinner size="sm" />}
            {create.isPending ? "Creating…" : "Create Project"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

export default function ProjectsPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const { data: projects, isLoading, isError, error, refetch } = useProjects();

  return (
    <UpgradeGate>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-normal text-white">Projects</h1>
            <p className="text-sm text-slate-400 mt-0.5">Organize context, agents, and decisions by project</p>
          </div>
          <Button onClick={() => setCreateOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" /> New Project
          </Button>
        </div>

        {/* Error state */}
        {isError && (
          <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <p className="text-white font-medium">Failed to load projects</p>
              <p className="text-sm text-slate-400 mt-1">{(error as Error)?.message ?? "An unexpected error occurred."}</p>
            </div>
            <Button variant="secondary" onClick={() => refetch()} className="gap-2">
              <RefreshCw className="w-4 h-4" /> Retry
            </Button>
          </div>
        )}

        {/* Grid */}
        {!isError && (
          <>
            {isLoading ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-52 rounded-2xl bg-white/5" />
                ))}
              </div>
            ) : !projects?.length ? (
              <EmptyState
                icon={Folder}
                title="No projects yet"
                description="Create your first project to organize context, agents, and decisions together."
                action={{ label: "Create Project", onClick: () => setCreateOpen(true) }}
              />
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {projects.map((project) => (
                  <ProjectCard key={project.$id} project={project} />
                ))}
              </div>
            )}
          </>
        )}

        <ProjectCreateDialog open={createOpen} onClose={() => setCreateOpen(false)} />
      </div>
    </UpgradeGate>
  );
}
