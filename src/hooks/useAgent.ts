"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Agent } from "@prisma/client";

async function fetchAgents(): Promise<Agent[]> {
  const res = await fetch("/api/agents");
  if (!res.ok) throw new Error("Failed to fetch agents");
  return res.json();
}

async function createAgent(data: {
  name: string;
  description?: string;
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  modelId?: string;
}): Promise<Agent> {
  const res = await fetch("/api/agents", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create agent");
  return res.json();
}

async function updateAgent(id: string, data: Partial<{ name: string; description: string; systemPrompt: string; temperature: number; maxTokens: number; modelId: string; status: string }>): Promise<Agent> {
  const res = await fetch(`/api/agents/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update agent");
  return res.json();
}

async function deleteAgent(id: string): Promise<void> {
  const res = await fetch(`/api/agents/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete agent");
}

export function useAgent() {
  const qc = useQueryClient();
  const key = ["agents"];

  const query = useQuery({ queryKey: key, queryFn: fetchAgents, staleTime: 30_000 });

  const create = useMutation({
    mutationFn: createAgent,
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateAgent>[1] }) => updateAgent(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });

  const remove = useMutation({
    mutationFn: deleteAgent,
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });

  return { ...query, create, update, remove };
}
