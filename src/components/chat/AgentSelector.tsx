"use client";

import { useQuery } from "@tanstack/react-query";
import { Bot, ChevronDown } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Agent } from "@prisma/client";

async function fetchAgents(): Promise<Agent[]> {
  const res = await fetch("/api/agents");
  if (!res.ok) throw new Error("Failed to fetch agents");
  return res.json();
}

interface Props {
  value: string | null;
  onChange: (agentId: string | null) => void;
}

export function AgentSelector({ value, onChange }: Props) {
  const { data: agents = [] } = useQuery({
    queryKey: ["agents"],
    queryFn: fetchAgents,
    staleTime: 60_000,
  });

  return (
    <Select
      value={value ?? "default"}
      onValueChange={(v) => onChange(v === "default" ? null : v)}
    >
      <SelectTrigger className="w-44 h-8 text-xs border-white/10 bg-white/5">
        <div className="flex items-center gap-1.5">
          <Bot className="w-3.5 h-3.5 text-slate-400" />
          <SelectValue placeholder="Default Conch" />
        </div>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="default">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500" />
            Default Conch
          </div>
        </SelectItem>
        {agents
          .filter((a) => a.status === "ACTIVE")
          .map((agent) => (
            <SelectItem key={agent.id} value={agent.id}>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
                  <span className="text-[8px] font-bold text-white">{agent.name[0]}</span>
                </div>
                {agent.name}
              </div>
            </SelectItem>
          ))}
      </SelectContent>
    </Select>
  );
}
