"use client";

import { useEffect, useState } from "react";
import { Users, FolderOpen, FileCheck, Clock } from "lucide-react";

interface Stats {
  participants: number;
  projects: number;
  submissions: number;
  waitlist: number;
  challenge: {
    phase: string;
    submissionDeadline: string | null;
  } | null;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/challenge/stats")
      .then((res) => res.json())
      .then((data) => setStats(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const cards = [
    {
      label: "Waitlist Signups",
      value: stats?.waitlist ?? 0,
      icon: Users,
      color: "#7c3aed",
    },
    {
      label: "Challenge Participants",
      value: stats?.participants ?? 0,
      icon: Users,
      color: "#8b5cf6",
    },
    {
      label: "Projects Created",
      value: stats?.projects ?? 0,
      icon: FolderOpen,
      color: "#a78bfa",
    },
    {
      label: "Submissions",
      value: stats?.submissions ?? 0,
      icon: FileCheck,
      color: "#c084fc",
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-[var(--conch-text)] mb-8">Dashboard</h1>

      {/* Stats cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="conch-glass rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-[var(--conch-text-dim)] uppercase tracking-wider">
                  {card.label}
                </span>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: `${card.color}22` }}>
                  <Icon className="w-4 h-4" style={{ color: card.color }} />
                </div>
              </div>
              <p className="text-3xl font-bold text-[var(--conch-text)]">
                {loading ? "—" : card.value.toLocaleString()}
              </p>
            </div>
          );
        })}
      </div>

      {/* Challenge status */}
      <div className="conch-glass rounded-xl p-6">
        <h2 className="text-lg font-semibold text-[var(--conch-text)] mb-4">Challenge Status</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <span className="text-xs text-[var(--conch-text-dim)] uppercase tracking-wider">Phase</span>
            <p className="text-lg font-semibold text-[var(--conch-text)] capitalize mt-1">
              {stats?.challenge?.phase ?? "Not configured"}
            </p>
          </div>
          <div>
            <span className="text-xs text-[var(--conch-text-dim)] uppercase tracking-wider">Deadline</span>
            <p className="text-lg font-semibold text-[var(--conch-text)] mt-1">
              {stats?.challenge?.submissionDeadline
                ? new Date(stats.challenge.submissionDeadline).toLocaleDateString()
                : "Not set"}
            </p>
          </div>
          <div>
            <span className="text-xs text-[var(--conch-text-dim)] uppercase tracking-wider">Prize Fund</span>
            <p className="text-lg font-semibold text-[var(--conch-text)] mt-1">$5,000</p>
          </div>
        </div>
      </div>

      {/* Recent events placeholder */}
      <div className="conch-glass rounded-xl p-6 mt-6">
        <h2 className="text-lg font-semibold text-[var(--conch-text)] mb-4">Recent Activity</h2>
        <p className="text-sm text-[var(--conch-text-dim)]">
          Activity events will appear here as users join, submit projects, and interact with the challenge.
        </p>
      </div>
    </div>
  );
}
