"use client";

import { useQuery } from "@tanstack/react-query";
import { Brain, MessageSquare, Users, Share2, ChevronDown } from "lucide-react";
import { GlassCard } from "@/components/shared/GlassCard";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import type { Reputation } from "@prisma/client";

async function fetchReputation(): Promise<Reputation | null> {
  const res = await fetch("/api/user/reputation");
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed");
  return res.json();
}

const LEVELS = [
  { name: "novice", label: "Novice", min: 0, max: 50, color: "text-slate-300" },
  { name: "apprentice", label: "Apprentice", min: 50, max: 150, color: "text-cyan-300" },
  { name: "practitioner", label: "Practitioner", min: 150, max: 350, color: "text-violet-300" },
  { name: "expert", label: "Expert", min: 350, max: 700, color: "text-amber-300" },
  { name: "master", label: "Master", min: 700, max: Infinity, color: "text-emerald-300" },
] as const;

function getLevelInfo(score: number) {
  return LEVELS.find((l) => score >= l.min && score < l.max) ?? LEVELS[0];
}

function getNextLevel(score: number) {
  const idx = LEVELS.findIndex((l) => score >= l.min && score < l.max);
  return idx < LEVELS.length - 1 ? LEVELS[idx + 1] : null;
}

function getProgressToNext(score: number) {
  const current = getLevelInfo(score);
  const next = getNextLevel(score);
  if (!next) return 100;
  const range = next.min - current.min;
  const earned = score - current.min;
  return Math.min(100, Math.round((earned / range) * 100));
}

const EARN_ITEMS = [
  { icon: Brain, label: "Add memories", desc: "+2 pts each" },
  { icon: Users, label: "Create agents", desc: "+5 pts each" },
  { icon: MessageSquare, label: "Chat sessions", desc: "+0.5 pts each" },
  { icon: Share2, label: "Share memories", desc: "+3 pts each" },
];

export function ReputationCard() {
  const { data: rep, isLoading } = useQuery({
    queryKey: ["reputation"],
    queryFn: fetchReputation,
  });

  if (isLoading) {
    return (
      <GlassCard className="p-6">
        <div className="space-y-3">
          <div className="h-5 w-32 animate-pulse bg-white/5 rounded" />
          <div className="h-2 animate-pulse bg-white/5 rounded-full" />
          <div className="h-16 animate-pulse bg-white/5 rounded-xl" />
        </div>
      </GlassCard>
    );
  }

  const score = rep?.score ?? 0;
  const level = getLevelInfo(score);
  const nextLevel = getNextLevel(score);
  const progress = getProgressToNext(score);

  return (
    <GlassCard className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold text-white">Reputation</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Earn points by using Conch actively.
          </p>
        </div>
        <Badge className={`text-xs border bg-white/5 border-white/10 ${level.color}`}>
          {level.label}
        </Badge>
      </div>

      <div className="mb-5">
        <div className="flex items-end justify-between mb-1.5">
          <span className="text-3xl font-bold text-white">{Math.round(score)}</span>
          {nextLevel && (
            <span className="text-xs text-slate-500">
              {Math.round(nextLevel.min - score)} pts to {nextLevel.label}
            </span>
          )}
        </div>
        <Progress value={progress} />
        {!nextLevel && (
          <p className="text-xs text-emerald-400 mt-1">Max level reached</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 mb-5">
        {[
          { icon: Brain, label: "Memories", count: rep?.memoryCount ?? 0, pts: (rep?.memoryCount ?? 0) * 2 },
          { icon: Users, label: "Agents", count: rep?.agentCount ?? 0, pts: (rep?.agentCount ?? 0) * 5 },
          { icon: MessageSquare, label: "Chats", count: rep?.chatCount ?? 0, pts: Math.round((rep?.chatCount ?? 0) * 0.5) },
          { icon: Share2, label: "Shares", count: rep?.shareCount ?? 0, pts: (rep?.shareCount ?? 0) * 3 },
        ].map(({ icon: Icon, label, count, pts }) => (
          <div key={label} className="bg-white/5 rounded-xl p-3 border border-white/8">
            <div className="flex items-center gap-1.5 mb-1">
              <Icon className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs text-slate-400">{label}</span>
            </div>
            <p className="text-sm font-semibold text-white">{count}</p>
            <p className="text-xs text-violet-400">+{pts} pts</p>
          </div>
        ))}
      </div>

      <Accordion type="single" collapsible>
        <AccordionItem value="how-to-earn" className="border-white/10">
          <AccordionTrigger className="text-xs text-slate-400 hover:text-white py-2 [&>svg]:text-slate-500">
            How to earn more points
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2 pt-1">
              {EARN_ITEMS.map(({ icon: Icon, label, desc }) => (
                <div key={label} className="flex items-center gap-3 text-xs">
                  <Icon className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                  <span className="text-slate-300 flex-1">{label}</span>
                  <span className="text-emerald-400">{desc}</span>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </GlassCard>
  );
}
