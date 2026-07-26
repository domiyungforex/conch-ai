"use client";

import { CheckCircle2, Sparkles } from "lucide-react";
import { GlassCard } from "@/components/shared/GlassCard";
import { Button } from "@/components/ui/button";
import { useActivatedModules } from "@/hooks/useActivatedModules";
import { MODULE_REGISTRY, MODULE_NAV_ITEMS } from "@/lib/modules";

export default function FeaturesPage() {
  const { isActivated, activate, deactivate, hydrated } = useActivatedModules();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Activate other features</h1>
        <p className="text-sm text-slate-400 mt-1">
          These are fully built and working — they just stay out of your sidebar until you turn them on, so it
          doesn&apos;t get cluttered with things you don&apos;t use. Activating one adds it to your Modules section;
          deactivating just hides the link again, nothing gets deleted.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {MODULE_NAV_ITEMS.map(({ key }) => {
          const info = MODULE_REGISTRY[key];
          const on = hydrated && isActivated(key);
          return (
            <GlassCard key={key} className="p-6">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4 text-coral-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">{info.label}</h3>
                    <p className="text-xs text-coral-300 mt-0.5">{info.tagline}</p>
                  </div>
                </div>
              </div>

              <p className="text-sm text-slate-400 mb-4">{info.description}</p>

              {on ? (
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-1.5 text-xs text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    In your sidebar
                  </span>
                  <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => deactivate(key)}>
                    Hide from sidebar
                  </Button>
                </div>
              ) : (
                <Button size="sm" className="h-8 text-xs" onClick={() => activate(key)}>
                  Activate
                </Button>
              )}
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
}
