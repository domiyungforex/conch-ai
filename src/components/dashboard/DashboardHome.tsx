"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { motion, useSpring, useTransform } from "framer-motion";
import { Brain, MessageSquare, Bot, ArrowRight, Plus, Zap, Database, Users, ArrowUpRight, Sparkles, FolderOpen } from "lucide-react";
import { GlassCard } from "@/components/shared/GlassCard";
import { NautilusSpiral } from "@/components/shared/NautilusSpiral";
import { TideChart } from "@/components/shared/TideChart";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatRelativeTime, truncate } from "@/lib/utils";
import type { MemoryDoc, ConversationDoc, ReputationDoc, UserDoc, AppwriteDoc } from "@/lib/db";

interface Props {
  user: AppwriteDoc<UserDoc>;
  stats: {
    memoryCount: number;
    conversationCount: number;
    agentCount: number;
    contextCount: number;
    projectCount: number;
    decisionCount: number;
    constraintCount: number;
    reputation: AppwriteDoc<ReputationDoc> | null;
  };
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
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};
const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
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
    { label: "Memories", value: stats.memoryCount, icon: Brain, color: "from-violet-500 to-violet-600", glow: "shadow-violet-500/20" },
    { label: "Agents", value: stats.agentCount, icon: Bot, color: "from-cyan-500 to-cyan-600", glow: "shadow-cyan-500/20" },
    { label: "Context", value: stats.contextCount, icon: Database, color: "from-amber-500 to-amber-600", glow: "shadow-amber-500/20" },
    { label: "Projects", value: stats.projectCount, icon: FolderOpen, color: "from-rose-500 to-rose-600", glow: "shadow-rose-500/20" },
  ];

  const tideValues = useMemo(
    () => Array.from({ length: 32 }, (_, i) =>
      Math.max(0.08, Math.min(0.95, 0.4 + 0.3 * Math.sin(i * 0.4 + 1.2) + 0.12 * Math.sin(i * 1.3)))
    ),
    []
  );

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-6xl mx-auto px-4 sm:p-6 md:p-8 py-6 space-y-8"
    >
      {/* Greeting */}
      <motion.div variants={sectionVariants}>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Good {getTimeOfDay()}</p>
            <h1 className="text-2xl font-semibold text-white">
              {firstName}
            </h1>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div variants={sectionVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map(({ label, value, icon: Icon, color, glow }) => (
          <Link key={label} href={label === "Memories" ? "/memory" : label === "Agents" ? "/agents" : label === "Projects" ? "/projects" : "/context"}>
            <div className="group p-4 rounded-2xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] hover:border-white/[0.08] transition-all duration-300 cursor-pointer">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg ${glow}`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
              </div>
              <p className="text-2xl font-semibold text-white mb-0.5">
                <AnimatedCounter to={value} />
              </p>
              <p className="text-[12px] text-slate-500">{label}</p>
            </div>
          </Link>
        ))}
      </motion.div>

      {/* Activity chart */}
      <motion.div variants={sectionVariants}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[13px] font-medium text-slate-400">Activity</h2>
          <span className="text-[11px] text-slate-600">Last 24 hours</span>
        </div>
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
          <TideChart values={tideValues} color="#8b5cf6" height={48} />
        </div>
      </motion.div>

      {/* Quick actions */}
      <motion.div variants={sectionVariants}>
        <h2 className="text-[13px] font-medium text-slate-400 mb-3">Quick start</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { href: "/chat", icon: MessageSquare, label: "Start a chat", desc: "AI with full context", color: "from-violet-500 to-violet-600" },
            { href: "/memory", icon: Brain, label: "Add memory", desc: "Store something new", color: "from-cyan-500 to-cyan-600" },
            { href: "/agents", icon: Bot, label: "Create agent", desc: "Build an AI assistant", color: "from-amber-500 to-amber-600" },
          ].map(({ href, icon: Icon, label, desc, color }) => (
            <Link key={href} href={href}>
              <div className="group p-4 rounded-2xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] hover:border-white/[0.08] transition-all duration-300 cursor-pointer">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg mb-3`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <p className="text-[14px] font-medium text-white mb-0.5">{label}</p>
                <p className="text-[12px] text-slate-500">{desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </motion.div>

      {/* Recent */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent memories */}
        <motion.div variants={sectionVariants}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[13px] font-medium text-slate-400">Recent memories</h2>
            <Link href="/memory" className="text-[12px] text-violet-400 hover:text-violet-300 flex items-center gap-1 transition-colors">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="rounded-2xl bg-white/[0.02] border border-white/[0.04] divide-y divide-white/[0.04]">
            {recentMemories.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-[13px]">
                No memories yet. Start a conversation to build context.
              </div>
            ) : (
              recentMemories.slice(0, 5).map((m) => (
                <div key={m.$id} className="px-4 py-3 flex items-start gap-3 hover:bg-white/[0.02] transition-colors">
                  <div className="w-2 h-2 rounded-full bg-violet-500 mt-1.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] text-slate-300 leading-relaxed">{truncate(m.content, 100)}</p>
                    <p className="text-[11px] text-slate-600 mt-1">{formatRelativeTime(m.$createdAt)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>

        {/* Recent conversations */}
        <motion.div variants={sectionVariants}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[13px] font-medium text-slate-400">Recent conversations</h2>
            <Link href="/chat" className="text-[12px] text-violet-400 hover:text-violet-300 flex items-center gap-1 transition-colors">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="rounded-2xl bg-white/[0.02] border border-white/[0.04] divide-y divide-white/[0.04]">
            {recentConversations.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-[13px]">
                No conversations yet.{" "}
                <Link href="/chat" className="text-violet-400 hover:text-violet-300 transition-colors">Start one</Link>
              </div>
            ) : (
              recentConversations.slice(0, 5).map((c) => (
                <Link key={c.$id} href={`/chat/${c.$id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors group">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500/20 to-cyan-500/10 flex items-center justify-center shrink-0">
                    <MessageSquare className="w-3.5 h-3.5 text-violet-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] text-slate-300 font-medium truncate group-hover:text-white transition-colors">
                      {c.title}
                    </p>
                    <p className="text-[11px] text-slate-600">{formatRelativeTime(c.$updatedAt)}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-all duration-200 group-hover:translate-x-0.5 shrink-0" />
                </Link>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}


