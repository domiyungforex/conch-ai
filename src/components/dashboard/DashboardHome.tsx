"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Brain, MessageSquare, Bot, Star, ArrowRight, Plus, Zap } from "lucide-react";
import { GlassCard } from "@/components/shared/GlassCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatRelativeTime, truncate } from "@/lib/utils";
import type { Memory, Conversation, Reputation, User } from "@prisma/client";

interface Props {
  user: User;
  stats: { memoryCount: number; conversationCount: number; agentCount: number; reputation: Reputation | null };
  recentMemories: Memory[];
  recentConversations: (Conversation & { _count: { messages: number } })[];
}

const categoryColors: Record<string, string> = {
  EPISODIC: "cyan",
  SEMANTIC: "default",
  PREFERENCE: "yellow",
  PROCEDURAL: "green",
};

export function DashboardHome({ user, stats, recentMemories, recentConversations }: Props) {
  const firstName = user.name?.split(" ")[0] ?? "there";

  const statCards = [
    { label: "Memories", value: stats.memoryCount, icon: Brain, color: "text-violet-400", bg: "bg-violet-500/10" },
    { label: "Conversations", value: stats.conversationCount, icon: MessageSquare, color: "text-cyan-400", bg: "bg-cyan-500/10" },
    { label: "Agents", value: stats.agentCount, icon: Bot, color: "text-indigo-400", bg: "bg-indigo-500/10" },
    { label: "Reputation", value: stats.reputation?.score?.toFixed(0) ?? "0", icon: Star, color: "text-yellow-400", bg: "bg-yellow-500/10" },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Greeting */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">
          Good {getTimeOfDay()},{" "}
          <span className="gradient-text">{firstName}</span> 👋
        </h1>
        <p className="text-slate-400 mt-1">Here&apos;s what&apos;s happening with your AI memory.</p>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <GlassCard key={label} hover className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-400 mb-1">{label}</p>
                <p className="text-2xl font-bold text-white">{value}</p>
              </div>
              <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
            </div>
          </GlassCard>
        ))}
      </motion.div>

      {/* Quick actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-3">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/chat"><MessageSquare className="w-4 h-4" />New Chat</Link>
          </Button>
          <Button variant="secondary" asChild>
            <Link href="/memory"><Plus className="w-4 h-4" />Add Memory</Link>
          </Button>
          <Button variant="secondary" asChild>
            <Link href="/agents"><Bot className="w-4 h-4" />Create Agent</Link>
          </Button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Memories */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3 }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest">Recent Memories</h2>
            <Link href="/memory" className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <GlassCard className="divide-y divide-white/5">
            {recentMemories.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-sm">No memories yet. Start a chat to build your memory!</div>
            ) : recentMemories.map((m) => (
              <div key={m.id} className="p-4 flex items-start gap-3">
                <Badge variant={categoryColors[m.category] as "cyan" | "default" | "yellow" | "green"} className="mt-0.5 shrink-0 text-[10px]">
                  {m.category.slice(0, 3)}
                </Badge>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-white leading-relaxed">{truncate(m.content, 90)}</p>
                  <p className="text-xs text-slate-500 mt-1">{formatRelativeTime(m.createdAt)}</p>
                </div>
              </div>
            ))}
          </GlassCard>
        </motion.div>

        {/* Recent Conversations */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.35 }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest">Recent Chats</h2>
            <Link href="/chat" className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <GlassCard className="divide-y divide-white/5">
            {recentConversations.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-sm">No conversations yet. <Link href="/chat" className="text-violet-400 hover:text-violet-300">Start chatting</Link></div>
            ) : recentConversations.map((c) => (
              <Link key={c.id} href={`/chat/${c.id}`} className="flex items-center gap-3 p-4 hover:bg-white/5 transition-colors group">
                <div className="w-8 h-8 rounded-xl bg-violet-500/10 flex items-center justify-center flex-shrink-0">
                  <Zap className="w-4 h-4 text-violet-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-white font-medium truncate group-hover:text-violet-300 transition-colors">{c.title}</p>
                  <p className="text-xs text-slate-500">{c._count.messages} messages · {formatRelativeTime(c.updatedAt)}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors shrink-0" />
              </Link>
            ))}
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
}

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}
