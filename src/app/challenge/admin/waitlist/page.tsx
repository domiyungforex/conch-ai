"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";

interface Signup {
  id: string;
  fullName: string;
  email: string;
  twitterHandle: string | null;
  discordUsername: string | null;
  role: string;
  buildIdea: string | null;
  country: string | null;
  referralCode: string | null;
  createdAt: string;
}

export default function AdminWaitlistPage() {
  const [signups, setSignups] = useState<Signup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/challenge/admin/waitlist")
      .then((res) => res.json())
      .then((data) => setSignups(data.signups || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const exportCSV = () => {
    const headers = ["Name", "Email", "Twitter", "Discord", "Role", "Country", "Build Idea", "Referral Code", "Joined"];
    const rows = signups.map((s) => [
      s.fullName, s.email, s.twitterHandle || "", s.discordUsername || "",
      s.role, s.country || "", s.buildIdea || "", s.referralCode || "",
      new Date(s.createdAt).toISOString(),
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "waitlist-signups.csv";
    a.click();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-[var(--conch-text)]">Waitlist Signups</h1>
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-[var(--conch-border)] text-[var(--conch-text)] hover:border-[var(--conch-border-hover)] transition-colors"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-[var(--conch-purple)] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : signups.length === 0 ? (
        <div className="conch-glass rounded-xl p-12 text-center">
          <p className="text-[var(--conch-text-muted)]">No waitlist signups yet.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--conch-border)]">
                <th className="text-left py-3 px-4 text-xs text-[var(--conch-text-dim)] uppercase tracking-wider font-medium">Name</th>
                <th className="text-left py-3 px-4 text-xs text-[var(--conch-text-dim)] uppercase tracking-wider font-medium">Email</th>
                <th className="text-left py-3 px-4 text-xs text-[var(--conch-text-dim)] uppercase tracking-wider font-medium">Twitter</th>
                <th className="text-left py-3 px-4 text-xs text-[var(--conch-text-dim)] uppercase tracking-wider font-medium">Role</th>
                <th className="text-left py-3 px-4 text-xs text-[var(--conch-text-dim)] uppercase tracking-wider font-medium">Country</th>
                <th className="text-left py-3 px-4 text-xs text-[var(--conch-text-dim)] uppercase tracking-wider font-medium">Joined</th>
              </tr>
            </thead>
            <tbody>
              {signups.map((s) => (
                <tr key={s.id} className="border-b border-[var(--conch-border)] hover:bg-white/[0.02]">
                  <td className="py-3 px-4 text-[var(--conch-text)] font-medium">{s.fullName}</td>
                  <td className="py-3 px-4 text-[var(--conch-text-muted)]">{s.email}</td>
                  <td className="py-3 px-4 text-[var(--conch-text-muted)]">{s.twitterHandle || "—"}</td>
                  <td className="py-3 px-4 text-[var(--conch-text-muted)] capitalize">{s.role}</td>
                  <td className="py-3 px-4 text-[var(--conch-text-muted)]">{s.country || "—"}</td>
                  <td className="py-3 px-4 text-[var(--conch-text-dim)]">{new Date(s.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
