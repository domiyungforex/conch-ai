"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/components/ui/toaster";

// Carries the API's error `code` (e.g. "PLAN_REQUIRED") alongside the
// message, so callers can render a targeted upgrade CTA instead of just a
// generic error string.
export class ResourceApiError extends Error {
  code?: string;
  constructor(message: string, code?: string) {
    super(message);
    this.code = code;
  }
}

// Generic list/create/delete against any of the flag-gated module routes
// (they all share the same { items: [...] } / { item: {...} } response
// shape from src/lib/moduleCrud.ts). One hook drives every module page
// instead of hand-writing fetch plumbing per entity.
export function useResourceCrud<T extends { $id: string }>(basePath: string | null) {
  const qc = useQueryClient();
  const key = ["resource", basePath];

  const list = useQuery({
    queryKey: key,
    queryFn: async (): Promise<T[]> => {
      const res = await fetch(basePath!);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new ResourceApiError((body as { error?: string }).error ?? "Failed to load", (body as { code?: string }).code);
      }
      const data = await res.json();
      return data.items as T[];
    },
    enabled: !!basePath,
  });

  const create = useMutation({
    mutationFn: async (body: Record<string, unknown>): Promise<T> => {
      const res = await fetch(basePath!, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error ?? "Failed to create");
      }
      const data = await res.json();
      return data.item as T;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: key });
      toast({ title: "Created" });
    },
    onError: (err: Error) => toast({ title: "Couldn't create", description: err.message, variant: "destructive" }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${basePath}/${id}`, { method: "DELETE" });
      if (!res.ok && res.status !== 204) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error ?? "Failed to delete");
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: key });
      toast({ title: "Deleted" });
    },
    onError: (err: Error) => toast({ title: "Couldn't delete", description: err.message, variant: "destructive" }),
  });

  return { list, create, remove };
}
