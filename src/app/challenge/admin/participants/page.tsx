"use client";

import { useEffect, useState } from "react";

interface Participant {
  id: string;
  fullName: string;
  email: string;
  twitterHandle: string | null;
  role: string;
  country: string | null;
  joinedAt: string;
  referralCode: string | null;
}

export default function AdminParticipantsPage() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/challenge/admin/participants")
      .then((res) => res.json())
      .then((data) => setParticipants(data.participants || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-[var(--conch-text)] mb-8">Challenge Participants</h1>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-[var(--conch-purple)] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : participants.length === 0 ? (
        <div className="conch-glass rounded-xl p-12 text-center">
          <p className="text-[var(--conch-text-muted)]">No participants yet.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--conch-border)]">
                <th className="text-left py-3 px-4 text-xs text-[var(--conch-text-dim)] uppercase tracking-wider font-medium">Name</th>
                <th className="text-left py-3 px-4 text-xs text-[var(--conch-text-dim)] uppercase tracking-wider font-medium">Email</th>
                <th className="text-left py-3 px-4 text-xs text-[var(--conch-text-dim)] uppercase tracking-wider font-medium">Role</th>
                <th className="text-left py-3 px-4 text-xs text-[var(--conch-text-dim)] uppercase tracking-wider font-medium">Country</th>
                <th className="text-left py-3 px-4 text-xs text-[var(--conch-text-dim)] uppercase tracking-wider font-medium">Joined</th>
              </tr>
            </thead>
            <tbody>
              {participants.map((p) => (
                <tr key={p.id} className="border-b border-[var(--conch-border)] hover:bg-white/[0.02]">
                  <td className="py-3 px-4 text-[var(--conch-text)] font-medium">{p.fullName}</td>
                  <td className="py-3 px-4 text-[var(--conch-text-muted)]">{p.email}</td>
                  <td className="py-3 px-4 text-[var(--conch-text-muted)] capitalize">{p.role}</td>
                  <td className="py-3 px-4 text-[var(--conch-text-muted)]">{p.country || "—"}</td>
                  <td className="py-3 px-4 text-[var(--conch-text-dim)]">{new Date(p.joinedAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
