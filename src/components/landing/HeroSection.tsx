"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import Link from "next/link";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { ArrowRight, Sparkles, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GradientText } from "@/components/shared/GradientText";

const subPhrases = [
  "Portable memory.",
  "Persistent identity.",
  "AI that remembers you everywhere.",
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.15 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
};

export function HeroSection() {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [displayed, setDisplayed] = useState("");
  const [deleting, setDeleting] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 50, damping: 25 });
  const springY = useSpring(mouseY, { stiffness: 50, damping: 25 });
  const leftX = useTransform(springX, (v) => v * 0.5);
  const leftY = useTransform(springY, (v) => v * 0.6);
  const rightX = useTransform(springX, (v) => v * -0.4);
  const rightY = useTransform(springY, (v) => v * -0.35);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      mouseX.set((e.clientX / window.innerWidth - 0.5) * 20);
      mouseY.set((e.clientY / window.innerHeight - 0.5) * 12);
    };
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, [mouseX, mouseY]);

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
        {/* Breathing orbs */}
        <motion.div
          animate={{ scale: [1, 1.18, 1], opacity: [0.08, 0.16, 0.08] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.06, 0.13, 0.06] }}
          transition={{ duration: 11, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
          className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-indigo-600 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.05, 0.10, 0.05] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
          className="absolute top-1/2 right-1/3 w-64 h-64 bg-cyan-600 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ scale: [1, 1.22, 1], opacity: [0.04, 0.09, 0.04] }}
          transition={{ duration: 13, repeat: Infinity, ease: "easeInOut", delay: 2.5 }}
          className="absolute bottom-1/4 left-1/3 w-56 h-56 bg-violet-500 rounded-full blur-3xl"
        />

        {/* Floating particles — CSS vars are required inline for per-particle randomness */}
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
        <motion.div variants={containerVariants} initial="hidden" animate="visible">
          {/* Badge */}
          <motion.div variants={itemVariants} className="flex justify-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-violet-500/30 text-xs text-violet-300 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-violet-400" />
              Decentralized AI Identity &amp; Memory Platform
            </div>
          </motion.div>

          {/* Main headline */}
          <motion.h1
            variants={itemVariants}
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-white leading-[1.05] tracking-tight mb-4"
          >
            Your AI Should
            <br />
            <GradientText variant="full">Belong To You</GradientText>
          </motion.h1>

          {/* Animated sub-phrase */}
          <motion.div variants={itemVariants} className="h-8 flex items-center justify-center mb-4">
            <span className="text-lg sm:text-xl text-violet-300 font-medium">
              {displayed}
              <span className="inline-block w-0.5 h-5 bg-violet-400 ml-0.5 align-middle animate-pulse" />
            </span>
          </motion.div>

          {/* Static subheadline */}
          <motion.p
            variants={itemVariants}
            className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed mb-10"
          >
            Portable memory, persistent identity, and AI agents that remember you everywhere.
          </motion.p>

          {/* CTAs */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Button size="xl" asChild className="w-full sm:w-auto group glow-pulse">
              <Link href="/sign-up">
                Start for Free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button variant="secondary" size="xl" asChild className="w-full sm:w-auto">
              <a href="#interactive-demo">Watch Demo</a>
            </Button>
          </motion.div>

          {/* Social proof */}
          <motion.p variants={itemVariants} className="mt-8 text-xs text-slate-600">
            No credit card required · Free plan available · Join thousands of AI power users
          </motion.p>
        </motion.div>

        {/* Floating memory cards */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.6 }}
          className="relative mt-20 max-w-3xl mx-auto h-64 sm:h-80"
        >
          {/* SVG neural connections between cards */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.4 }}
            className="absolute inset-0 pointer-events-none"
          >
            <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M 50% 30% Q 30% 20% 20% 40%"
                fill="none"
                stroke="rgba(124,58,237,0.15)"
                strokeWidth="1.5"
                strokeDasharray="4 5"
              />
              <path
                d="M 50% 30% Q 30% 20% 20% 40%"
                fill="none"
                stroke="rgba(124,58,237,0.5)"
                strokeWidth="1"
                className="neural-line"
              />
              <path
                d="M 50% 30% Q 72% 18% 80% 38%"
                fill="none"
                stroke="rgba(124,58,237,0.15)"
                strokeWidth="1.5"
                strokeDasharray="4 5"
              />
              <path
                d="M 50% 30% Q 72% 18% 80% 38%"
                fill="none"
                stroke="rgba(124,58,237,0.5)"
                strokeWidth="1"
                className="neural-line neural-line--delayed"
              />
            </svg>
          </motion.div>

          {/* Center card */}
          <motion.div
            style={{ x: springX, y: springY }}
            className="absolute left-1/2 -translate-x-1/2 top-0 w-72 sm:w-80 glass border border-white/10 rounded-2xl p-5 shadow-2xl z-10 animate-float"
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-violet-500/20 flex items-center justify-center flex-shrink-0">
                <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-violet-400">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" fill="currentColor"/>
                </svg>
              </div>
              <div>
                <p className="text-xs font-semibold text-violet-300 mb-1">SEMANTIC MEMORY</p>
                <p className="text-sm text-white">Prefers TypeScript over JavaScript for type safety in large codebases.</p>
                <p className="text-xs text-slate-500 mt-2">Accessed 47 times · 2 days ago</p>
              </div>
            </div>
          </motion.div>

          {/* Left card */}
          <motion.div
            style={{ x: leftX, y: leftY }}
            className="absolute left-0 sm:left-4 top-12 w-56 sm:w-64 z-0 hidden sm:block animate-float-delayed opacity-75"
          >
            <div className="glass border border-white/8 rounded-2xl p-4 shadow-xl">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                  <span className="text-xs text-cyan-400">P</span>
                </div>
                <p className="text-xs font-semibold text-cyan-300">PREFERENCE</p>
              </div>
              <p className="text-xs text-slate-300">Dark mode advocate. Minimal UI. Keyboard-first workflows.</p>
            </div>
          </motion.div>

          {/* Right card */}
          <motion.div
            style={{ x: rightX, y: rightY }}
            className="absolute right-0 sm:right-4 top-8 w-52 sm:w-60 z-0 hidden sm:block opacity-75 animate-float"
          >
            <div className="glass border border-white/8 rounded-2xl p-4 shadow-xl">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                  <span className="text-xs text-emerald-400">E</span>
                </div>
                <p className="text-xs font-semibold text-emerald-300">EPISODIC</p>
              </div>
              <p className="text-xs text-slate-300">Launched v2.0 on Base chain. Reviewed by 200 users.</p>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 pointer-events-none z-10">
        <span className="text-[10px] text-slate-600 tracking-widest uppercase font-medium">Scroll</span>
        <ChevronDown className="w-4 h-4 text-slate-600 animate-scroll-bounce" />
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-[#0a0a0f] to-transparent pointer-events-none" />
    </section>
  );
}
