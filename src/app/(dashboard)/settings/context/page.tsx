"use client";

import { GlassCard } from "@/components/shared/GlassCard";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useUserSettings } from "@/hooks/useUserSettings";

const RETENTION_OPTIONS = [
  { value: "0", label: "Never auto-archive" },
  { value: "30", label: "After 30 days" },
  { value: "60", label: "After 60 days" },
  { value: "90", label: "After 90 days" },
  { value: "180", label: "After 6 months" },
  { value: "365", label: "After 1 year" },
];

export default function ContextSettingsPage() {
  const { data: settings, isLoading, isError, update } = useUserSettings();

  return (
    <div className="space-y-6">
      {/* Default Values */}
      <GlassCard className="p-6">
        <h2 className="text-base font-semibold text-white mb-1">Default Values</h2>
        <p className="text-xs text-slate-400 mb-6">
          Applied to new context objects, decisions, and constraints when you don&apos;t specify them explicitly.
        </p>

        {isLoading ? (
          <div className="space-y-6">
            <Skeleton className="h-16 rounded-lg bg-white/5" />
            <Skeleton className="h-16 rounded-lg bg-white/5" />
          </div>
        ) : isError || !settings ? (
          <p className="text-sm text-red-400">Couldn&apos;t load your settings. Try refreshing.</p>
        ) : (
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-medium text-white">Default Importance</Label>
                <span className="text-sm text-coral-300 font-mono">
                  {Math.round(settings.contextDefaultImportance * 100)}%
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-3">
                How important new context objects are by default. Higher values rank them higher in retrieval.
              </p>
              <Slider
                value={[settings.contextDefaultImportance]}
                onValueChange={([v]) => update.mutate({ contextDefaultImportance: v })}
                min={0}
                max={1}
                step={0.05}
              />
              <div className="flex justify-between text-[10px] text-slate-600 mt-1">
                <span>Low (0%)</span>
                <span>Normal (50%)</span>
                <span>Critical (100%)</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-medium text-white">Default Confidence</Label>
                <span className="text-sm text-coral-300 font-mono">
                  {Math.round(settings.contextDefaultConfidence * 100)}%
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-3">
                How confident you are in new context objects by default. Higher values signal well-established facts.
              </p>
              <Slider
                value={[settings.contextDefaultConfidence]}
                onValueChange={([v]) => update.mutate({ contextDefaultConfidence: v })}
                min={0}
                max={1}
                step={0.05}
              />
              <div className="flex justify-between text-[10px] text-slate-600 mt-1">
                <span>Speculative (0%)</span>
                <span>Likely (50%)</span>
                <span>Certain (100%)</span>
              </div>
            </div>
          </div>
        )}
      </GlassCard>

      {/* Retention Policy */}
      <GlassCard className="p-6">
        <h2 className="text-base font-semibold text-white mb-1">Retention Policy</h2>
        <p className="text-xs text-slate-400 mb-6">
          Control how long context objects stay active before being automatically archived.
        </p>

        {isLoading ? (
          <Skeleton className="h-12 rounded-lg bg-white/5" />
        ) : isError || !settings ? (
          <p className="text-sm text-red-400">Couldn&apos;t load your settings. Try refreshing.</p>
        ) : (
          <div className="space-y-5">
            <div>
              <Label className="text-sm font-medium text-white mb-2 block">Auto-archive After</Label>
              <p className="text-xs text-slate-500 mb-3">
                Context objects older than this will be automatically moved to archived status.
                Archived objects are excluded from retrieval but can be restored.
              </p>
              <Select
                value={String(settings.contextRetentionDays)}
                onValueChange={(v) => update.mutate({ contextRetentionDays: Number(v) })}
              >
                <SelectTrigger className="bg-white/5 border-white/10 text-white w-full sm:w-64">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RETENTION_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-start justify-between gap-4">
              <div>
                <Label className="text-sm font-medium text-white">Auto-archive Stale Context</Label>
                <p className="text-xs text-slate-500 mt-0.5">
                  Automatically archive context objects that haven&apos;t been accessed or updated recently.
                  Stale context clutters retrieval results.
                </p>
              </div>
              <Switch
                checked={settings.contextAutoArchive}
                onCheckedChange={(checked) => update.mutate({ contextAutoArchive: checked })}
              />
            </div>
          </div>
        )}
      </GlassCard>

      {/* Info */}
      <GlassCard className="p-6">
        <h2 className="text-base font-semibold text-white mb-3">How Context Settings Work</h2>
        <div className="space-y-3 text-sm text-slate-400 leading-relaxed">
          <p>
            <strong className="text-slate-300">Importance</strong> affects how context objects rank during retrieval.
            A decision with 90% importance will appear before a preference at 30% when both are relevant.
          </p>
          <p>
            <strong className="text-slate-300">Confidence</strong> signals how established a piece of context is.
            Speculative assumptions (low confidence) rank below verified facts (high confidence).
          </p>
          <p>
            <strong className="text-slate-300">Retention</strong> keeps your context layer clean. Old, unused context
            gets archived automatically so retrieval stays fast and relevant.
          </p>
          <p>
            These defaults apply when creating context through the API or chat. You can always override them
            per-object when storing context programmatically.
          </p>
        </div>
      </GlassCard>
    </div>
  );
}
