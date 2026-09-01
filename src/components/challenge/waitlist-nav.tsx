"use client";

import Link from "next/link";

interface WaitlistNavProps {
  onJoinClick: () => void;
}

export function WaitlistNav({ onJoinClick }: WaitlistNavProps) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[var(--conch-border)]"
      style={{ background: "rgba(5, 5, 8, 0.8)", backdropFilter: "blur(20px)" }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/challenge" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #7c3aed, #a78bfa)" }}>
            <span className="text-white text-sm font-bold">C</span>
          </div>
          <span className="text-[var(--conch-text)] font-semibold tracking-tight text-lg">
            Conch
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-6 text-sm text-[var(--conch-text-muted)]">
          <Link href="/challenge" className="hover:text-[var(--conch-text)] transition-colors">
            Challenge
          </Link>
          <Link href="/challenge/waitlist" className="text-[var(--conch-purple-light)] font-medium">
            Waitlist
          </Link>
          <a href="https://conch.ai" target="_blank" rel="noopener noreferrer"
            className="hover:text-[var(--conch-text)] transition-colors">
            Product
          </a>
        </div>

        <button onClick={onJoinClick}
          className="px-5 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90"
          style={{
            background: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)",
          }}>
          Join Waitlist
        </button>
      </div>
    </nav>
  );
}
