"use client";

import { motion } from "framer-motion";
import { Brain, Shield, Zap, Globe, Lock, Cpu } from "lucide-react";
import { GlassCard } from "@/components/shared/GlassCard";

const benefits = [
  {
    icon: Brain,
    color: "text-coral-400",
    bg: "bg-coral-500/10 border-coral-500/20",
    title: "Persistent Memory",
    description: "Everything you say becomes memory — preferences, goals, decisions, and context. Your AI never forgets, so you never repeat yourself.",
  },
  {
    icon: Globe,
    color: "text-teal-400",
    bg: "bg-teal-500/10 border-teal-500/20",
    title: "Memory That Travels",
    description: "Carry your memory across platforms, devices, and models — GPT today, Claude tomorrow. It all remembers the same you.",
  },
  {
    icon: Shield,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
    title: "You Own Every Memory",
    description: "Cryptographically secured memory under your identity. Delete, export, or share any memory — on your terms, at any time.",
  },
  {
    icon: Zap,
    color: "text-yellow-400",
    bg: "bg-yellow-500/10 border-yellow-500/20",
    title: "Instant Recall",
    description: "Semantic search resurfaces the right memory in milliseconds, so every answer draws on everything you've told it.",
  },
  {
    icon: Cpu,
    color: "text-gold-400",
    bg: "bg-gold-500/10 border-gold-500/20",
    title: "Memory-Scoped Agents",
    description: "Give each agent its own slice of memory — a coder, a writer, a strategist — each working from the context it needs.",
  },
  {
    icon: Lock,
    color: "text-pink-400",
    bg: "bg-pink-500/10 border-pink-500/20",
    title: "Private By Default",
    description: "Encrypted storage and granular sharing permissions. Every memory stays yours until you decide otherwise.",
  },
];

export function BenefitsSection() {
  return (
    <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto scroll-mt-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
        className="text-center mb-16"
      >
        <span className="inline-flex items-center px-3 py-1 rounded-full glass border border-coral-500/25 eyebrow text-coral-300/90 mb-4">
          Why Memory
        </span>
        <h2 className="text-4xl sm:text-5xl font-display font-medium text-white tracking-tight mb-4">
          Not a chatbot.{" "}
          <span className="gradient-text">A memory layer.</span>
        </h2>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto">
          Models change. Apps change. Your memory shouldn&apos;t.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {benefits.map((b, i) => (
          <motion.div
            key={b.title}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, delay: i * 0.08 }}
          >
            <GlassCard hover className="p-6 h-full">
              <div className={`inline-flex w-11 h-11 rounded-xl border items-center justify-center mb-4 ${b.bg}`}>
                <b.icon className={`w-5 h-5 ${b.color}`} />
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">{b.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{b.description}</p>
            </GlassCard>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
