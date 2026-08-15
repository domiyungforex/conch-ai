"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { KeyRound, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/shared/GlassCard";

const endpoints = [
  { method: "POST", path: "/v1/memories", desc: "Store a memory" },
  { method: "POST", path: "/v1/memories/search", desc: "Semantic search" },
  { method: "POST", path: "/v1/memories/recall", desc: "Recall context" },
];

const sdkLines = [
  'import Conch from "@conch/sdk";',
  "",
  'const conch = new Conch({ apiKey: process.env.CONCH_API_KEY });',
  "",
  "// Your AI remembers, forever",
  "await conch.memory.save({",
  '  userId: "user_123",',
  '  content: "User prefers concise answers."',
  "});",
  "",
  "// Any query finds the right memory",
  'const context = await conch.memory.recall({',
  '  userId: "user_123",',
  '  query: "How does this user prefer answers?"',
  "});",
];

export function DeveloperSection() {
  return (
    <section id="for-ai" className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden scroll-mt-20">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 right-0 w-96 h-96 bg-coral-500/8 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-teal-500/6 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-14 items-center">
          {/* Copy */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <span className="inline-flex items-center px-3 py-1 rounded-full glass border border-coral-500/25 eyebrow text-coral-600 mb-5">
              For AI Companies
            </span>
            <h2 className="font-display text-4xl sm:text-5xl font-medium text-slate-900 tracking-tight mb-5">
              The memory backend{" "}
              <span className="gradient-text">for any AI</span>
            </h2>
            <p className="text-lg text-slate-500 leading-relaxed mb-8">
              Conch is a persistent, model-agnostic memory layer behind one API. Any app, agent, or
              model — GPT, Claude, Gemini, or your own — can store, search, and recall memory in
              minutes, not months. AI can think. Conch remembers.
            </p>

            {/* Endpoint chips */}
            <div className="flex flex-col gap-2.5 mb-8">
              {endpoints.map((e) => (
                <div key={e.path} className="flex items-center gap-3 glass border border-white/60 rounded-xl px-4 py-2.5">
                  <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-md bg-coral-600 text-white">
                    {e.method}
                  </span>
                  <code className="font-mono text-sm text-slate-800">{e.path}</code>
                  <span className="ml-auto text-xs text-slate-500">{e.desc}</span>
                </div>
              ))}
            </div>

            <Button size="lg" asChild className="group">
              <Link href="/developers">
                <KeyRound className="w-4 h-4" />
                Get Your API Key
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </motion.div>

          {/* SDK snippet */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.15 }}
          >
            <GlassCard className="p-2 border border-white/60">
              <div className="rounded-2xl bg-[#181209] overflow-hidden shadow-2xl">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10">
                  <div className="w-3 h-3 rounded-full bg-[#e08a5e]" />
                  <div className="w-3 h-3 rounded-full bg-[#e0b353]" />
                  <div className="w-3 h-3 rounded-full bg-[#9ecf7f]" />
                  <span className="ml-2 font-mono text-xs text-[#a8997c]">memory.ts</span>
                </div>
                <pre className="p-5 font-mono text-[13px] leading-relaxed overflow-x-auto">
                  {sdkLines.map((line, i) =>
                    line ? (
                      <div key={i}>
                        <span className="text-[#a8997c] select-none mr-4 inline-block w-4 text-right">
                          {i + 1}
                        </span>
                        <span className={line.startsWith("//") ? "text-[#7a9e7f]" : "text-[#f0e9da]"}>
                          {line}
                        </span>
                      </div>
                    ) : (
                      <div key={i}> </div>
                    )
                  )}
                </pre>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
