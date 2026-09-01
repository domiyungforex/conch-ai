"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/components/ui/toaster";
import type { ModuleKey, ModuleInfo } from "@/lib/modules";
import type { ModuleFlagState } from "@/lib/moduleFlags";

export interface AdminFlagItem extends ModuleFlagState {
  info: ModuleInfo;
}

interface FlagUpdate {
  key: ModuleKey;
  status?: "enabled" | "disabled" | "beta";
  rolloutPercentage?: number;
  minPlan?: string | null;
}

async function fetchFlags(): Promise<AdminFlagItem[]> {
  const res = await fetch("/api/admin/flags");
  if (!res.ok) throw new Error("Failed to load flags");
  const data = await res.json();
  return data.items;
}

async function updateFlag({ key, ...body }: FlagUpdate) {
  const res = await fetch(`/api/admin/flags/${key}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { error?: string }).error ?? "Failed to update");
  }
  return res.json();
}

export function useAdminFlags() {
  const qc = useQueryClient();
  const query = useQuery({ queryKey: ["admin-flags"], queryFn: fetchFlags });

  const update = useMutation({
    mutationFn: updateFlag,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-flags"] });
      toast({ title: "Updated" });
    },
    onError: (err: Error) => toast({ title: "Update failed", description: err.message, variant: "destructive" }),
  });

  return { ...query, update };
}
