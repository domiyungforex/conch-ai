"use client";

import { motion } from "framer-motion";
import { ShieldCheck, Download, Link2 } from "lucide-react";
import { GradientText } from "@/components/shared/GradientText";

const benefits = [
  {
    icon: ShieldCheck,
    title: "Full Ownership",
    description: "Your memories are encrypted and stored under your identity. No platform can access, sell, or delete them without your explicit permission.",
    color: "text-coral-400",
    bg: "bg-coral-500/10",
  },
  {
    icon: Download,
    title: "Portable & Exportable",
    description: "Export your entire AI memory graph at any time. Import it into any Conch-compatible app or store it on your own infrastructure.",
    color: "text-teal-400",
    bg: "bg-teal-500/10",
  },
  {
    icon: Link2,
    title: "On-Chain Proof",
    description: "Anchor your identity and key memories to the Base blockchain. Your AI history becomes verifiable, immutable, and truly yours.",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
  },
];

const floatingCards = [
  { category: "EPISODIC", color: "text-coral-300", bg: "bg-coral-500/10 border-coral-500/20", content: "Launched SaaS product on Base chain — 247 early adopters in 48 hours.", delay: 0 },
  { category: "PREFERENCE", color: "text-teal-300", bg: "bg-teal-500/10 border-teal-500/20", content: "Prefers async communication. Best focus window: 6–10am.", delay: 1.5 },
  { category: "SEMANTIC", color: "text-emerald-300", bg: "bg-emerald-500/10 border-emerald-500/20", content: "Expert in distributed systems and zero-knowledge proofs.", delay: 3 },
];

export function MemoryOwnershipSection() {
  return (
    <section id="memory-ownership" className="py-24 sm:py-32 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-0 w-96 h-96 bg-coral-600/8 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-0 w-72 h-72 bg-teal-600/6 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left: floating memory cards */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="relative h-80 lg:h-96 order-2 lg:order-1"
          >
            {floatingCards.map((card, i) => (
              <div
                key={card.category}
                className={`absolute glass border ${card.bg} rounded-2xl p-4 w-64 sm:w-72 shadow-xl`}
                style={{
                  top: `${i * 90}px`,
                  left: i % 2 === 0 ? "0px" : "60px",
                  animation: `float ${4 + i}s ease-in-out infinite`,
                  animationDelay: `${card.delay}s`,
                  zIndex: 3 - i,
                }}
              >
                <p className={`text-xs font-bold tracking-wider mb-2 ${card.color}`}>{card.category}</p>
                <p className="text-sm text-slate-300 leading-relaxed">{card.content}</p>
                <div className="mt-2 flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span className="text-xs text-slate-500">Owned by you · On-chain verified</span>
                </div>
              </div>
            ))}
          </motion.div>

          {/* Right: text content */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="order-1 lg:order-2"
          >
            <p className="text-sm font-semibold text-coral-400 tracking-widest uppercase mb-4">Memory Ownership</p>
            <h2 className="text-4xl sm:text-5xl font-bold text-white leading-tight mb-6">
              Your memories.{" "}
              <GradientText>Your rules.</GradientText>
            </h2>
            <p className="text-lg text-slate-400 leading-relaxed mb-10">
              In a world of AI platforms that mine your data, Conch flips the model. Every memory you create belongs exclusively to you — provably, cryptographically, permanently.
            </p>

            <div className="space-y-6">
              {benefits.map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="flex items-start gap-4"
                >
                  <div className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                    <item.icon className={`w-5 h-5 ${item.color}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">{item.title}</h3>
                    <p className="text-sm text-slate-400 leading-relaxed">{item.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
