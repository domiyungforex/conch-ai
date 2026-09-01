"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/components/ui/toaster";
import type { AgentDoc, AppwriteDoc } from "@/lib/db";

type Agent = AppwriteDoc<AgentDoc>;

interface AgentListResponse { agents: Agent[] }
interface AgentResponse { agent: Agent }

async function fetchAgents(): Promise<Agent[]> {
  const res = await fetch("/api/agents");
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? "Failed to fetch agents");
  }
  const data: AgentListResponse = await res.json();
  return Array.isArray(data.agents) ? data.agents : [];
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
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? "Failed to create agent");
  }
  const body: AgentResponse = await res.json();
  return body.agent;
}

async function updateAgent(
  id: string,
  data: Partial<{ name: string; description: string; systemPrompt: string; temperature: number; maxTokens: number; modelId: string; status: string }>
): Promise<Agent> {
  const res = await fetch(`/api/agents/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? "Failed to update agent");
  }
  const body: AgentResponse = await res.json();
  return body.agent;
}

async function deleteAgent(id: string): Promise<void> {
  const res = await fetch(`/api/agents/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? "Failed to delete agent");
  }
}

export function useAgent() {
  const qc = useQueryClient();
  const key = ["agents"];

  const query = useQuery({ queryKey: key, queryFn: fetchAgents, staleTime: 30_000, retry: 2 });

  const invalidate = () => qc.invalidateQueries({ queryKey: key });

  const create = useMutation({
    mutationFn: createAgent,
    onSuccess: () => { invalidate(); toast({ title: "Agent created" }); },
    onError: (err: Error) => toast({ title: "Failed to create agent", description: err.message, variant: "destructive" }),
  });
  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateAgent>[1] }) =>
      updateAgent(id, data),
    onSuccess: () => { invalidate(); toast({ title: "Agent updated" }); },
    onError: (err: Error) => toast({ title: "Failed to update agent", description: err.message, variant: "destructive" }),
  });
  const remove = useMutation({
    mutationFn: deleteAgent,
    onSuccess: () => { invalidate(); toast({ title: "Agent deleted" }); },
    onError: (err: Error) => toast({ title: "Failed to delete agent", description: err.message, variant: "destructive" }),
  });

  return { ...query, create, update, remove };
}
