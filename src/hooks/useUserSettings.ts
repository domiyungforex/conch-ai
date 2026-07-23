"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/components/ui/toaster";

export interface UserSettings {
  publicProfile: boolean;
  notifyChatSummaries: boolean;
  notifyMemoryInsights: boolean;
  notifyAgentAlerts: boolean;
  notifyWeeklyDigest: boolean;
  notifyProductUpdates: boolean;
}

async function fetchSettings(): Promise<UserSettings> {
  const res = await fetch("/api/user/settings");
  if (!res.ok) throw new Error("Failed to load settings");
  const data = await res.json();
  return data.settings;
}

async function patchSettings(data: Partial<UserSettings>): Promise<UserSettings> {
  const res = await fetch("/api/user/settings", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? "Failed to save settings");
  }
  const body = await res.json();
  return body.settings;
}

export function useUserSettings() {
  const qc = useQueryClient();
  const key = ["userSettings"];

  const query = useQuery({ queryKey: key, queryFn: fetchSettings, staleTime: 30_000 });

  const update = useMutation({
    mutationFn: patchSettings,
    // Optimistic: the switch should look like it worked immediately, and
    // roll back on failure rather than silently reverting on next reload.
    onMutate: async (patch) => {
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<UserSettings>(key);
      if (previous) qc.setQueryData(key, { ...previous, ...patch });
      return { previous };
    },
    onError: (err: Error, _patch, context) => {
      if (context?.previous) qc.setQueryData(key, context.previous);
      toast({ title: "Couldn't save", description: err.message, variant: "destructive" });
    },
    onSuccess: (settings) => {
      qc.setQueryData(key, settings);
    },
  });

  return { ...query, update };
}
