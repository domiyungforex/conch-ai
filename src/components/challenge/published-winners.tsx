"use client";

import { useEffect, useState } from "react";
import { Trophy, ExternalLink } from "lucide-react";
import { ScrollReveal, StaggerReveal } from "@/hooks/use-scroll-reveal";
import Link from "next/link";

interface PublishedWinner {
  id: string;
  placement: number;
  prizeAmount: number;
  publishedAt: string;
  projectName: string;
  projectSlug: string;
  projectOneLiner: string | null;
  participantName: string;
  participantTwitter: string | null;
}

const placementConfig: Record<number, { medal: string; label: string; color: string }> = {
  1: { medal: "🥇", label: "First Place", color: "#ffd700" },
  2: { medal: "🥈", label: "Second Place", color: "#c0c0c0" },
  3: { medal: "🥉", label: "Third Place", color: "#cd7f32" },
};

export function PublishedWinners() {
  const [winners, setWinners] = useState<PublishedWinner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/challenge/winners")
      .then((res) => res.json())
      .then((data) => setWinners(data.winners || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading || winners.length === 0) return null;

  return (
    <section className="py-20 md:py-32 px-4 sm:px-6" style={{ background: "var(--conch-surface)" }}>
      <div className="max-w-4xl mx-auto">
        <ScrollReveal>
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-yellow-400/20 mb-6"
              style={{ background: "rgba(255, 215, 0, 0.05)" }}>
              <Trophy className="w-4 h-4 text-yellow-400" />
              <span className="text-xs font-medium text-yellow-400 uppercase tracking-wider">
                Challenge Winners
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-[var(--conch-text)] mb-4">
              And the Winners Are...
            </h2>
          </div>
        </ScrollReveal>

        <StaggerReveal className="space-y-4" staggerDelay={0.15}>
          {winners.map((winner) => {
            const config = placementConfig[winner.placement] || placementConfig[1];
            return (
              <div
                key={winner.id}
                className="conch-glass rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4"
              >
                {/* Medal + Placement */}
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-4xl">{config.medal}</span>
                  <div>
                    <p className="text-xs text-[var(--conch-text-dim)] uppercase tracking-wider">
                      {config.label}
                    </p>
                    <p className="text-lg font-bold" style={{ color: config.color }}>
                      ${winner.prizeAmount.toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Divider */}
                <div className="hidden sm:block w-px h-12" style={{ background: "var(--conch-border)" }} />

                {/* Project + Creator */}
                <div className="flex-1 min-w-0">
                  <Link href={`/challenge/projects/${winner.projectSlug}`}
                    className="text-lg font-semibold text-[var(--conch-text)] hover:text-[var(--conch-purple-light)] transition-colors flex items-center gap-2">
                    {winner.projectName}
                    <ExternalLink className="w-4 h-4 opacity-50" />
                  </Link>
                  {winner.projectOneLiner && (
                    <p className="text-sm text-[var(--conch-text-muted)] mt-0.5">{winner.projectOneLiner}</p>
                  )}
                  <p className="text-xs text-[var(--conch-text-dim)] mt-1">
                    by {winner.participantName}
                    {winner.participantTwitter && (
                      <> · @{winner.participantTwitter}</>
                    )}
                  </p>
                </div>
              </div>
            );
          })}
        </StaggerReveal>
      </div>
    </section>
  );
}
