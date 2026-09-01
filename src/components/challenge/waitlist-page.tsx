"use client";

import { useState } from "react";
import { WaitlistHero } from "./waitlist-hero";
import { MemoryVisual } from "./memory-visual";
import { ProblemSection } from "./problem-section";
import { BuildIdeas } from "./build-ideas";
import { PrizeSection } from "./prize-section";
import { WaitlistSignup } from "./waitlist-signup";
import { SocialProof } from "./social-proof";
import { ChallengeFooter } from "./challenge-footer";
import { WaitlistNav } from "./waitlist-nav";

export function WaitlistPage() {
  const [showSignup, setShowSignup] = useState(false);

  return (
    <div className="conch-gradient-bg min-h-screen">
      <WaitlistNav onJoinClick={() => setShowSignup(true)} />
      <WaitlistHero onJoinClick={() => setShowSignup(true)} />
      <MemoryVisual />
      <ProblemSection />
      <BuildIdeas />
      <PrizeSection />
      <SocialProof />
      <ChallengeFooter />

      {showSignup && (
        <WaitlistSignup onClose={() => setShowSignup(false)} />
      )}

      {/* Mobile sticky CTA */}
      <div className="conch-mobile-cta md:hidden">
        <button
          onClick={() => setShowSignup(true)}
          className="w-full py-3 px-6 rounded-xl font-semibold text-white text-sm transition-all"
          style={{
            background:
              "linear-gradient(135deg, #7c3aed 0%, #6d28d9 50%, #5b21b6 100%)",
          }}
        >
          Join the Waitlist
        </button>
      </div>
    </div>
  );
}
