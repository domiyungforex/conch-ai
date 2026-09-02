"use client";

import { ChallengeCountdown } from "./challenge-countdown";

interface WaitlistHeroProps {
  onJoinClick: () => void;
}

export function WaitlistHero({ onJoinClick }: WaitlistHeroProps) {
  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-32 px-4 sm:px-6 overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full opacity-30 blur-[120px] pointer-events-none"
        style={{ background: "radial-gradient(circle, #7c3aed 0%, transparent 70%)" }} />

      <div className="max-w-4xl mx-auto text-center relative z-10">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[var(--conch-border)] mb-8"
          style={{ background: "rgba(124, 58, 237, 0.08)" }}>
          <div className="w-2 h-2 rounded-full bg-[#7c3aed] animate-pulse" />
          <span className="text-xs font-medium text-[var(--conch-purple-light)] uppercase tracking-wider">
            Applications Opening Soon
          </span>
        </div>

        {/* Main headline */}
        <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight leading-[1.1] mb-6">
          <span className="block text-[var(--conch-text)]">AI CAN GENERATE.</span>
          <span className="block text-[var(--conch-text)]">AI CAN REASON.</span>
          <span className="block mt-2" style={{
            background: "linear-gradient(135deg, #a78bfa 0%, #7c3aed 40%, #c084fc 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}>
            BUT CAN IT REMEMBER?
          </span>
        </h1>

        {/* Subheadline */}
        <p className="text-lg md:text-xl text-[var(--conch-text-muted)] max-w-2xl mx-auto mb-6 leading-relaxed">
          Conch is building an AI with persistent memory, intelligent agents,
          and continuous context. We&apos;re challenging builders everywhere to discover
          what becomes possible when AI doesn&apos;t start from zero every time.
        </p>

        {/* Prize callout */}
        <div className="mb-6">
          <p className="text-2xl md:text-3xl font-bold text-[var(--conch-text)] mb-2">
            $5,000 Creator Challenge
          </p>
        </div>

        {/* Countdown */}
        <div className="mb-8">
          <ChallengeCountdown size="sm" />
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={onJoinClick}
            className="px-8 py-4 rounded-xl font-bold text-white text-lg transition-all hover:opacity-90 conch-glow conch-btn-press"
            style={{
              background: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 50%, #5b21b6 100%)",
            }}
          >
            Join the Waitlist
          </button>
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-8 py-4 rounded-xl font-semibold text-[var(--conch-text)] text-lg border border-[var(--conch-border)] hover:border-[var(--conch-border-hover)] transition-all conch-card-hover"
            style={{ background: "rgba(124, 58, 237, 0.05)" }}
          >
            Explore Conch
          </a>
        </div>
      </div>
    </section>
  );
}
