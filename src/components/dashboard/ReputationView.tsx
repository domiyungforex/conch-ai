"use client";

import { useEffect } from "react";
import { motion, useSpring, useTransform } from "framer-motion";
import { Brain, MessageSquare, Bot, Zap, Sparkles, Share2, Lock } from "lucide-react";
import { GlassCard } from "@/components/shared/GlassCard";
import type { Reputation } from "@prisma/client";

interface Props {
  reputation: Reputation | null;
  counts: { memories: number; agents: number; conversations: number };
}

const CIRCUMFERENCE = 2 * Math.PI * 52; // r=52

function AnimatedCounter({ to }: { to: number }) {
  const spring = useSpring(0, { stiffness: 55, damping: 20 });
  const rounded = useTransform(spring, Math.round);
  useEffect(() => { spring.set(to); }, [to, spring]);
  return <motion.span>{rounded}</motion.span>;
}

export function ReputationView({ reputation, counts }: Props) {
  const score = Math.round(reputation?.score ?? 0);
  const MAX_SCORE = 700;
  const scoreRatio = Math.min(score / MAX_SCORE, 1);
  const targetOffset = CIRCUMFERENCE - CIRCUMFERENCE * scoreRatio;

  const bars = [
    {
      label: "Memory Quality",
      value: Math.min((reputation?.memoryCount ?? 0) * 2, 100),
      color: "bg-violet-500",
      icon: Brain,
      iconColor: "text-violet-400",
    },
    {
      label: "Conversations",
      value: Math.min(reputation?.chatCount ?? 0, 100),
      color: "bg-indigo-500",
      icon: MessageSquare,
      iconColor: "text-indigo-400",
    },
    {
      label: "Agent Usage",
      value: Math.min((reputation?.agentCount ?? 0) * 10, 100),
      color: "bg-cyan-500",
      icon: Bot,
      iconColor: "text-cyan-400",
    },
    {
      label: "Context Sharing",
      value: Math.min((reputation?.shareCount ?? 0) * 5, 100),
      color: "bg-emerald-500",
      icon: Share2,
      iconColor: "text-emerald-400",
    },
  ];

  const badges = [
    {
      id: "early",
      icon: Sparkles,
      title: "Early Adopter",
      desc: "Joined during beta",
      unlocked: true,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/25",
    },
    {
      id: "memory-master",
      icon: Brain,
      title: "Memory Master",
      desc: "Stored 25+ memories",
      unlocked: counts.memories >= 25,
      color: "text-violet-400",
      bg: "bg-violet-500/10",
      border: "border-violet-500/25",
    },
    {
      id: "chatter",
      icon: MessageSquare,
      title: "Conversationalist",
      desc: "50+ AI conversations",
      unlocked: counts.conversations >= 50,
      color: "text-cyan-400",
      bg: "bg-cyan-500/10",
      border: "border-cyan-500/25",
    },
    {
      id: "pioneer",
      icon: Zap,
      title: "AI Pioneer",
      desc: "Created custom agents",
      unlocked: counts.agents > 0,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/25",
    },
  ];

  const levelLabel = reputation?.level
    ? reputation.level.charAt(0).toUpperCase() + reputation.level.slice(1)
    : "Novice";

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Page header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">
          Your <span className="gradient-text">Reputation</span>
        </h1>
        <p className="text-slate-400 mt-1">Your AI intelligence profile — built through every interaction.</p>
      </motion.div>

      {/* Score + bars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Donut chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.1 }}
        >
          <GlassCard className="p-8 flex flex-col items-center gap-6">
            <div className="relative">
              <svg viewBox="0 0 120 120" className="w-48 h-48 -rotate-90">
                <defs>
                  <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#7c3aed" />
                    <stop offset="100%" stopColor="#06b6d4" />
                  </linearGradient>
                </defs>
                {/* Track */}
                <circle
                  cx="60" cy="60" r="52"
                  fill="none"
                  stroke="rgba(255,255,255,0.06)"
                  strokeWidth="8"
                />
                {/* Score arc */}
                <motion.circle
                  cx="60" cy="60" r="52"
                  fill="none"
                  stroke="url(#scoreGradient)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={CIRCUMFERENCE}
                  initial={{ strokeDashoffset: CIRCUMFERENCE }}
                  animate={{ strokeDashoffset: targetOffset }}
                  transition={{ duration: 1.6, ease: "easeOut", delay: 0.35 }}
                />
              </svg>
              {/* Center label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center rotate-0">
                <p className="text-3xl font-bold text-white">
                  <AnimatedCounter to={score} />
                </p>
                <p className="text-xs text-slate-500 mt-0.5">/ {MAX_SCORE}</p>
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-slate-300">{levelLabel}</p>
              <p className="text-xs text-slate-600 mt-0.5">Trust score · {scoreRatio < 0.5 ? "Keep growing" : scoreRatio < 0.8 ? "Making progress" : "Elite status"}</p>
            </div>
          </GlassCard>
        </motion.div>

        {/* Category bars */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.18 }}
        >
          <GlassCard className="p-6 space-y-5">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Breakdown</h3>
            {bars.map(({ label, value, color, icon: Icon, iconColor }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.08, duration: 0.35 }}
                className="space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-3.5 h-3.5 ${iconColor}`} />
                    <span className="text-xs text-slate-400">{label}</span>
                  </div>
                  <span className="text-xs text-slate-500">{value}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: value / 100 }}
                    transition={{ duration: 0.9, delay: 0.4 + i * 0.08, ease: "easeOut" }}
                    className={`h-full rounded-full ${color}`}
                    style={{ transformOrigin: "left" }}
                  />
                </div>
              </motion.div>
            ))}
          </GlassCard>
        </motion.div>
      </div>

      {/* Achievement badges */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.45 }}
      >
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">Achievements</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {badges.map(({ id, icon: Icon, title, desc, unlocked, color, bg, border }, i) => (
            <motion.div
              key={id}
              initial={{ opacity: 0, scale: 0.92 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07, duration: 0.35 }}
            >
              <GlassCard
                className={`p-5 relative border ${border} ${!unlocked ? "opacity-40" : ""}`}
              >
                {!unlocked && (
                  <div className="absolute top-2.5 right-2.5">
                    <Lock className="w-3 h-3 text-slate-600" />
                  </div>
                )}
                <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-3`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <p className="text-sm font-semibold text-white leading-tight mb-0.5">{title}</p>
                <p className="text-xs text-slate-500">{desc}</p>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Activity timeline */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.45 }}
      >
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">Recent Activity</h2>
        <GlassCard className="p-6">
          <ul className="space-y-0">
            {[
              { icon: Brain,         label: "Memory stored",        detail: "+2 reputation",  color: "bg-violet-400",  time: "2m ago" },
              { icon: MessageSquare, label: "Conversation completed",detail: "+5 reputation",  color: "bg-indigo-400",  time: "1h ago" },
              { icon: Bot,           label: "Agent created",         detail: "+10 reputation", color: "bg-cyan-400",    time: "3h ago" },
              { icon: Sparkles,      label: "Account created",       detail: "+50 reputation", color: "bg-amber-400",   time: "day 1" },
            ].map(({ icon: Icon, label, detail, color, time }, i, arr) => (
              <motion.li
                key={label}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07, duration: 0.35 }}
                className={`flex gap-4 ${i < arr.length - 1 ? "pb-5" : ""}`}
              >
                {/* Timeline line */}
                <div className="flex flex-col items-center shrink-0">
                  <div className={`w-2.5 h-2.5 rounded-full ${color} mt-1`} />
                  {i < arr.length - 1 && <div className="w-px flex-1 bg-white/8 mt-1" />}
                </div>
                <div className="flex-1 min-w-0 pb-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Icon className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <p className="text-sm text-white">{label}</p>
                    </div>
                    <span className="text-xs text-slate-600 shrink-0">{time}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 ml-5">{detail}</p>
                </div>
              </motion.li>
            ))}
          </ul>
        </GlassCard>
      </motion.div>
    </div>
  );
}
