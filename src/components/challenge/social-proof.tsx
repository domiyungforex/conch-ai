"use client";

import { useEffect, useState } from "react";

interface WaitlistStats {
  totalSignups: number;
}

export function SocialProof() {
  const [stats, setStats] = useState<WaitlistStats | null>(null);

  useEffect(() => {
    fetch("/api/challenge/waitlist")
      .then((res) => res.json())
      .then((data) => {
        if (data.totalSignups !== undefined) {
          setStats(data);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <section className="py-20 md:py-32 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto text-center">
        <p className="text-lg text-[var(--conch-text-muted)] mb-8">
          Builders joining from around the world.
        </p>

        {stats && stats.totalSignups > 0 ? (
          <div className="grid grid-cols-3 gap-8 max-w-lg mx-auto">
            <div>
              <span className="text-3xl md:text-4xl font-bold text-[var(--conch-text)]">
                {stats.totalSignups}
              </span>
              <p className="text-xs text-[var(--conch-text-muted)] mt-1 uppercase tracking-wider">
                Builders
              </p>
            </div>
            <div>
              <span className="text-3xl md:text-4xl font-bold text-[var(--conch-text)]">
                —
              </span>
              <p className="text-xs text-[var(--conch-text-muted)] mt-1 uppercase tracking-wider">
                Countries
              </p>
            </div>
            <div>
              <span className="text-3xl md:text-4xl font-bold text-[var(--conch-text)]">
                —
              </span>
              <p className="text-xs text-[var(--conch-text-muted)] mt-1 uppercase tracking-wider">
                Ideas Submitted
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-[var(--conch-text-dim)]">
            Be among the first builders to join.
          </p>
        )}
      </div>
    </section>
  );
}
