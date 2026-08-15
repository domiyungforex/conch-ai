"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { motion, useSpring, useTransform } from "framer-motion";
import { Brain, MessageSquare, Bot, Star, ArrowRight, Plus } from "lucide-react";
import { GlassCard } from "@/components/shared/GlassCard";
import { NautilusSpiral } from "@/components/shared/NautilusSpiral";
import { TideChart } from "@/components/shared/TideChart";
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
    { label: "Memories",      value: stats.memoryCount,       icon: Brain,         accent: "#a08cff" },
    { label: "Conversations", value: stats.conversationCount, icon: MessageSquare, accent: "#41ebcf" },
    { label: "Agents",        value: stats.agentCount,        icon: Bot,           accent: "#e879f9" },
    { label: "Reputation",    value: Math.round(stats.reputation?.score ?? 0), icon: Star, accent: "#a08cff" },
  ];

  // Ambient activity texture — not wired to real per-hour telemetry (that would need a
  // dedicated aggregation query), same as the equalizer bars this replaced.
  const tideValues = useMemo(
    () => Array.from({ length: 32 }, (_, i) =>
      Math.max(0.08, Math.min(0.95, 0.4 + 0.3 * Math.sin(i * 0.4 + 1.2) + 0.12 * Math.sin(i * 1.3)))
    ),
    []
  );

  const suggestions = [
    { prompt: "Ask your AI something — it remembers everything", href: "/chat",   icon: MessageSquare },
    { prompt: "Browse what your memory holds",                    href: "/memory", icon: Brain },
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-6xl mx-auto space-y-8"
    >
      {/* Greeting */}
      <motion.div variants={sectionVariants} className="relative">
        <NautilusSpiral
          size={280}
          className="absolute -top-14 -right-10 pointer-events-none hidden sm:block opacity-60"
        />
        <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-2">Your Memory</p>
        <h1 className="font-serif text-3xl sm:text-4xl font-normal text-white leading-tight">
          Good {getTimeOfDay()},<br className="sm:hidden" />{" "}
          <em className="not-italic gradient-text">{firstName}</em>.
        </h1>
        <p className="text-slate-400 mt-2">Here&apos;s everything your memory has been holding onto.</p>
      </motion.div>

      {/* AI Status bar */}
      <motion.div
        variants={sectionVariants}
        className="flex items-center gap-3 rounded-full px-4 py-2.5 border border-teal-500/25 bg-teal-500/5 w-fit max-w-full"
      >
        <motion.div
          animate={{ scale: [1, 1.4, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="w-2 h-2 rounded-full bg-teal-400 shrink-0 relative"
        >
          <span className="absolute inset-0 rounded-full bg-teal-400/40 animate-ping" />
        </motion.div>
        <span className="text-sm text-slate-300">
          <span className="text-teal-300 font-medium">Conch</span> is remembering — every conversation becomes memory
        </span>
      </motion.div>

      {/* Stats */}
      <motion.div variants={sectionVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, accent }) => (
          <GlassCard key={label} hover className="p-5 relative overflow-hidden">
            <div
              aria-hidden="true"
              className="absolute -top-10 -right-10 w-28 h-28 rounded-full pointer-events-none"
              style={{ background: `radial-gradient(circle, ${accent}30, transparent 70%)` }}
            />
            <div className="flex items-start justify-between relative">
              <div>
                <p className="text-sm text-slate-400 mb-1">{label}</p>
                <p className="font-serif text-2xl text-white">
                  <AnimatedCounter to={value} />
                </p>
              </div>
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: `${accent}1a` }}
              >
                <Icon className="w-4 h-4" style={{ color: accent }} />
              </div>
            </div>
          </GlassCard>
        ))}
      </motion.div>

      {/* Tide chart */}
      <motion.div variants={sectionVariants}>
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Memory Activity</h2>
          <span className="text-xs text-slate-600">last 24 hours</span>
        </div>
        <GlassCard className="p-4">
          <TideChart values={tideValues} color="#a08cff" height={56} />
        </GlassCard>
      </motion.div>

      {/* Quick actions */}
      <motion.div variants={sectionVariants}>
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/chat"><MessageSquare className="w-4 h-4" />Remember Together</Link>
          </Button>
          <Button variant="secondary" asChild>
            <Link href="/memory"><Plus className="w-4 h-4" />Add a Memory</Link>
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
            <Link href="/memory" className="text-xs text-coral-400 hover:text-coral-300 flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <GlassCard className="divide-y divide-white/5">
            {recentMemories.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-sm">Your memory is still forming. Start a conversation to build it.</div>
            ) : (
              recentMemories.map((m) => (
                <div key={m.$id} className="p-4 flex items-start gap-3">
                  <Badge variant={categoryColors[m.category] as "cyan" | "default" | "yellow" | "green"} className="mt-0.5 shrink-0 text-[10px]">
                    {m.category.slice(0, 3)}
                  </Badge>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-white leading-relaxed">{truncate(m.content, 90)}</p>
                    <p className="text-xs text-slate-500 mt-1">Remembered {formatRelativeTime(m.$createdAt)}</p>
                  </div>
                </div>
              ))
            )}
          </GlassCard>
        </motion.div>

        <motion.div variants={sectionVariants}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Conversations That Built This</h2>
            <Link href="/chat" className="text-xs text-coral-400 hover:text-coral-300 flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <GlassCard className="divide-y divide-white/5">
            {recentConversations.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-sm">
                No conversations yet.{" "}
                <Link href="/chat" className="text-coral-400 hover:text-coral-300">Start one and it becomes memory</Link>
              </div>
            ) : (
              recentConversations.map((c) => (
                <Link key={c.$id} href={`/chat/${c.$id}`} className="flex items-center gap-3 p-4 hover:bg-white/5 transition-colors group">
                  <div className="w-8 h-8 rounded-xl bg-teal-500/10 flex items-center justify-center shrink-0 text-teal-400 text-sm">✦</div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-white font-medium truncate group-hover:text-coral-300 transition-colors">{c.title}</p>
                    <p className="text-xs text-slate-500">{formatRelativeTime(c.$updatedAt)}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors shrink-0" />
                </Link>
              ))
            )}
          </GlassCard>
        </motion.div>
      </div>

      {/* Contextual suggestions */}
      <motion.div variants={sectionVariants}>
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Suggested Next Steps</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {suggestions.map(({ prompt, href, icon: Icon }) => (
            <GlassCard key={href} hover className="p-4">
              <Link href={href} className="flex items-center gap-3 group">
                <div className="w-8 h-8 rounded-xl bg-coral-500/10 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-coral-400" />
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
