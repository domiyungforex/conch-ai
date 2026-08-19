"use client";

import { useState } from "react";
import {
  Plus, Brain, X, AlertCircle, RefreshCw,
  GitBranch, ShieldCheck, FileText, Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { GlassCard } from "@/components/shared/GlassCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { UpgradeGate } from "@/components/shared/UpgradeGate";
import { useContextObjects, useDecisions, useConstraints } from "@/hooks/useContext";
import { formatRelativeTime, truncate } from "@/lib/utils";
import type { ContextObjectDoc, DecisionDoc, ConstraintDoc, AppwriteDoc } from "@/lib/db";

type ContextObject = AppwriteDoc<ContextObjectDoc>;
type Decision = AppwriteDoc<DecisionDoc>;
type Constraint = AppwriteDoc<ConstraintDoc>;

const CONTEXT_TYPES = [
  "ALL", "memory", "intent", "goal", "decision", "constraint",
  "assumption", "instruction", "preference", "task_state", "knowledge",
] as const;

const TYPE_COLORS: Record<string, string> = {
  memory: "cyan",
  intent: "default",
  goal: "green",
  decision: "yellow",
  constraint: "red",
  assumption: "secondary",
  instruction: "default",
  preference: "cyan",
  task_state: "green",
  knowledge: "default",
};

const TYPE_ICONS: Record<string, React.ElementType> = {
  memory: Brain,
  decision: GitBranch,
  constraint: ShieldCheck,
  goal: FileText,
  intent: FileText,
  assumption: FileText,
  instruction: FileText,
  preference: Brain,
  task_state: FileText,
  knowledge: FileText,
};

// ── Context Object Card ────────────────────────────────────────────────────

function ContextCard({ obj, onDelete }: { obj: ContextObject; onDelete: (id: string) => void }) {
  const Icon = TYPE_ICONS[obj.type] ?? Brain;
  return (
    <GlassCard hover className="p-5 relative group">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-coral-500/10 flex items-center justify-center">
            <Icon className="w-4 h-4 text-coral-400" />
          </div>
          <Badge variant={(TYPE_COLORS[obj.type] as "cyan" | "default" | "green" | "red" | "secondary" | "yellow") ?? "default"}>
            {obj.type}
          </Badge>
        </div>
        <button
          onClick={() => onDelete(obj.$id)}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
      <p className="text-sm text-white leading-relaxed mb-3">{truncate(obj.content, 200)}</p>
      <div className="flex items-center gap-3 text-xs text-slate-500">
        <span>Importance: {Math.round(obj.importance * 100)}%</span>
        <span>·</span>
        <span>Confidence: {Math.round(obj.confidence * 100)}%</span>
        <span>·</span>
        <span>{formatRelativeTime(obj.$createdAt)}</span>
      </div>
      {obj.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {obj.tags.slice(0, 5).map((t) => (
            <span key={t} className="px-1.5 py-0.5 rounded-full bg-white/5 border border-white/8 text-[10px] text-slate-400">
              {t}
            </span>
          ))}
          {obj.tags.length > 5 && (
            <span className="text-[10px] text-slate-500">+{obj.tags.length - 5}</span>
          )}
        </div>
      )}
    </GlassCard>
  );
}

// ── Decision Card ──────────────────────────────────────────────────────────

function DecisionCard({ decision }: { decision: Decision }) {
  return (
    <GlassCard hover className="p-5">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center shrink-0">
          <GitBranch className="w-4 h-4 text-yellow-400" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-white leading-snug">{decision.what}</h3>
          <p className="text-xs text-slate-500 mt-0.5">by {decision.who} · {formatRelativeTime(decision.$createdAt)}</p>
        </div>
        <Badge variant="yellow">{decision.status}</Badge>
      </div>
      <div className="space-y-2 ml-11">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-slate-600 mb-0.5">Why</p>
          <p className="text-sm text-slate-300 leading-relaxed">{decision.why}</p>
        </div>
        {decision.alternatives && (
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-600 mb-0.5">Alternatives</p>
            <p className="text-sm text-slate-400 leading-relaxed">{truncate(decision.alternatives, 200)}</p>
          </div>
        )}
        {decision.constraints && (
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-600 mb-0.5">Constraints</p>
            <p className="text-sm text-slate-400 leading-relaxed">{truncate(decision.constraints, 200)}</p>
          </div>
        )}
      </div>
    </GlassCard>
  );
}

