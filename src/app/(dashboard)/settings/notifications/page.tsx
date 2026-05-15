"use client";

import { useState } from "react";
import { GlassCard } from "@/components/shared/GlassCard";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const DEFAULT_PREFS = {
  chatSummaries: true,
  memoryInsights: true,
  agentAlerts: false,
  weeklyDigest: true,
  productUpdates: false,
};

export default function NotificationsPage() {
  const [prefs, setPrefs] = useState(DEFAULT_PREFS);
  const [saved, setSaved] = useState(false);

  const toggle = (key: keyof typeof DEFAULT_PREFS) =>
    setPrefs((p) => ({ ...p, [key]: !p[key] }));

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const items = [
    { key: "chatSummaries" as const, label: "Chat Summaries", desc: "Weekly summary of your AI conversations." },
    { key: "memoryInsights" as const, label: "Memory Insights", desc: "When new patterns are detected in your memory." },
    { key: "agentAlerts" as const, label: "Agent Alerts", desc: "Alerts when your agents complete tasks." },
    { key: "weeklyDigest" as const, label: "Weekly Digest", desc: "Your Conch activity summary every Monday." },
    { key: "productUpdates" as const, label: "Product Updates", desc: "News about new features and improvements." },
  ];

  return (
    <div className="space-y-4">
      <GlassCard className="p-6">
        <h2 className="text-base font-semibold text-white mb-6">Email Notifications</h2>
        <div className="space-y-5">
          {items.map(({ key, label, desc }) => (
            <div key={key} className="flex items-start justify-between gap-4">
              <div>
                <Label className="text-sm font-medium text-white">{label}</Label>
                <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
              </div>
              <Switch checked={prefs[key]} onCheckedChange={() => toggle(key)} />
            </div>
          ))}
        </div>
        <div className="mt-6 pt-4 border-t border-white/8">
          <Button onClick={handleSave}>{saved ? "Saved ✓" : "Save Preferences"}</Button>
        </div>
      </GlassCard>
    </div>
  );
}
