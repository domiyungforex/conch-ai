"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { MemoryDoc, MemoryCategory, AppwriteDoc } from "@/lib/db";

type Memory = AppwriteDoc<MemoryDoc>;

interface MemoryListResponse {
  memories: Memory[];
  total: number;
  page: number;
  limit: number;
}

async function fetchMemories(category?: string): Promise<Memory[]> {
  const url =
    category && category !== "ALL"
      ? `/api/memory?category=${encodeURIComponent(category)}`
      : "/api/memory";
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? "Failed to fetch memories");
  }
  const data: MemoryListResponse = await res.json();
  return Array.isArray(data.memories) ? data.memories : [];
}

async function createMemory(data: {
  content: string;
  category: MemoryCategory;
  tags: string[];
  importance: number;
}): Promise<Memory> {
  const res = await fetch("/api/memory", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? "Failed to create memory");
  }
  const body = await res.json();
  return body.memory ?? body;
}

async function updateMemory(
  id: string,
  data: Partial<{ content: string; category: MemoryCategory; tags: string[]; importance: number; isArchived: boolean }>
): Promise<Memory> {
  const res = await fetch(`/api/memory/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? "Failed to update memory");
  }
  const body = await res.json();
  return body.memory ?? body;
}

async function deleteMemory(id: string): Promise<void> {
  const res = await fetch(`/api/memory/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? "Failed to delete memory");
  }
}

export function useMemory(category?: string) {
  const qc = useQueryClient();
  const key = ["memories", category ?? "ALL"];

  const query = useQuery({
    queryKey: key,
    queryFn: () => fetchMemories(category),
    staleTime: 30_000,
    retry: 2,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["memories"] });

  const create = useMutation({
    mutationFn: createMemory,
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateMemory>[1] }) =>
      updateMemory(id, data),
    onSuccess: invalidate,
  });

  const archive = useMutation({
    mutationFn: (id: string) => updateMemory(id, { isArchived: true }),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: deleteMemory,
    onSuccess: invalidate,
  });

  return { ...query, create, update, archive, remove };
}
