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
    description: "Your AI remembers everything — preferences, goals, past conversations, and context — so you never have to repeat yourself again.",
  },
  {
    icon: Globe,
    color: "text-teal-400",
    bg: "bg-teal-500/10 border-teal-500/20",
    title: "Portable Identity",
    description: "Carry your AI identity across platforms, devices, and applications. Your memory travels with you wherever you go.",
  },
  {
    icon: Shield,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
    title: "You Own Your Data",
    description: "Cryptographically secured memory with on-chain identity proofs. Delete, export, or share your data at any time.",
  },
  {
    icon: Zap,
    color: "text-yellow-400",
    bg: "bg-yellow-500/10 border-yellow-500/20",
    title: "Instant Context",
    description: "Semantic search retrieves the most relevant memories in milliseconds, giving AI responses that feel eerily personal.",
  },
  {
    icon: Cpu,
    color: "text-gold-400",
    bg: "bg-gold-500/10 border-gold-500/20",
    title: "Custom AI Agents",
    description: "Build specialized agents with unique personalities, memory scopes, and system prompts tailored to your workflow.",
  },
  {
    icon: Lock,
    color: "text-pink-400",
    bg: "bg-pink-500/10 border-pink-500/20",
    title: "Privacy First",
    description: "End-to-end encryption, zero-knowledge architecture, and granular sharing permissions. Your memory stays yours.",
  },
];

export function BenefitsSection() {
  return (
    <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
        className="text-center mb-16"
      >
        <span className="inline-flex items-center px-3 py-1 rounded-full glass border border-white/10 text-xs text-slate-400 mb-4">
          Why Conch
        </span>
        <h2 className="text-4xl sm:text-5xl font-bold text-white tracking-tight mb-4">
          AI that actually{" "}
          <span className="gradient-text">knows you</span>
        </h2>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto">
          Built for people who use AI every day and are tired of starting from scratch every time.
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
