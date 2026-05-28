"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { motion, useSpring, useTransform } from "framer-motion";
import { Brain, MessageSquare, Bot, Star, ArrowRight, Plus, Zap } from "lucide-react";
import { GlassCard } from "@/components/shared/GlassCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatRelativeTime, truncate } from "@/lib/utils";
import type { MemoryDoc, ConversationDoc, ReputationDoc, UserDoc, AppwriteDoc } from "@/lib/db";

interface Props {
  user: AppwriteDoc<UserDoc>;
  stats: { memoryCount: number; conversationCount: number; agentCount: number; reputation: AppwriteDoc<ReputationDoc> | null };
  recentMemories: AppwriteDoc<MemoryDoc>[];
  recentConversations: AppwriteDoc<ConversationDoc>[];
}

const categoryColors: Record<string, string> = {
  EPISODIC: "cyan",
  SEMANTIC: "default",
  PREFERENCE: "yellow",
  PROCEDURAL: "green",
};

const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" as const } },
};
const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

function AnimatedCounter({ to }: { to: number }) {
  const spring = useSpring(0, { stiffness: 55, damping: 20 });
  const rounded = useTransform(spring, Math.round);
  useEffect(() => { spring.set(to); }, [to, spring]);
  return <motion.span>{rounded}</motion.span>;
}

