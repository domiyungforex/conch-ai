"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GradientText } from "@/components/shared/GradientText";

const phrases = ["Your Memory.", "Your Identity.", "Your AI.", "Your Future."];

export function HeroSection() {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [displayed, setDisplayed] = useState("");
  const [deleting, setDeleting] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    const current = phrases[phraseIndex];

    if (!deleting && displayed.length < current.length) {
      timeoutRef.current = setTimeout(() => setDisplayed(current.slice(0, displayed.length + 1)), 80);
    } else if (!deleting && displayed.length === current.length) {
      timeoutRef.current = setTimeout(() => setDeleting(true), 2200);
    } else if (deleting && displayed.length > 0) {
      timeoutRef.current = setTimeout(() => setDisplayed(displayed.slice(0, -1)), 45);
    } else if (deleting && displayed.length === 0) {
      setDeleting(false);
      setPhraseIndex((i) => (i + 1) % phrases.length);
    }

    return () => clearTimeout(timeoutRef.current);
  }, [displayed, deleting, phraseIndex]);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden mesh-gradient">
      {/* Animated orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl animate-float-delayed" />
        <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-cyan-600/8 rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }} />
        {/* Grid lines */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="white" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-24 pb-16">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-violet-500/30 text-xs text-violet-300 font-medium mb-8"
        >
          <Sparkles className="w-3.5 h-3.5 text-violet-400" />
          Decentralized AI Identity & Memory Platform
        </motion.div>

        {/* Main headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-white leading-[1.05] tracking-tight mb-6"
        >
          Own{" "}
          <span className="block">
            <GradientText variant="full">
              {displayed}
              <span className="animate-pulse ml-0.5 border-r-2 border-violet-400 pr-0.5 inline-block" style={{ animation: "typewriter-blink 1s infinite" }}>&nbsp;</span>
            </GradientText>
          </span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed mb-10"
        >
          Conch gives you a persistent, portable AI memory that travels with you across apps, devices, and blockchains. Your data, your identity, your intelligence.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Button size="xl" asChild className="w-full sm:w-auto group">
            <Link href="/sign-up">
              Start for Free
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
          <Button variant="secondary" size="xl" asChild className="w-full sm:w-auto">
            <a href="#how-it-works">See How It Works</a>
          </Button>
        </motion.div>

        {/* Social proof */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="mt-8 text-xs text-slate-600"
        >
          No credit card required · Free plan available · Join thousands of AI power users
        </motion.p>

        {/* Floating memory cards */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.5 }}
          className="relative mt-20 max-w-3xl mx-auto h-64 sm:h-80"
        >
          {/* Center card */}
          <div className="absolute left-1/2 -translate-x-1/2 top-0 w-72 sm:w-80 glass border border-white/10 rounded-2xl p-5 shadow-2xl animate-float z-10">
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
          </div>

          {/* Left card */}
          <div className="absolute left-0 sm:left-4 top-12 w-56 sm:w-64 glass border border-white/8 rounded-2xl p-4 shadow-xl animate-float-delayed z-0 hidden sm:block" style={{ opacity: 0.75 }}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                <span className="text-xs text-cyan-400">🎯</span>
              </div>
              <p className="text-xs font-semibold text-cyan-300">PREFERENCE</p>
            </div>
            <p className="text-xs text-slate-300">Dark mode advocate. Minimal UI. Keyboard-first workflows.</p>
          </div>

          {/* Right card */}
          <div className="absolute right-0 sm:right-4 top-8 w-52 sm:w-60 glass border border-white/8 rounded-2xl p-4 shadow-xl z-0 hidden sm:block" style={{ animation: "float 6s ease-in-out infinite", animationDelay: "3s", opacity: 0.75 }}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <span className="text-xs text-emerald-400">⚡</span>
              </div>
              <p className="text-xs font-semibold text-emerald-300">EPISODIC</p>
            </div>
            <p className="text-xs text-slate-300">Launched v2.0 on Base chain. Reviewed by 200 users.</p>
          </div>
        </motion.div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-[#0a0a0f] to-transparent pointer-events-none" />
    </section>
  );
}
