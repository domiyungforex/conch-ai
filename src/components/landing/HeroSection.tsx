"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import Link from "next/link";
import { ArrowRight, Sparkles, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GradientText } from "@/components/shared/GradientText";

const subPhrases = [
  "Portable memory.",
  "Persistent memory.",
  "Every conversation becomes memory.",
  "AI that remembers you everywhere.",
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
              The memory layer for AI
            </div>
          </div>

          {/* Main headline */}
          <h1 className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-normal text-white leading-[1.05] tracking-tight mb-4">
            AI can think.
            <br />
            <GradientText variant="full">Conch remembers.</GradientText>
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
            Every conversation becomes memory. Every memory stays yours, carried across every model, app, and
            device, recalled the moment you need it.
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

        {/* Floating memory cards */}
        <div className="relative mt-20 max-w-3xl mx-auto">
          {/* SVG neural connections */}
          <div className="absolute inset-0 pointer-events-none hidden sm:block">
            <svg
              className="absolute inset-0 w-full h-full"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M 50 20 Q 30 10 18 30"
                fill="none"
                style={{ stroke: "var(--color-coral-400)" }}
                strokeOpacity="0.25"
                strokeWidth="0.75"
                vectorEffect="non-scaling-stroke"
              />
              <path
                d="M 50 20 Q 72 10 82 28"
                fill="none"
                style={{ stroke: "var(--color-coral-400)" }}
                strokeOpacity="0.25"
                strokeWidth="0.75"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
          </div>

          <div className="flex items-start justify-center gap-4 sm:gap-6">
            {/* Left card — hidden on mobile */}
            <div className="hidden sm:block w-56 lg:w-64 flex-shrink-0 animate-float-delayed opacity-75 mt-8">
              <div className="glass border border-white/8 rounded-2xl p-4 shadow-xl">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-lg bg-teal-500/20 flex items-center justify-center">
                    <span className="text-xs text-teal-400">P</span>
                  </div>
                  <p className="text-xs font-semibold text-teal-300">PREFERENCE</p>
                </div>
                <p className="text-xs text-slate-300">Dark mode advocate. Minimal UI. Keyboard-first workflows.</p>
              </div>
            </div>

            {/* Center card */}
            <div className="w-full sm:w-72 lg:w-80 flex-shrink-0 glass border border-white/10 rounded-2xl p-5 shadow-2xl z-10 animate-float">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-coral-500/20 flex items-center justify-center flex-shrink-0">
                  <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-coral-400">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" fill="currentColor"/>
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-semibold text-coral-300 mb-1">SEMANTIC MEMORY</p>
                  <p className="text-sm text-white">Prefers TypeScript over JavaScript for type safety in large codebases.</p>
                  <p className="text-xs text-slate-500 mt-2">Accessed 47 times · 2 days ago</p>
                </div>
              </div>
            </div>

            {/* Right card — hidden on mobile */}
            <div className="hidden sm:block w-52 lg:w-60 flex-shrink-0 opacity-75 animate-float mt-4">
              <div className="glass border border-white/8 rounded-2xl p-4 shadow-xl">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                    <span className="text-xs text-emerald-400">E</span>
                  </div>
                  <p className="text-xs font-semibold text-emerald-300">EPISODIC</p>
                </div>
                <p className="text-xs text-slate-300">Launched v2.0 on Base chain. Reviewed by 200 users.</p>
              </div>
            </div>
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