// ── Constraint Card ────────────────────────────────────────────────────────

function ConstraintCard({ constraint }: { constraint: Constraint }) {
  return (
    <GlassCard hover className="p-4">
      <div className="flex items-start gap-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${constraint.severity === "hard" ? "bg-red-500/10" : "bg-amber-500/10"}`}>
          <ShieldCheck className={`w-4 h-4 ${constraint.severity === "hard" ? "text-red-400" : "text-amber-400"}`} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant={constraint.severity === "hard" ? "red" : "yellow"}>
              {constraint.severity}
            </Badge>
            <span className="text-xs text-slate-500">{constraint.category}</span>
          </div>
          <p className="text-sm text-white leading-relaxed">{constraint.content}</p>
          <p className="text-xs text-slate-500 mt-1">{formatRelativeTime(constraint.$createdAt)}</p>
        </div>
      </div>
    </GlassCard>
  );
}

// ── Create Dialog ──────────────────────────────────────────────────────────

function ContextCreateDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [type, setType] = useState("memory");
  const [content, setContent] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [importance, setImportance] = useState(0.5);
  const [confidence, setConfidence] = useState(0.5);
  const { create } = useContextObjects();

  const addTag = (raw: string) => {
    const newTags = raw.split(/[,\s]+/).map((t) => t.trim().toLowerCase()).filter(Boolean);
    setTags((prev) => [...new Set([...prev, ...newTags])]);
    setTagInput("");
  };

  const reset = () => {
    setType("memory"); setContent(""); setTags([]); setTagInput("");
    setImportance(0.5); setConfidence(0.5);
  };

  const handleSubmit = async () => {
    if (!content.trim()) return;
    try {
      await create.mutateAsync({ type, content, importance, confidence, tags });
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
          <DialogTitle className="text-white">Add Context</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div>
            <Label className="text-slate-300 mb-1.5 block">Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONTEXT_TYPES.filter((t) => t !== "ALL").map((t) => (
                  <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1).replace("_", " ")}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-slate-300 mb-1.5 block">Content *</Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What should Conch remember?"
              rows={4}
              className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 resize-none"
              maxLength={10000}
            />
            <p className="text-xs text-slate-600 mt-1 text-right">{content.length}/10000</p>
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-slate-300 mb-1.5 block">Importance: {Math.round(importance * 100)}%</Label>
              <Slider value={[importance]} onValueChange={([v]) => setImportance(v)} min={0} max={1} step={0.05} className="mt-2" />
            </div>
            <div>
              <Label className="text-slate-300 mb-1.5 block">Confidence: {Math.round(confidence * 100)}%</Label>
              <Slider value={[confidence]} onValueChange={([v]) => setConfidence(v)} min={0} max={1} step={0.05} className="mt-2" />
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-4 justify-end">
          <Button variant="secondary" onClick={() => { reset(); onClose(); }}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!content.trim() || create.isPending}>
            {create.isPending && <LoadingSpinner size="sm" />}
            {create.isPending ? "Saving…" : "Save Context"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Decision Create Dialog ─────────────────────────────────────────────────

function DecisionCreateDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [what, setWhat] = useState("");
  const [why, setWhy] = useState("");
  const [alternatives, setAlternatives] = useState("");
  const [decisionConstraints, setDecisionConstraints] = useState("");
  const { create } = useDecisions();

  const reset = () => { setWhat(""); setWhy(""); setAlternatives(""); setDecisionConstraints(""); };

  const handleSubmit = async () => {
    if (!what.trim() || !why.trim()) return;
    try {
      await create.mutateAsync({ what, why, alternatives, constraints: decisionConstraints });
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
          <DialogTitle className="text-white">Record a Decision</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div>
            <Label className="text-slate-300 mb-1.5 block">What was decided *</Label>
            <Input
              value={what}
              onChange={(e) => setWhat(e.target.value)}
              placeholder="e.g. Use Anthropic for model infrastructure"
              className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
              maxLength={2000}
            />
          </div>

          <div>
            <Label className="text-slate-300 mb-1.5 block">Why *</Label>
            <Textarea
              value={why}
              onChange={(e) => setWhy(e.target.value)}
              placeholder="The reasoning behind this decision"
              rows={3}
              className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 resize-none"
              maxLength={2000}
            />
          </div>

          <div>
            <Label className="text-slate-300 mb-1.5 block">Alternatives considered</Label>
            <Textarea
              value={alternatives}
              onChange={(e) => setAlternatives(e.target.value)}
              placeholder="Other options that were considered"
              rows={2}
              className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 resize-none"
              maxLength={2000}
            />
          </div>

          <div>
            <Label className="text-slate-300 mb-1.5 block">Constraints</Label>
            <Input
              value={decisionConstraints}
              onChange={(e) => setDecisionConstraints(e.target.value)}
              placeholder="Any constraints that applied"
              className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
              maxLength={2000}
            />
          </div>
        </div>

        <div className="flex gap-3 mt-4 justify-end">
          <Button variant="secondary" onClick={() => { reset(); onClose(); }}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!what.trim() || !why.trim() || create.isPending}>
            {create.isPending && <LoadingSpinner size="sm" />}
            {create.isPending ? "Saving…" : "Record Decision"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Constraint Create Dialog ───────────────────────────────────────────────

function ConstraintCreateDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [severity, setSeverity] = useState<"hard" | "soft">("hard");
  const { create } = useConstraints();

  const reset = () => { setContent(""); setCategory(""); setSeverity("hard"); };

  const handleSubmit = async () => {
    if (!content.trim() || !category.trim()) return;
    try {
      await create.mutateAsync({ content, category, severity });
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
          <DialogTitle className="text-white">Add Constraint</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div>
            <Label className="text-slate-300 mb-1.5 block">Constraint *</Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="e.g. Never spend more than $50/month on API calls"
              rows={3}
              className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 resize-none"
              maxLength={2000}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-slate-300 mb-1.5 block">Category *</Label>
              <Input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. budget, security, brand"
                className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                maxLength={100}
              />
            </div>
            <div>
              <Label className="text-slate-300 mb-1.5 block">Severity</Label>
              <Select value={severity} onValueChange={(v) => setSeverity(v as "hard" | "soft")}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hard">Hard (must not violate)</SelectItem>
                  <SelectItem value="soft">Soft (prefer to respect)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-4 justify-end">
          <Button variant="secondary" onClick={() => { reset(); onClose(); }}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!content.trim() || !category.trim() || create.isPending}>
            {create.isPending && <LoadingSpinner size="sm" />}
            {create.isPending ? "Saving…" : "Add Constraint"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

export default function ContextPage() {
  const [activeTab, setActiveTab] = useState("context");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [createOpen, setCreateOpen] = useState(false);
  const [decisionCreateOpen, setDecisionCreateOpen] = useState(false);
  const [constraintCreateOpen, setConstraintCreateOpen] = useState(false);

  const { data: contextObjects, isLoading: ctxLoading, isError: ctxError, error: ctxErr, refetch: ctxRefetch, remove: ctxRemove } = useContextObjects(
    typeFilter !== "ALL" ? typeFilter : undefined
  );
  const { data: decisions, isLoading: decLoading, isError: decError, error: decErr, refetch: decRefetch } = useDecisions();
  const { data: constraints, isLoading: conLoading, isError: conError, error: conErr, refetch: conRefetch } = useConstraints();

  const handleDeleteContext = (id: string) => {
    ctxRemove.mutate(id);
  };

  const openCreate = () => {
    if (activeTab === "context") setCreateOpen(true);
    else if (activeTab === "decisions") setDecisionCreateOpen(true);
    else setConstraintCreateOpen(true);
  };

  const createLabel = activeTab === "context" ? "Add Context" : activeTab === "decisions" ? "Record Decision" : "Add Constraint";

  return (
    <UpgradeGate>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-normal text-white">Context</h1>
            <p className="text-sm text-slate-400 mt-0.5">Decisions, constraints, and structured context for your agents</p>
          </div>
          <Button onClick={openCreate} className="gap-2">
            <Plus className="w-4 h-4" /> {createLabel}
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="glass border border-white/10 h-9">
              <TabsTrigger value="context" className="text-xs px-3 data-[state=active]:bg-coral-600/30 data-[state=active]:text-coral-200">
                Context Objects
              </TabsTrigger>
              <TabsTrigger value="decisions" className="text-xs px-3 data-[state=active]:bg-coral-600/30 data-[state=active]:text-coral-200">
                Decisions
              </TabsTrigger>
              <TabsTrigger value="constraints" className="text-xs px-3 data-[state=active]:bg-coral-600/30 data-[state=active]:text-coral-200">
                Constraints
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Type filter for context tab */}
          {activeTab === "context" && (
            <Tabs value={typeFilter} onValueChange={setTypeFilter}>
              <TabsList className="glass border border-white/10 h-9 overflow-x-auto">
                {CONTEXT_TYPES.slice(0, 7).map((t) => (
                  <TabsTrigger
                    key={t}
                    value={t}
                    className="text-xs px-2.5 data-[state=active]:bg-coral-600/30 data-[state=active]:text-coral-200"
                  >
                    {t === "ALL" ? "All" : t.charAt(0).toUpperCase() + t.slice(1).replace("_", " ")}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          )}
        </div>

        {/* Context Objects Tab */}
        {activeTab === "context" && (
          <>
            {ctxError ? (
              <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
                <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <p className="text-white font-medium">Failed to load context</p>
                  <p className="text-sm text-slate-400 mt-1">{(ctxErr as Error)?.message ?? "An unexpected error occurred."}</p>
                </div>
                <Button variant="secondary" onClick={() => ctxRefetch()} className="gap-2">
                  <RefreshCw className="w-4 h-4" /> Retry
                </Button>
              </div>
            ) : ctxLoading ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Skeleton key={i} className="h-44 rounded-2xl bg-white/5" />
                ))}
              </div>
            ) : !contextObjects?.length ? (
              <EmptyState
                icon={Brain}
                title="No context objects yet"
                description="Store your first context object — intents, goals, preferences, knowledge — to start building your agent's understanding."
                action={{ label: "Add Context", onClick: () => setCreateOpen(true) }}
              />
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {contextObjects.map((obj) => (
                  <ContextCard key={obj.$id} obj={obj} onDelete={handleDeleteContext} />
                ))}
              </div>
            )}
          </>
        )}

        {/* Decisions Tab */}
        {activeTab === "decisions" && (
          <>
            {decError ? (
              <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
                <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <p className="text-white font-medium">Failed to load decisions</p>
                  <p className="text-sm text-slate-400 mt-1">{(decErr as Error)?.message ?? "An unexpected error occurred."}</p>
                </div>
                <Button variant="secondary" onClick={() => decRefetch()} className="gap-2">
                  <RefreshCw className="w-4 h-4" /> Retry
                </Button>
              </div>
            ) : decLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-36 rounded-2xl bg-white/5" />
                ))}
              </div>
            ) : !decisions?.length ? (
              <EmptyState
                icon={GitBranch}
                title="No decisions recorded"
                description="Record your first decision — what you decided, why, what alternatives existed — so future agents understand the reasoning."
                action={{ label: "Record Decision", onClick: () => setDecisionCreateOpen(true) }}
              />
            ) : (
              <div className="space-y-4">
                {decisions.map((d) => (
                  <DecisionCard key={d.$id} decision={d} />
                ))}
              </div>
            )}
          </>
        )}

        {/* Constraints Tab */}
        {activeTab === "constraints" && (
          <>
            {conError ? (
              <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
                <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <p className="text-white font-medium">Failed to load constraints</p>
                  <p className="text-sm text-slate-400 mt-1">{(conErr as Error)?.message ?? "An unexpected error occurred."}</p>
                </div>
                <Button variant="secondary" onClick={() => conRefetch()} className="gap-2">
                  <RefreshCw className="w-4 h-4" /> Retry
                </Button>
              </div>
            ) : conLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-24 rounded-2xl bg-white/5" />
                ))}
              </div>
            ) : !constraints?.length ? (
              <EmptyState
                icon={ShieldCheck}
                title="No constraints defined"
                description="Add your first constraint — budget limits, security rules, brand guidelines — that agents must respect."
                action={{ label: "Add Constraint", onClick: () => setConstraintCreateOpen(true) }}
              />
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {constraints.map((c) => (
                  <ConstraintCard key={c.$id} constraint={c} />
                ))}
              </div>
            )}
          </>
        )}

        {/* Create Dialogs */}
        <ContextCreateDialog open={createOpen} onClose={() => setCreateOpen(false)} />
        <DecisionCreateDialog open={decisionCreateOpen} onClose={() => setDecisionCreateOpen(false)} />
        <ConstraintCreateDialog open={constraintCreateOpen} onClose={() => setConstraintCreateOpen(false)} />
      </div>
    </UpgradeGate>
  );
}
