"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { KeyRound, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/shared/GlassCard";

const endpoints = [
  { method: "POST", path: "/api/context", desc: "Store context" },
  { method: "POST", path: "/api/context/decisions", desc: "Store decisions" },
  { method: "POST", path: "/api/context/constraints", desc: "Store constraints" },
  { method: "POST", path: "/api/agents/handoffs", desc: "Agent handoffs" },
  { method: "GET", path: "/api/context?q=...", desc: "Semantic search" },
  { method: "GET", path: "/api/projects", desc: "List projects" },
];

const sdkLines = [
  'import Conch from "@conch/sdk";',
  "",
  'const conch = new Conch({ apiKey: process.env.CONCH_API_KEY });',
  "",
  "// Store a decision with full reasoning",
  "await conch.decisions.create({",
  '  what: "Use Anthropic for model infrastructure",',
  '  why: "Stable performance, manageable cost",',
  '  constraints: "Keep initial budget low",',
  "});",
  "",
  "// Retrieve context for an agent",
  'const context = await conch.context.retrieve({',
  '  query: "What decisions apply to this task?",',
  '  projectId: "proj_123",',
  "});",
  "",
  "// Hand off structured context between agents",
  'await conch.handoffs.create({',
  '  fromAgentId: "agent_a",',
  '  toAgentId: "agent_b",',
  '  objective: "Research market fit",',
  '  workCompleted: "Found 3 key insights",',
  '  requiredAction: "Create action plan",',
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
              For Developers
            </span>
            <h2 className="font-display text-4xl sm:text-5xl font-medium text-slate-900 tracking-tight mb-5">
              The context API{" "}
              <span className="gradient-text">for any agent</span>
            </h2>
            <p className="text-lg text-slate-500 leading-relaxed mb-8">
              Conch is a structured context layer behind one API. Any agent, app, or model can store
              decisions, retrieve constraints, and hand off structured context in minutes, not months.
              Intelligence tells an agent what to do. Conch tells it what came before.
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
