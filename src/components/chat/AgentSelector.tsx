"use client";

import { useQuery } from "@tanstack/react-query";
import { Bot } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AgentDoc, AppwriteDoc } from "@/lib/db";
type Agent = AppwriteDoc<AgentDoc>;

interface AgentListResponse {
  agents: Agent[];
}

async function fetchAgents(): Promise<Agent[]> {
  const res = await fetch("/api/agents");
  if (!res.ok) return [];
  const data: AgentListResponse = await res.json();
  return Array.isArray(data.agents) ? data.agents : [];
}

interface Props {
  value: string | null;
  onChange: (agentId: string | null) => void;
}

export function AgentSelector({ value, onChange }: Props) {
  const { data } = useQuery({
    queryKey: ["agents"],
    queryFn: fetchAgents,
    staleTime: 60_000,
    retry: 1,
  });

  const agents: Agent[] = Array.isArray(data) ? data : [];
  const activeAgents = agents.filter((a) => a?.status === "ACTIVE");

  return (
    <Select
      value={value ?? "default"}
      onValueChange={(v) => onChange(v === "default" ? null : v)}
    >
      <SelectTrigger className="w-40 h-8 text-[12px] chat-input-bg border-0">
        <div className="flex items-center gap-1.5">
          <Bot className="w-3.5 h-3.5 chat-text-muted" />
          <SelectValue placeholder="Default" />
        </div>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="default">
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded-md bg-gradient-to-br from-primary to-primary-hover" />
            Default
          </div>
        </SelectItem>
        {activeAgents.map((agent) => (
          <SelectItem key={agent.$id} value={agent.$id}>
            <div className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 rounded-md bg-gradient-to-br from-secondary to-primary flex items-center justify-center">
                <span className="text-[8px] font-bold text-white">
                  {(agent.name ?? "A")[0].toUpperCase()}
                </span>
              </div>
              {agent.name}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
