"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Memory, MemoryCategory } from "@prisma/client";

async function fetchMemories(category?: string): Promise<Memory[]> {
  const url = category && category !== "ALL" ? `/api/memory?category=${category}` : "/api/memory";
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch memories");
  return res.json();
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
  if (!res.ok) throw new Error("Failed to create memory");
  return res.json();
}

async function updateMemory(id: string, data: Partial<{ content: string; category: MemoryCategory; tags: string[]; importance: number; isArchived: boolean }>): Promise<Memory> {
  const res = await fetch(`/api/memory/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update memory");
  return res.json();
}

async function deleteMemory(id: string): Promise<void> {
  const res = await fetch(`/api/memory/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete memory");
}

export function useMemory(category?: string) {
  const qc = useQueryClient();
  const key = ["memories", category ?? "ALL"];

  const query = useQuery({ queryKey: key, queryFn: () => fetchMemories(category), staleTime: 30_000 });

  const create = useMutation({
    mutationFn: createMemory,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["memories"] }),
  });

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateMemory>[1] }) =>
      updateMemory(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["memories"] }),
  });

  const archive = useMutation({
    mutationFn: (id: string) => updateMemory(id, { isArchived: true }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["memories"] }),
  });

  const remove = useMutation({
    mutationFn: deleteMemory,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["memories"] }),
  });

  return { ...query, create, update, archive, remove };
}
