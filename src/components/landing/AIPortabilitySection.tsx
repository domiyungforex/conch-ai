"use client";

import { motion } from "framer-motion";
import { Brain, Smartphone, Globe, Cpu, ArrowRight } from "lucide-react";
import { GradientText } from "@/components/shared/GradientText";

const apps = [
  { icon: Brain, label: "Conch AI", color: "text-violet-400", bg: "bg-violet-500/15 border-violet-500/30" },
  { icon: Cpu, label: "Code Agent", color: "text-cyan-400", bg: "bg-cyan-500/15 border-cyan-500/30" },
  { icon: Smartphone, label: "Mobile App", color: "text-indigo-400", bg: "bg-indigo-500/15 border-indigo-500/30" },
  { icon: Globe, label: "Web App", color: "text-emerald-400", bg: "bg-emerald-500/15 border-emerald-500/30" },
];

const features = [
  "One identity, infinite AI surfaces",
  "No re-training or re-explaining yourself",
  "Permissions control which apps see what",
  "Real-time sync across all your devices",
];

export function AIPortabilitySection() {
  return (
    <section id="ai-portability" className="py-24 sm:py-32 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <p className="text-sm font-semibold text-cyan-400 tracking-widest uppercase mb-4">AI Portability</p>
          <h2 className="text-4xl sm:text-5xl font-bold text-white leading-tight mb-6">
            One memory.{" "}
            <GradientText variant="full">Every app.</GradientText>
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Stop re-explaining your preferences to every AI tool. Conch carries your full context wherever you go, making every AI smarter about you from day one.
          </p>
        </motion.div>

        {/* Flow diagram */}
        <div className="flex flex-col items-center gap-4 mb-16">
          {/* Memory core */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <div className="w-32 h-32 rounded-3xl glass border border-violet-500/40 flex flex-col items-center justify-center shadow-2xl animate-pulse-glow">
              <Brain className="w-10 h-10 text-violet-400 mb-2" />
              <span className="text-xs font-bold text-violet-300 tracking-widest">CONCH</span>
              <span className="text-xs text-slate-500">MEMORY</span>
            </div>
            {/* Pulsing rings */}
            <div className="absolute inset-0 rounded-3xl border border-violet-500/20 scale-110 animate-ping" style={{ animationDuration: "3s" }} />
          </motion.div>

          {/* Arrow */}
          <motion.div
            initial={{ opacity: 0, scaleY: 0 }}
            whileInView={{ opacity: 1, scaleY: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col items-center gap-1"
          >
            {[0, 1, 2].map((i) => (
              <ArrowRight key={i} className="w-4 h-4 text-slate-600 rotate-90" style={{ opacity: 1 - i * 0.3 }} />
            ))}
          </motion.div>

          {/* App grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {apps.map((app, i) => (
              <motion.div
                key={app.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.4 + i * 0.1 }}
                className={`flex flex-col items-center gap-3 p-5 rounded-2xl glass border ${app.bg} min-w-[120px]`}
              >
                <div className={`w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center`}>
                  <app.icon className={`w-6 h-6 ${app.color}`} />
                </div>
                <span className="text-sm font-medium text-white">{app.label}</span>
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs text-slate-500">synced</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Feature list */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="grid sm:grid-cols-2 gap-3 max-w-2xl mx-auto"
        >
          {features.map((f, i) => (
            <div key={i} className="flex items-center gap-3 glass border border-white/8 rounded-xl px-4 py-3">
              <div className="w-2 h-2 rounded-full bg-gradient-to-r from-violet-500 to-cyan-500 flex-shrink-0" />
              <span className="text-sm text-slate-300">{f}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