export function DashboardHome({ user, stats, recentMemories, recentConversations }: Props) {
  const firstName = user.name?.split(" ")[0] ?? "there";

  const statCards = [
    { label: "Memories",      value: stats.memoryCount,       icon: Brain,         color: "text-violet-400", bg: "bg-violet-500/10" },
    { label: "Conversations", value: stats.conversationCount, icon: MessageSquare, color: "text-cyan-400",   bg: "bg-cyan-500/10" },
    { label: "Agents",        value: stats.agentCount,        icon: Bot,           color: "text-indigo-400", bg: "bg-indigo-500/10" },
    {
      label: "Reputation",
      value: Math.round(stats.reputation?.score ?? 0),
      icon: Star,
      color: "text-yellow-400",
      bg: "bg-yellow-500/10",
    },
  ];

  const pulseBars = useMemo(
    () => Array.from({ length: 24 }, (_, i) => Math.max(15, Math.abs(Math.sin(i * 0.75 + 1) * 60) + 20)),
    []
  );

  const feedItems = [
    { icon: Brain,         label: "Memory retrieved",  detail: "Used in your last conversation", time: "2m ago",  color: "text-violet-400", bg: "bg-violet-500/10" },
    { icon: Bot,           label: "Agent responded",   detail: "Default Conch agent active",      time: "15m ago", color: "text-indigo-400", bg: "bg-indigo-500/10" },
    { icon: Zap,           label: "Context updated",   detail: "New preference detected",         time: "1h ago",  color: "text-cyan-400",   bg: "bg-cyan-500/10" },
  ];

  const suggestions = [
    { prompt: "Ask about your preferences", href: "/chat",   icon: MessageSquare },
    { prompt: "Review recent memories",     href: "/memory", icon: Brain },
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-6xl mx-auto space-y-8"
    >
      {/* Greeting */}
      <motion.div variants={sectionVariants}>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">
          Good {getTimeOfDay()},{" "}
          <span className="gradient-text">{firstName}</span>
        </h1>
        <p className="text-slate-400 mt-1">Here&apos;s what&apos;s happening with your AI memory.</p>
      </motion.div>

      {/* AI Status bar */}
      <motion.div
        variants={sectionVariants}
        className="flex items-center gap-3 rounded-xl px-4 py-3 border border-violet-500/20 bg-violet-500/5"
      >
        <motion.div
          animate={{ scale: [1, 1.4, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="w-2 h-2 rounded-full bg-violet-400 shrink-0"
        />
        <span className="text-sm text-slate-300">
          <span className="text-violet-300 font-medium">Conch</span> is active and learning from your conversations
        </span>
        <span className="ml-auto text-xs text-slate-600 hidden sm:block">Last sync: just now</span>
      </motion.div>

      {/* Stats */}
      <motion.div variants={sectionVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <GlassCard key={label} hover className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-400 mb-1">{label}</p>
                <p className="text-2xl font-bold text-white">
                  <AnimatedCounter to={value} />
                </p>
              </div>
              <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
            </div>
          </GlassCard>
        ))}
      </motion.div>

      {/* Memory pulse bars */}
      <motion.div variants={sectionVariants}>
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">
          Memory Activity (24h)
        </h2>
        <GlassCard className="p-4">
          <div className="flex items-end gap-0.5 h-12">
            {pulseBars.map((h, i) => (
              <motion.div
                key={i}
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ delay: i * 0.02, duration: 0.4, ease: "easeOut" }}
                className={`flex-1 rounded-sm ${i >= 19 ? "bg-violet-400" : "bg-violet-500/20"}`}
                style={{ height: `${h}%`, transformOrigin: "bottom" }}
              />
            ))}
          </div>
        </GlassCard>
      </motion.div>

      {/* Quick actions */}
      <motion.div variants={sectionVariants}>
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Quick Actions</h2>
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

      {/* Recent memories & conversations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={sectionVariants}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Recent Memories</h2>
            <Link href="/memory" className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <GlassCard className="divide-y divide-white/5">
            {recentMemories.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-sm">No memories yet. Start a chat to build your memory!</div>
            ) : (
              recentMemories.map((m) => (
                <div key={m.$id} className="p-4 flex items-start gap-3">
                  <Badge variant={categoryColors[m.category] as "cyan" | "default" | "yellow" | "green"} className="mt-0.5 shrink-0 text-[10px]">
                    {m.category.slice(0, 3)}
                  </Badge>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-white leading-relaxed">{truncate(m.content, 90)}</p>
                    <p className="text-xs text-slate-500 mt-1">{formatRelativeTime(m.$createdAt)}</p>
                  </div>
                </div>
              ))
            )}
          </GlassCard>
        </motion.div>

        <motion.div variants={sectionVariants}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Recent Chats</h2>
            <Link href="/chat" className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <GlassCard className="divide-y divide-white/5">
            {recentConversations.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-sm">
                No conversations yet.{" "}
                <Link href="/chat" className="text-violet-400 hover:text-violet-300">Start chatting</Link>
              </div>
            ) : (
              recentConversations.map((c) => (
                <Link key={c.$id} href={`/chat/${c.$id}`} className="flex items-center gap-3 p-4 hover:bg-white/5 transition-colors group">
                  <div className="w-8 h-8 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0">
                    <Zap className="w-4 h-4 text-violet-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-white font-medium truncate group-hover:text-violet-300 transition-colors">{c.title}</p>
                    <p className="text-xs text-slate-500">{formatRelativeTime(c.$updatedAt)}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors shrink-0" />
                </Link>
              ))
            )}
          </GlassCard>
        </motion.div>
      </div>

      {/* AI Activity Feed */}
      <motion.div variants={sectionVariants}>
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">AI Activity</h2>
        <GlassCard className="divide-y divide-white/5">
          {feedItems.map(({ icon: Icon, label, detail, time, color, bg }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + i * 0.08, duration: 0.35 }}
              className="flex items-center gap-4 p-4"
            >
              <div className={`w-8 h-8 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-white font-medium">{label}</p>
                <p className="text-xs text-slate-500">{detail}</p>
              </div>
              <span className="text-xs text-slate-600 shrink-0">{time}</span>
            </motion.div>
          ))}
        </GlassCard>
      </motion.div>

      {/* Contextual suggestions */}
      <motion.div variants={sectionVariants}>
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Suggested Next Steps</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {suggestions.map(({ prompt, href, icon: Icon }) => (
            <GlassCard key={href} hover className="p-4">
              <Link href={href} className="flex items-center gap-3 group">
                <div className="w-8 h-8 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-violet-400" />
                </div>
                <span className="text-sm text-slate-300 group-hover:text-white transition-colors">{prompt}</span>
                <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors ml-auto shrink-0" />
              </Link>
            </GlassCard>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}
