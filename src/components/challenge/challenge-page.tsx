"use client";

import { useState, useEffect } from "react";
import { WaitlistSignup } from "./waitlist-signup";
import { ChallengeFooter } from "./challenge-footer";
import { ChallengeCountdown } from "./challenge-countdown";
import { PublishedWinners } from "./published-winners";
import { ScrollReveal, StaggerReveal } from "@/hooks/use-scroll-reveal";
import {
  Rocket, Code, Send, Trophy, Scale, Calendar, Eye,
  ChevronDown, ChevronUp, Lightbulb, Brain, Bot, Cpu,
  ArrowRight, Clock, Star
} from "lucide-react";

/* ─── Navigation ─── */
const navItems = [
  { label: "Overview", href: "#overview" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "What You Can Build", href: "#what-to-build" },
  { label: "Prizes", href: "#prizes" },
  { label: "Judging", href: "#judging" },
  { label: "Timeline", href: "#timeline" },
  { label: "FAQ", href: "#faq" },
  { label: "Join", href: "#join" },
];

function ChallengeNav({ onJoinClick }: { onJoinClick: () => void }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 border-b border-[var(--conch-border)] transition-all duration-300"
      style={{
        background: scrolled ? "rgba(5, 5, 8, 0.95)" : "rgba(5, 5, 8, 0.8)",
        backdropFilter: "blur(20px)",
      }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <a href="/challenge" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #7c3aed, #a78bfa)" }}>
            <span className="text-white text-sm font-bold">C</span>
          </div>
          <span className="text-[var(--conch-text)] font-semibold tracking-tight text-lg hidden sm:inline">Conch</span>
        </a>

        <div className="hidden lg:flex items-center gap-1">
          {navItems.map((item) => (
            <a key={item.label} href={item.href}
              className="px-3 py-1.5 rounded-md text-xs font-medium text-[var(--conch-text-muted)] hover:text-[var(--conch-text)] hover:bg-white/5 transition-all duration-200 conch-focus">
              {item.label}
            </a>
          ))}
        </div>

        <button onClick={onJoinClick}
          className="px-5 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90 conch-btn-press">
          <span style={{ background: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)", padding: "0.5rem 1.25rem", borderRadius: "0.5rem", display: "inline-block" }}>
            Join Challenge
          </span>
        </button>
      </div>
    </nav>
  );
}

/* ─── Hero ─── */
function ChallengeHero({ onJoinClick }: { onJoinClick: () => void }) {
  return (
    <section id="overview" className="relative pt-32 pb-20 md:pt-44 md:pb-32 px-4 sm:px-6 overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full opacity-25 blur-[150px] pointer-events-none"
        style={{ background: "radial-gradient(circle, #7c3aed 0%, transparent 70%)" }} />

      <div className="max-w-4xl mx-auto text-center relative z-10">
        <ScrollReveal>
          <div className="mb-8 space-y-1">
            {["BUILD.", "REMEMBER.", "CREATE."].map((word, i) => (
              <p key={word} className="text-3xl md:text-5xl font-bold tracking-tight text-[var(--conch-text)]"
                style={{ animationDelay: `${i * 0.15}s` }}>
                {word}
              </p>
            ))}
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.2}>
          <h1 className="text-2xl md:text-4xl font-bold text-[var(--conch-text)] mb-4">
            THE CONCH CREATOR CHALLENGE
          </h1>
        </ScrollReveal>

        <ScrollReveal delay={0.3}>
          <p className="text-lg md:text-xl text-[var(--conch-text-muted)] max-w-2xl mx-auto mb-8">
            Build something meaningful using Conch&apos;s persistent memory and agent infrastructure.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={0.4}>
          <div className="mb-4">
            <span className="text-5xl md:text-7xl font-bold conch-shimmer">$5,000</span>
          </div>
          <p className="text-[var(--conch-text-muted)] mb-6">3 winners. One challenge. Endless possibilities.</p>
        </ScrollReveal>

        <ScrollReveal delay={0.45}>
          <div className="mb-8">
            <ChallengeCountdown size="md" />
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.5}>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button onClick={onJoinClick}
              className="px-8 py-4 rounded-xl font-bold text-white text-lg transition-all hover:opacity-90 conch-glow conch-btn-press flex items-center gap-2"
              style={{ background: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 50%, #5b21b6 100%)" }}>
              Join the Challenge
              <ArrowRight className="w-5 h-5" />
            </button>
            <a href="#how-it-works"
              className="px-8 py-4 rounded-xl font-semibold text-[var(--conch-text)] text-lg border border-[var(--conch-border)] hover:border-[var(--conch-border-hover)] transition-all conch-card-hover"
              style={{ background: "rgba(124, 58, 237, 0.05)" }}>
              View Rules
            </a>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

/* ─── How It Works ─── */
const steps = [
  {
    num: "01", title: "Subscribe",
    description: "Get access to the Conch platform and the features required to participate. Your subscription provides genuine access to Conch's persistent memory, agents, and tools.",
    icon: Rocket, features: ["Persistent memory", "AI agents", "API/SDK access"],
  },
  {
    num: "02", title: "Build",
    description: "Use Conch's infrastructure to build something useful — a tool, an app, a workflow, a creative project. The only limit is your imagination.",
    icon: Code, features: ["Memory", "Agents", "Knowledge", "Automation"],
  },
  {
    num: "03", title: "Submit",
    description: "Submit your project before the deadline with a demo, description, and documentation of how you used Conch.",
    icon: Send, features: ["Demo", "Video", "Documentation", "Source code"],
  },
  {
    num: "04", title: "Win",
    description: "Projects are evaluated against published judging criteria. Top projects receive prizes from the $5,000 Creator Fund.",
    icon: Trophy, features: ["Innovation", "Memory use", "Impact", "Presentation"],
  },
];

function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 md:py-32 px-4 sm:px-6" style={{ background: "var(--conch-surface)" }}>
      <div className="max-w-5xl mx-auto">
        <ScrollReveal>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-[var(--conch-text)] mb-4">How It Works</h2>
            <p className="text-lg text-[var(--conch-text-muted)] max-w-xl mx-auto">Four steps from idea to prize.</p>
          </div>
        </ScrollReveal>

        <div className="space-y-8">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <ScrollReveal key={step.num} delay={i * 0.1}>
                <div className="conch-glass rounded-2xl p-6 md:p-8 flex flex-col md:flex-row gap-6 conch-card-hover">
                  <div className="flex items-start gap-4 md:w-64 shrink-0">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.2), rgba(124,58,237,0.05))" }}>
                      <Icon className="w-6 h-6 text-[var(--conch-purple-light)]" />
                    </div>
                    <div>
                      <span className="text-xs text-[var(--conch-text-dim)] font-mono tracking-wider">STEP {step.num}</span>
                      <h3 className="text-xl font-bold text-[var(--conch-text)]">{step.title}</h3>
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-[var(--conch-text-muted)] leading-relaxed mb-4">{step.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {step.features.map((f) => (
                        <span key={f} className="text-xs px-2.5 py-1 rounded-full border border-[var(--conch-border)] text-[var(--conch-text-dim)]">
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ─── What You Can Build ─── */
const buildCategories = [
  { icon: Brain, title: "Personal AI", desc: "An AI that understands your long-term goals and preferences." },
  { icon: Bot, title: "AI Agents", desc: "Agents that remember previous work and context." },
  { icon: Cpu, title: "Business Memory", desc: "A persistent knowledge layer for teams and businesses." },
  { icon: Code, title: "Developer Tools", desc: "Build applications using Conch's memory and agent capabilities." },
  { icon: Lightbulb, title: "Creator AI", desc: "An AI that remembers your brand, voice, content strategy and audience." },
  { icon: Star, title: "Research Agent", desc: "A research assistant that retains knowledge across projects." },
];

function WhatToBuild() {
  return (
    <section id="what-to-build" className="py-20 md:py-32 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <ScrollReveal>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-[var(--conch-text)] mb-4">What You Can Build</h2>
            <p className="text-lg text-[var(--conch-text-muted)] max-w-xl mx-auto">These are just examples. We want to see what YOU build.</p>
          </div>
        </ScrollReveal>

        <StaggerReveal className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5" staggerDelay={0.08}>
          {buildCategories.map((cat) => {
            const Icon = cat.icon;
            return (
              <div key={cat.title} className="conch-glass rounded-2xl p-6 conch-card-hover">
                <Icon className="w-8 h-8 text-[var(--conch-purple-light)] mb-4" />
                <h3 className="text-lg font-semibold text-[var(--conch-text)] mb-2">{cat.title}</h3>
                <p className="text-sm text-[var(--conch-text-muted)] leading-relaxed">{cat.desc}</p>
              </div>
            );
          })}
        </StaggerReveal>
      </div>
    </section>
  );
}

/* ─── Prizes ─── */
function Prizes() {
  return (
    <section id="prizes" className="py-20 md:py-32 px-4 sm:px-6" style={{ background: "var(--conch-surface)" }}>
      <div className="max-w-4xl mx-auto">
        <ScrollReveal>
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-[var(--conch-text)] mb-4">$5,000 Creator Fund</h2>
          </div>
          <div className="text-center mb-12">
            <span className="text-6xl md:text-8xl font-bold conch-shimmer">$5,000</span>
          </div>
        </ScrollReveal>

        <StaggerReveal className="grid md:grid-cols-3 gap-6 mb-8" staggerDelay={0.12}>
          {[
            { medal: "🥇", label: "First Place", amount: "$2,500" },
            { medal: "🥈", label: "Second Place", amount: "$1,500" },
            { medal: "🥉", label: "Third Place", amount: "$1,000" },
          ].map((p) => (
            <div key={p.label} className="conch-glass rounded-2xl p-6 text-center conch-card-hover">
              <span className="text-4xl block mb-3">{p.medal}</span>
              <p className="text-xs text-[var(--conch-text-dim)] uppercase tracking-wider mb-1">{p.label}</p>
              <p className="text-3xl font-bold text-[var(--conch-text)]">{p.amount}</p>
            </div>
          ))}
        </StaggerReveal>

        <ScrollReveal delay={0.3}>
          <p className="text-center text-sm text-[var(--conch-text-dim)] max-w-xl mx-auto">
            Prize eligibility, judging, submission requirements, dates, and payment conditions are governed by the official challenge rules.
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
}

/* ─── Judging ─── */
const criteria = [
  { label: "Innovation", weight: 30, description: "How original and meaningful is the idea?" },
  { label: "Use of Persistent Memory", weight: 25, description: "How effectively does the project use Conch's memory capabilities?" },
  { label: "Agent / Technical Implementation", weight: 20, description: "How well does the project use Conch's agents, SDK/API or technical infrastructure?" },
  { label: "Usefulness / Impact", weight: 15, description: "Does the project solve a real problem?" },
  { label: "Presentation", weight: 10, description: "How clearly is the project demonstrated?" },
];

function Judging() {
  return (
    <section id="judging" className="py-20 md:py-32 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <ScrollReveal>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-[var(--conch-text)] mb-4">Judging Criteria</h2>
            <p className="text-lg text-[var(--conch-text-muted)]">Transparent scoring. Published criteria. Fair evaluation.</p>
          </div>
        </ScrollReveal>

        <div className="space-y-4">
          {criteria.map((c, i) => (
            <ScrollReveal key={c.label} delay={i * 0.08}>
              <div className="conch-glass rounded-xl p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex items-center gap-3 sm:w-56 shrink-0">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold text-[var(--conch-purple-light)]"
                    style={{ background: "rgba(124,58,237,0.12)" }}>
                    {c.weight}%
                  </div>
                  <h4 className="font-semibold text-[var(--conch-text)]">{c.label}</h4>
                </div>
                <div className="flex-1">
                  <div className="w-full h-2 rounded-full mb-2" style={{ background: "var(--conch-surface-3)" }}>
                    <div className="h-full rounded-full" style={{ width: `${c.weight}%`, background: "linear-gradient(90deg, #5b21b6, #7c3aed)" }} />
                  </div>
                  <p className="text-sm text-[var(--conch-text-muted)]">{c.description}</p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Timeline ─── */
interface TimelineDate {
  label: string;
  description: string;
  date: string | null;
  emoji: string;
}

const defaultTimeline: Omit<TimelineDate, "date">[] = [
  { label: "Challenge Opens", description: "Subscriptions and challenge registration begin.", emoji: "🚀" },
  { label: "Building Period", description: "Build your project using Conch's platform.", emoji: "🔨" },
  { label: "Submission Deadline", description: "All projects must be submitted by this date.", emoji: "📝" },
  { label: "Judging Period", description: "Judges evaluate submissions against published criteria.", emoji: "⚖️" },
  { label: "Winners Announced", description: "Top projects and winners are revealed.", emoji: "🏆" },
];

const dateKeyMap: Record<string, string> = {
  "Challenge Opens": "start",
  "Building Period": "start",
  "Submission Deadline": "submission",
  "Judging Period": "judging",
  "Winners Announced": "winnerAnnouncement",
};

function Timeline() {
  const [dates, setDates] = useState<Record<string, string | null>>({});

  useEffect(() => {
    fetch("/api/challenge/deadline")
      .then((res) => res.json())
      .then((data) => setDates(data.dates || {}))
      .catch(() => {});
  }, []);

  const events: TimelineDate[] = defaultTimeline.map((e) => ({
    ...e,
    date: dates[dateKeyMap[e.label]] || null,
  }));

  return (
    <section id="timeline" className="py-20 md:py-32 px-4 sm:px-6" style={{ background: "var(--conch-surface)" }}>
      <div className="max-w-3xl mx-auto">
        <ScrollReveal>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-[var(--conch-text)] mb-4">Challenge Timeline</h2>
            <p className="text-[var(--conch-text-muted)]">
              {Object.values(dates).some(Boolean)
                ? "Key dates for the Conch Creator Challenge."
                : "Dates will be announced when the challenge officially opens."}
            </p>
          </div>
        </ScrollReveal>

        <div className="relative">
          <div className="absolute left-6 md:left-8 top-0 bottom-0 w-px" style={{ background: "var(--conch-border)" }} />
          <div className="space-y-8">
            {events.map((event, i) => (
              <ScrollReveal key={i} delay={i * 0.1}>
                <div className="flex gap-4 md:gap-6 relative">
                  <div className="w-12 md:w-16 shrink-0 flex items-start justify-center">
                    <div className="w-3 h-3 rounded-full mt-1.5 border-2 border-[var(--conch-purple)]"
                      style={{ background: event.date ? "#7c3aed" : "var(--conch-surface)" }} />
                  </div>
                  <div className="conch-glass rounded-xl p-5 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm">{event.emoji}</span>
                      <span className="text-xs text-[var(--conch-text-dim)] font-mono tracking-wider uppercase">
                        {event.date
                          ? new Date(event.date).toLocaleDateString("en-US", {
                              month: "long",
                              day: "numeric",
                              year: "numeric",
                            })
                          : "TBD"}
                      </span>
                    </div>
                    <h4 className="font-semibold text-[var(--conch-text)] mb-1">{event.label}</h4>
                    <p className="text-sm text-[var(--conch-text-muted)]">{event.description}</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>

        {/* Countdown in timeline section */}
        <ScrollReveal delay={0.5}>
          <div className="mt-12">
            <ChallengeCountdown size="sm" showPhase={false} showAllDates />
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

/* ─── FAQ ─── */
const faqs = [
  { q: "Do I need to be a developer?", a: "No. The challenge is open to developers, creators, founders, students, and anyone who wants to build with Conch's platform. What matters is the idea and execution." },
  { q: "Is the subscription an entry fee?", a: "No. The subscription provides genuine access to the Conch platform. It is not an entry fee for a chance to win money. You get full access to Conch's persistent memory, agents, and tools." },
  { q: "Can I work in a team?", a: "Yes. You can include team members in your submission. Individual prizes are awarded to the primary submitter." },
  { q: "What do I need to submit?", a: "Project name, description, demo URL, screenshots/video, documentation of how Conch was used, and optionally your GitHub repository." },
  { q: "How are winners selected?", a: "Projects are evaluated against published judging criteria: Innovation (30%), Persistent Memory Use (25%), Agent/Technical Implementation (20%), Usefulness/Impact (15%), and Presentation (10%)." },
  { q: "When will the challenge open?", a: "Applications are opening soon. Join the waitlist to be notified." },
];

function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="py-20 md:py-32 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        <ScrollReveal>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-[var(--conch-text)] mb-4">Frequently Asked Questions</h2>
          </div>
        </ScrollReveal>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <ScrollReveal key={i} delay={i * 0.05}>
              <div className="conch-glass rounded-xl overflow-hidden">
                <button onClick={() => setOpenIndex(openIndex === i ? null : i)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left conch-btn-press">
                  <span className="font-medium text-[var(--conch-text)] pr-4">{faq.q}</span>
                  {openIndex === i ? (
                    <ChevronUp className="w-5 h-5 text-[var(--conch-text-muted)] shrink-0 transition-transform duration-200" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-[var(--conch-text-muted)] shrink-0 transition-transform duration-200" />
                  )}
                </button>
                <div className="overflow-hidden transition-all duration-300"
                  style={{ maxHeight: openIndex === i ? "200px" : "0" }}>
                  <div className="px-6 pb-4">
                    <p className="text-sm text-[var(--conch-text-muted)] leading-relaxed">{faq.a}</p>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Join CTA ─── */
function JoinCTA({ onJoinClick }: { onJoinClick: () => void }) {
  return (
    <section id="join" className="py-20 md:py-32 px-4 sm:px-6" style={{ background: "var(--conch-surface)" }}>
      <ScrollReveal>
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-[var(--conch-text)] mb-4">Ready to Build?</h2>
          <p className="text-lg text-[var(--conch-text-muted)] mb-8">
            Join the Conch Creator Challenge and show the world what becomes possible when AI can remember.
          </p>
          <button onClick={onJoinClick}
            className="px-10 py-4 rounded-xl font-bold text-white text-lg transition-all hover:opacity-90 conch-glow conch-btn-press inline-flex items-center gap-2"
            style={{ background: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 50%, #5b21b6 100%)" }}>
            Join the Challenge
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </ScrollReveal>
    </section>
  );
}

/* ─── Featured Builds (Placeholder) ─── */
const demoProjects = [
  { name: "MemoryBank", creator: "Demo Builder", desc: "A personal knowledge management tool powered by Conch's persistent memory.", features: ["Memory", "Agents"] },
  { name: "AgentFlow", creator: "Demo Builder", desc: "Visual workflow builder for AI agents with persistent context.", features: ["Memory", "API"] },
  { name: "ContextAI", creator: "Demo Builder", desc: "Enterprise knowledge base that learns and evolves with your team.", features: ["Memory", "Agents", "Knowledge"] },
];

function FeaturedBuilds() {
  return (
    <section className="py-20 md:py-32 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <ScrollReveal>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-[var(--conch-text)] mb-4">Featured Builds</h2>
            <p className="text-[var(--conch-text-muted)]">Examples of what builders can create with Conch.</p>
          </div>
        </ScrollReveal>

        <StaggerReveal className="grid md:grid-cols-3 gap-6" staggerDelay={0.1}>
          {demoProjects.map((p) => (
            <div key={p.name} className="conch-glass rounded-2xl overflow-hidden conch-card-hover">
              <div className="h-40 flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.15), rgba(124,58,237,0.03))" }}>
                <span className="text-xs text-[var(--conch-text-dim)] uppercase tracking-widest border border-dashed border-[var(--conch-border)] px-3 py-1 rounded">
                  DEMO PROJECT
                </span>
              </div>
              <div className="p-5">
                <h3 className="font-semibold text-[var(--conch-text)] mb-1">{p.name}</h3>
                <p className="text-xs text-[var(--conch-text-dim)] mb-3">by {p.creator}</p>
                <p className="text-sm text-[var(--conch-text-muted)] mb-3 leading-relaxed">{p.desc}</p>
                <div className="flex gap-2">
                  {p.features.map((f) => (
                    <span key={f} className="text-[10px] px-2 py-0.5 rounded-full border border-[var(--conch-border)] text-[var(--conch-purple-light)]">
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </StaggerReveal>
      </div>
    </section>
  );
}

/* ─── Main Page Component ─── */
export function ChallengePageClient() {
  const [showSignup, setShowSignup] = useState(false);

  return (
    <div className="conch-gradient-bg min-h-screen">
      <ChallengeNav onJoinClick={() => setShowSignup(true)} />
      <ChallengeHero onJoinClick={() => setShowSignup(true)} />
      <HowItWorks />
      <WhatToBuild />
      <FeaturedBuilds />
      <PublishedWinners />
      <Prizes />
      <Judging />
      <Timeline />
      <FAQ />
      <JoinCTA onJoinClick={() => setShowSignup(true)} />
      <ChallengeFooter />

      {showSignup && <WaitlistSignup onClose={() => setShowSignup(false)} />}

      <div className="conch-mobile-cta md:hidden">
        <button onClick={() => setShowSignup(true)}
          className="w-full py-3 px-6 rounded-xl font-semibold text-white text-sm transition-all conch-btn-press"
          style={{ background: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 50%, #5b21b6 100%)" }}>
          Join the Challenge
        </button>
      </div>
    </div>
  );
}
