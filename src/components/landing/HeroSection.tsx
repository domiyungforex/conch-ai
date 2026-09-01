"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import Link from "next/link";
import { ArrowRight, Sparkles, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GradientText } from "@/components/shared/GradientText";

const subPhrases = [
  "Context survives every handoff.",
  "Meaning persists between agents.",
  "Decisions remembered. Constraints enforced.",
  "The infrastructure for intelligent continuity.",
];

export function HeroSection() {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [displayed, setDisplayed] = useState("");
  const [deleting, setDeleting] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    const current = subPhrases[phraseIndex];
    if (!deleting && displayed.length < current.length) {
      timeoutRef.current = setTimeout(() => setDisplayed(current.slice(0, displayed.length + 1)), 75);
    } else if (!deleting && displayed.length === current.length) {
      timeoutRef.current = setTimeout(() => setDeleting(true), 2400);
    } else if (deleting && displayed.length > 0) {
      timeoutRef.current = setTimeout(() => setDisplayed(displayed.slice(0, -1)), 40);
    } else if (deleting && displayed.length === 0) {
      setDeleting(false);
      setPhraseIndex((i) => (i + 1) % subPhrases.length);
    }
    return () => clearTimeout(timeoutRef.current);
  }, [displayed, deleting, phraseIndex]);

  const particles = useMemo(
    () =>
      Array.from({ length: 20 }, (_, i) => ({
        id: i,
        left: `${5 + ((i * 4.7) % 90)}%`,
        top: `${10 + ((i * 7.3) % 80)}%`,
        size: 2 + (i % 4),
        driftX: `${(i % 5 - 2) * 4}px`,
        driftY: `${(i % 3 - 1) * 6}px`,
        duration: `${5 + (i % 6)}s`,
        delay: `${(i * 0.4) % 3}s`,
        opacityBase: 0.3 + (i % 3) * 0.2,
      })),
    []
  );

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden mesh-gradient">
      {/* Background layer */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Breathing orbs — radial-gradient light, CSS-driven transform+opacity
            (GPU-composited, no blur filter). The old Framer blur orbs forced a
            full re-raster every frame and dragged the page down. */}
        <div className="hero-orb w-[26rem] h-[26rem] -top-24 -left-24" />
        <div className="hero-orb hero-orb--jade w-[22rem] h-[22rem] bottom-1/4 -right-24" />

        {/* Floating particles */}
        {particles.map((p) => (
          <div
            key={p.id}
            className="particle"
            style={
              {
                left: p.left,
                top: p.top,
                width: p.size,
                height: p.size,
                "--drift-x": p.driftX,
                "--drift-y": p.driftY,
                "--duration": p.duration,
                "--delay": p.delay,
                "--opacity-base": p.opacityBase,
              } as React.CSSProperties
            }
          />
        ))}

        {/* Grid lines */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.025]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="hero-grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="white" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hero-grid)" />
        </svg>
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-28 pb-20">
        {/* Text content — staggered entry */}
        <div>
          {/* Badge */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-coral-500/30 eyebrow text-coral-300 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-coral-400" />
              The context layer for AI agents
            </div>
          </div>

          {/* Main headline */}
          <h1 className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-normal text-white leading-[1.05] tracking-tight mb-4">
            Intelligence tells
            <br />
            an agent what to do.
            <br />
            <GradientText variant="full">Conch helps it understand</GradientText>
            <br />
            <GradientText variant="full">what came before.</GradientText>
          </h1>

          {/* Animated sub-phrase */}
          <div className="h-8 flex items-center justify-center mb-4">
            <span className="text-lg sm:text-xl text-coral-300 font-medium">
              {displayed}
              <span className="inline-block w-0.5 h-5 bg-coral-400 ml-0.5 align-middle animate-pulse" />
            </span>
          </div>

          {/* Static subheadline */}
          <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed mb-10">
            Persistent context, decisions, constraints, and memory — carried across every agent, model,
            and task. The infrastructure that allows meaning to survive between handoffs.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="xl" asChild className="w-full sm:w-auto group glow-pulse">
              <Link href="/sign-up">
                Start Remembering
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button variant="secondary" size="xl" asChild className="w-full sm:w-auto">
              <a href="#interactive-demo">Watch Demo</a>
            </Button>
          </div>

          {/* Social proof */}
          <p className="mt-8 text-xs text-slate-600">
            No credit card required · Free to start · Your memory travels with you
          </p>

          {/* Memory motif — connection lines under the cards */}
          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-56 memory-divider opacity-60" />
        </div>

        {/* Agent workflow visualization */}
        <div className="relative mt-20 max-w-4xl mx-auto">
          {/* SVG neural connections */}
          <div className="absolute inset-0 pointer-events-none hidden sm:block">
            <svg
              className="absolute inset-0 w-full h-full"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M 15 50 Q 25 30 35 50" fill="none" style={{ stroke: "var(--color-coral-400)" }} strokeOpacity="0.3" strokeWidth="0.75" vectorEffect="non-scaling-stroke" />
              <path d="M 35 50 Q 45 30 55 50" fill="none" style={{ stroke: "var(--color-teal-400)" }} strokeOpacity="0.3" strokeWidth="0.75" vectorEffect="non-scaling-stroke" />
              <path d="M 55 50 Q 65 30 75 50" fill="none" style={{ stroke: "var(--color-gold-400)" }} strokeOpacity="0.3" strokeWidth="0.75" vectorEffect="non-scaling-stroke" />
              <path d="M 75 50 Q 85 30 95 50" fill="none" style={{ stroke: "var(--color-coral-400)" }} strokeOpacity="0.3" strokeWidth="0.75" vectorEffect="non-scaling-stroke" />
            </svg>
          </div>

          <div className="flex items-start justify-center gap-3 sm:gap-5">
            {/* RESEARCH agent */}
            <div className="hidden sm:block w-40 lg:w-48 flex-shrink-0 animate-float-delayed opacity-75 mt-8">
              <div className="glass border border-white/8 rounded-2xl p-4 shadow-xl">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-lg bg-teal-500/20 flex items-center justify-center">
                    <span className="text-xs text-teal-400">R</span>
                  </div>
                  <p className="text-xs font-semibold text-teal-300">RESEARCH</p>
                </div>
                <p className="text-xs text-slate-300">Gathered 12 data points. Confidence: 0.87</p>
              </div>
            </div>

            {/* CONCH CONTEXT — center card */}
            <div className="w-full sm:w-56 lg:w-64 flex-shrink-0 glass border border-white/10 rounded-2xl p-5 shadow-2xl z-10 animate-float">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-coral-500/20 flex items-center justify-center flex-shrink-0">
                  <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-coral-400">
                    <path d="M13.2 20c-4.6 0-7.7-3.4-7.7-7.3 0-3.2 2.3-5.6 5.2-5.6 2.4 0 4.1 1.7 4.1 3.9 0 1.8-1.2 3.1-2.8 3.1-1.3 0-2.2-.9-2.2-2.1 0-.9.6-1.6 1.5-1.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" fill="none"/>
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-semibold text-coral-300 mb-1">CONCH CONTEXT</p>
                  <p className="text-sm text-white">Structured context preserved. Meaning survives the handoff.</p>
                  <p className="text-xs text-slate-500 mt-2">3 decisions · 5 constraints · 12 memories</p>
                </div>
              </div>
            </div>

            {/* EXECUTE agent */}
            <div className="hidden sm:block w-40 lg:w-48 flex-shrink-0 opacity-75 animate-float mt-4">
              <div className="glass border border-white/8 rounded-2xl p-4 shadow-xl">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-lg bg-gold-500/20 flex items-center justify-center">
                    <span className="text-xs text-gold-400">E</span>
                  </div>
                  <p className="text-xs font-semibold text-gold-300">EXECUTE</p>
                </div>
                <p className="text-xs text-slate-300">Received full context. No re-explanation needed.</p>
              </div>
            </div>
          </div>

          {/* Flow arrows */}
          <div className="flex justify-center gap-4 sm:gap-8 mt-4 text-[10px] text-slate-500 uppercase tracking-widest">
            <span>Research</span>
            <span className="text-coral-400">→ Conch →</span>
            <span>Plan</span>
            <span className="text-coral-400">→ Conch →</span>
            <span>Execute</span>
            <span className="text-coral-400">→ Conch →</span>
            <span>Verify</span>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 pointer-events-none z-10">
        <span className="text-[10px] text-slate-600 tracking-widest uppercase font-medium">Scroll</span>
        <ChevronDown className="w-4 h-4 text-slate-600 animate-scroll-bounce" />
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-background to-transparent pointer-events-none" />
    </section>
  );
}
