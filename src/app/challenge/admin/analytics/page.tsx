"use client";

import { useEffect, useState } from "react";
import { Users, FolderOpen, FileCheck, Eye, TrendingUp } from "lucide-react";

interface Stats {
  participants: number;
  projects: number;
  submissions: number;
  waitlist: number;
}

export default function AdminAnalyticsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/challenge/stats")
      .then((res) => res.json())
      .then((data) => setStats(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const metrics = [
    { label: "Waitlist Conversions", value: stats?.waitlist ?? 0, sublabel: "Email signups", icon: Users },
    { label: "Challenge Registrations", value: stats?.participants ?? 0, sublabel: "Joined challenge", icon: Users },
    { label: "Projects Started", value: stats?.projects ?? 0, sublabel: "Created projects", icon: FolderOpen },
    { label: "Completed Submissions", value: stats?.submissions ?? 0, sublabel: "Final submissions", icon: FileCheck },
  ];

  const conversionRate = stats && stats.waitlist > 0
    ? ((stats.participants / stats.waitlist) * 100).toFixed(1)
    : "—";

  const submissionRate = stats && stats.participants > 0
    ? ((stats.submissions / stats.participants) * 100).toFixed(1)
    : "—";

  return (
    <div>
      <h1 className="text-2xl font-bold text-[var(--conch-text)] mb-8">Analytics</h1>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-[var(--conch-purple)] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Key metrics */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {metrics.map((m) => {
              const Icon = m.icon;
              return (
                <div key={m.label} className="conch-glass rounded-xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-[var(--conch-text-dim)] uppercase tracking-wider">{m.label}</span>
                    <Icon className="w-4 h-4 text-[var(--conch-purple-light)]" />
                  </div>
                  <p className="text-3xl font-bold text-[var(--conch-text)]">
                    {m.value.toLocaleString()}
                  </p>
                  <p className="text-xs text-[var(--conch-text-dim)] mt-1">{m.sublabel}</p>
                </div>
              );
            })}
          </div>

          {/* Conversion funnel */}
          <div className="conch-glass rounded-xl p-6 mb-6">
            <h2 className="text-lg font-semibold text-[var(--conch-text)] mb-4">Conversion Funnel</h2>
            <div className="space-y-4">
              {[
                { label: "Waitlist → Challenge", value: conversionRate, count: `${stats?.participants ?? 0} / ${stats?.waitlist ?? 0}` },
                { label: "Challenge → Project", value: submissionRate, count: `${stats?.submissions ?? 0} / ${stats?.participants ?? 0}` },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm text-[var(--conch-text)]">{item.label}</span>
                      <span className="text-sm font-medium text-[var(--conch-purple-light)]">{item.value}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full" style={{ background: "var(--conch-surface-3)" }}>
                      <div className="h-full rounded-full transition-all"
                        style={{
                          width: item.value !== "—" ? `${Math.min(parseFloat(item.value), 100)}%` : "0%",
                          background: "linear-gradient(90deg, #5b21b6, #7c3aed)",
                        }} />
                    </div>
                    <p className="text-xs text-[var(--conch-text-dim)] mt-1">{item.count}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tracking info */}
          <div className="conch-glass rounded-xl p-6">
            <h2 className="text-lg font-semibold text-[var(--conch-text)] mb-4">Tracked Events</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                "Landing page views",
                "Waitlist conversions",
                "Signup source",
                "X referrals",
                "Referral conversions",
                "Challenge registrations",
                "Subscription conversions",
                "Project starts",
                "Draft submissions",
                "Completed submissions",
                "Feature usage",
                "Project shares",
              ].map((event) => (
                <div key={event} className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: "var(--conch-surface-2)" }}>
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--conch-purple)]" />
                  <span className="text-xs text-[var(--conch-text-muted)]">{event}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
