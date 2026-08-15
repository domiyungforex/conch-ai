"use client";

import { motion } from "framer-motion";
import { UserPlus, MessageSquare, Brain, Rocket } from "lucide-react";

const steps = [
  {
    step: "01",
    icon: UserPlus,
    title: "Open Your Memory",
    description: "Sign up with email, Google, or your Web3 wallet. Your memory vault opens instantly — empty, private, yours.",
    color: "from-coral-600 to-coral-800",
    glow: "shadow-coral-500/30",
  },
  {
    step: "02",
    icon: MessageSquare,
    title: "Conversations Become Memories",
    description: "Talk naturally. Conch classifies, extracts, and scores what matters — preferences, facts, decisions — and files it all away.",
    color: "from-gold-600 to-gold-800",
    glow: "shadow-gold-500/30",
  },
  {
    step: "03",
    icon: Brain,
    title: "Memory Compounds",
    description: "Every new conversation begins with full recall of everything before it. Your AI knows you better each time — because it never forgets.",
    color: "from-teal-600 to-teal-800",
    glow: "shadow-teal-500/30",
  },
  {
    step: "04",
    icon: Rocket,
    title: "Take Your Memory Anywhere",
    description: "Export, share, or plug your memory into any model through the Conch API. It goes wherever you need it.",
    color: "from-emerald-600 to-emerald-800",
    glow: "shadow-emerald-500/30",
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-24 relative overflow-hidden scroll-mt-20">
      <div className="absolute inset-0 mesh-gradient opacity-50" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center px-3 py-1 rounded-full glass border border-coral-500/25 text-[11px] font-mono uppercase tracking-[0.25em] text-coral-300/90 mb-4">
            How It Works
          </span>
          <h2 className="text-4xl sm:text-5xl font-serif font-medium text-white tracking-tight mb-4">
            Memory that{" "}
            <span className="gradient-text">grows with every word</span>
          </h2>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            No setup, no configuration. Every conversation quietly becomes memory.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {/* Connector line */}
          <div className="hidden lg:block absolute top-12 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-coral-600/0 via-coral-600/40 to-coral-600/0" />

          {steps.map((s, i) => (
            <motion.div
              key={s.step}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="relative flex flex-col items-center text-center"
            >
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${s.color} flex items-center justify-center shadow-xl ${s.glow} mb-4 relative z-10`}>
                <s.icon className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs font-mono text-slate-600 mb-2">{s.step}</span>
              <h3 className="text-white font-semibold text-base mb-2">{s.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{s.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
