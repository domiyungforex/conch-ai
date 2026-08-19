"use client";

import { GlassCard } from "@/components/shared/GlassCard";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useUserSettings } from "@/hooks/useUserSettings";

type NotificationKey = "notifyChatSummaries" | "notifyMemoryInsights" | "notifyAgentAlerts" | "notifyWeeklyDigest" | "notifyProductUpdates";

const ITEMS: { key: NotificationKey; label: string; desc: string }[] = [
  { key: "notifyChatSummaries", label: "Conversation Summaries", desc: "A weekly recap of the conversations that became memory." },
  { key: "notifyMemoryInsights", label: "Memory Insights", desc: "When new patterns are detected in what your memory holds." },
  { key: "notifyAgentAlerts", label: "Agent Alerts", desc: "Alerts when your memory-scoped agents complete tasks." },
  { key: "notifyWeeklyDigest", label: "Weekly Digest", desc: "A summary of your memory&apos;s activity every Monday." },
  { key: "notifyProductUpdates", label: "Product Updates", desc: "News about new ways to remember and recall." },
];

export default function NotificationsPage() {
  const { data: settings, isLoading, isError, update } = useUserSettings();

  return (
    <div className="space-y-4">
      <GlassCard className="p-6">
        <h2 className="text-base font-semibold text-white mb-6">Email Notifications</h2>

        {isLoading ? (
          <div className="space-y-5">
            {ITEMS.map((item) => <Skeleton key={item.key} className="h-10 rounded-lg bg-white/5" />)}
          </div>
        ) : isError || !settings ? (
          <p className="text-sm text-red-400">Couldn&apos;t load your notification preferences. Try refreshing.</p>
        ) : (
          <div className="space-y-5">
            {ITEMS.map(({ key, label, desc }) => (
              <div key={key} className="flex items-start justify-between gap-4">
                <div>
                  <Label className="text-sm font-medium text-white">{label}</Label>
                  <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
                </div>
                <Switch
                  checked={!!settings[key]}
                  onCheckedChange={(checked) => update.mutate({ [key]: checked })}
                />
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
}
