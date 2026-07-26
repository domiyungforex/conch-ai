"use client";

import { useState } from "react";
import { GlassCard } from "@/components/shared/GlassCard";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useAdminFlags, type AdminFlagItem } from "@/hooks/useAdminFlags";
import { FUTURE_MODULES } from "@/lib/modules";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  enabled: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  beta: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  disabled: "bg-slate-500/15 text-slate-300 border-slate-500/30",
};

function FlagRow({ item }: { item: AdminFlagItem }) {
  const { update } = useAdminFlags();
  const [status, setStatus] = useState(item.status);
  const [rollout, setRollout] = useState(item.rolloutPercentage);
  const dirty = status !== item.status || rollout !== item.rolloutPercentage;

  return (
    <div className="p-4 rounded-xl border border-white/8 bg-white/5 space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-white">{item.info.label}</p>
            {FUTURE_MODULES.has(item.key) && (
              <Badge className="text-[10px] bg-white/5 text-slate-400 border-white/10">future</Badge>
            )}
            <Badge className={cn("text-xs", STATUS_STYLES[item.status])}>{item.status}</Badge>
            {item.source === "default" && (
              <span className="text-[10px] text-slate-500">using default — no flag row yet</span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">{item.info.tagline}</p>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
          <SelectTrigger className="w-36 h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="disabled">Disabled</SelectItem>
            <SelectItem value="beta">Beta</SelectItem>
            <SelectItem value="enabled">Enabled</SelectItem>
          </SelectContent>
        </Select>

        {status === "beta" && (
          <div className="flex items-center gap-1.5">
            <Input
              type="number"
              min={0}
              max={100}
              value={rollout}
              onChange={(e) => setRollout(Math.max(0, Math.min(100, Number(e.target.value))))}
              className="w-20 h-8 text-xs"
            />
            <span className="text-xs text-slate-500">% rollout</span>
          </div>
        )}

        <Button
          size="sm"
          className="h-8 text-xs gap-1.5"
          disabled={!dirty || update.isPending}
          onClick={() => update.mutate({ key: item.key, status, rolloutPercentage: rollout })}
        >
          {update.isPending && <LoadingSpinner size="sm" />}
          Save
        </Button>
      </div>

      {item.info.activationCriteria.length > 0 && (
        <div className="pt-2 border-t border-white/5">
          <p className="text-[10px] uppercase tracking-wide text-slate-500 mb-1">Activation criteria</p>
          <ul className="text-xs text-slate-400 space-y-0.5">
            {item.info.activationCriteria.map((c) => (
              <li key={c}>• {c}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function AdminFlagsClient() {
  const { data, isLoading, isError } = useAdminFlags();

  if (isLoading) {
    return (
      <GlassCard className="p-6">
        <div className="h-40 animate-pulse bg-white/5 rounded-xl" />
      </GlassCard>
    );
  }

  if (isError || !data) {
    return (
      <GlassCard className="p-6">
        <p className="text-sm text-red-400">Couldn&apos;t load feature flags.</p>
      </GlassCard>
    );
  }

  const active = data.filter((d) => !FUTURE_MODULES.has(d.key));
  const future = data.filter((d) => FUTURE_MODULES.has(d.key));

  return (
    <div className="space-y-6">
      <GlassCard className="p-6">
        <h2 className="text-base font-semibold text-white mb-4">Active foundation</h2>
        <div className="space-y-3">
          {active.map((item) => <FlagRow key={item.key} item={item} />)}
        </div>
      </GlassCard>

      <GlassCard className="p-6">
        <h2 className="text-base font-semibold text-white mb-4">Future modules</h2>
        <div className="space-y-3">
          {future.map((item) => <FlagRow key={item.key} item={item} />)}
        </div>
      </GlassCard>
    </div>
  );
}
