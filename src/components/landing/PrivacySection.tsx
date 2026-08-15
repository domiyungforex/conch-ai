"use client";

import { motion } from "framer-motion";
import { Eye, Key, Trash2 } from "lucide-react";
import { GlassCard } from "@/components/shared/GlassCard";

const pillars = [
  {
    icon: Eye,
    color: "text-coral-400",
    bg: "bg-coral-500/10 border-coral-500/20",
    title: "You Decide What's Remembered",
    description: "Granular controls let you choose exactly which memories persist. Review, edit, or delete any memory at any time from your dashboard.",
  },
  {
    icon: Key,
    color: "text-teal-400",
    bg: "bg-teal-500/10 border-teal-500/20",
    title: "End-to-End Encrypted",
    description: "Memory content is encrypted at rest and in transit. Even Conch cannot read your private memories. Your keys, your data.",
  },
  {
    icon: Trash2,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
    title: "Right to Delete",
    description: "Request full data deletion at any time. Your memories are removed from our servers and vector database within 30 days — permanently.",
  },
];

export function PrivacySection() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-coral-950/10 to-transparent pointer-events-none" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center px-3 py-1 rounded-full glass border border-coral-500/25 eyebrow text-coral-300/90 mb-4">
            Privacy Architecture
          </span>
          <h2 className="text-4xl sm:text-5xl font-display font-medium text-white tracking-tight mb-4">
            Your memory,{" "}
            <span className="gradient-text">not ours</span>
          </h2>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            Conch is built on radical transparency and user control. Memory is yours — review, edit, or delete it anytime.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {pillars.map((p, i) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <GlassCard hover className="p-7 h-full text-center">
                <div className={`inline-flex w-14 h-14 rounded-2xl border items-center justify-center mb-5 ${p.bg}`}>
                  <p.icon className={`w-7 h-7 ${p.color}`} />
                </div>
                <h3 className="text-white font-semibold text-lg mb-3">{p.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{p.description}</p>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
