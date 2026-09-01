"use client";

import { useEffect, useState } from "react";
import { CountdownTimer } from "./countdown-timer";
import { Timer, Calendar } from "lucide-react";

interface DeadlineData {
  deadline: string | null;
  deadlineLabel: string;
  phase: string | null;
  dates: {
    start: string | null;
    end: string | null;
    submission: string | null;
    judging: string | null;
    winnerAnnouncement: string | null;
  } | null;
}

interface ChallengeCountdownProps {
  size?: "sm" | "md" | "lg";
  showPhase?: boolean;
  showAllDates?: boolean;
  className?: string;
}

export function ChallengeCountdown({
  size = "md",
  showPhase = true,
  showAllDates = false,
  className = "",
}: ChallengeCountdownProps) {
  const [data, setData] = useState<DeadlineData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/challenge/deadline")
      .then((res) => res.json())
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className={`text-center ${className}`}>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg conch-skeleton h-10 w-48" />
      </div>
    );
  }

  const phaseLabels: Record<string, string> = {
    upcoming: "Coming Soon",
    open: "Registration Open",
    building: "Building Phase",
    submission: "Submission Open",
    judging: "Under Judgement",
    completed: "Completed",
  };

  return (
    <div className={className}>
      {/* Phase badge */}
      {showPhase && data?.phase && (
        <div className="text-center mb-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
            style={{
              background: data.phase === "completed"
                ? "rgba(34, 197, 94, 0.1)"
                : "rgba(124, 58, 237, 0.1)",
              border: `1px solid ${data.phase === "completed" ? "rgba(34, 197, 94, 0.2)" : "var(--conch-border)"}`,
              color: data.phase === "completed" ? "#4ade80" : "var(--conch-purple-light)",
            }}>
            <div className={`w-1.5 h-1.5 rounded-full ${data.phase === "completed" ? "bg-green-400" : "bg-[var(--conch-purple)]"} animate-pulse`} />
            {phaseLabels[data.phase] || data.phase}
          </div>
        </div>
      )}

      {/* Countdown */}
      <CountdownTimer
        deadline={data?.deadline || null}
        label={data?.deadlineLabel || "Challenge Deadline"}
        size={size}
      />

      {/* All dates */}
      {showAllDates && data?.dates && (
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl mx-auto">
          {[
            { label: "Start", date: data.dates.start, icon: "🚀" },
            { label: "Submission", date: data.dates.submission, icon: "📝" },
            { label: "Judging", date: data.dates.judging, icon: "⚖️" },
            { label: "Winners", date: data.dates.winnerAnnouncement, icon: "🏆" },
          ]
            .filter((d) => d.date)
            .map((d) => (
              <div key={d.label} className="conch-glass rounded-lg p-3 text-center">
                <span className="text-lg block mb-1">{d.icon}</span>
                <span className="text-[10px] text-[var(--conch-text-dim)] uppercase tracking-wider block mb-0.5">
                  {d.label}
                </span>
                <span className="text-xs font-medium text-[var(--conch-text)]">
                  {d.date
                    ? new Date(d.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "TBD"}
                </span>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
