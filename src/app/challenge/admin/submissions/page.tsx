"use client";

import { useEffect, useState } from "react";

interface Submission {
  id: string;
  status: string;
  submittedAt: string | null;
  createdAt: string;
  projectName: string;
  projectSlug: string;
}

export default function AdminSubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/challenge/submissions")
      .then((res) => res.json())
      .then((data) => setSubmissions(data.submissions || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const statusColors: Record<string, string> = {
    draft: "text-yellow-400 border-yellow-400/30",
    submitted: "text-blue-400 border-blue-400/30",
    reviewing: "text-purple-400 border-purple-400/30",
    approved: "text-green-400 border-green-400/30",
    rejected: "text-red-400 border-red-400/30",
    locked: "text-gray-400 border-gray-400/30",
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-[var(--conch-text)] mb-8">Submissions</h1>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-[var(--conch-purple)] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : submissions.length === 0 ? (
        <div className="conch-glass rounded-xl p-12 text-center">
          <p className="text-[var(--conch-text-muted)]">No submissions yet.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--conch-border)]">
                <th className="text-left py-3 px-4 text-xs text-[var(--conch-text-dim)] uppercase tracking-wider font-medium">Project</th>
                <th className="text-left py-3 px-4 text-xs text-[var(--conch-text-dim)] uppercase tracking-wider font-medium">Status</th>
                <th className="text-left py-3 px-4 text-xs text-[var(--conch-text-dim)] uppercase tracking-wider font-medium">Submitted</th>
                <th className="text-left py-3 px-4 text-xs text-[var(--conch-text-dim)] uppercase tracking-wider font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((s) => (
                <tr key={s.id} className="border-b border-[var(--conch-border)] hover:bg-white/[0.02]">
                  <td className="py-3 px-4">
                    <a href={`/challenge/projects/${s.projectSlug}`} target="_blank" rel="noopener noreferrer"
                      className="text-[var(--conch-text)] font-medium hover:text-[var(--conch-purple-light)] transition-colors">
                      {s.projectName}
                    </a>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-xs px-2 py-1 rounded-full border capitalize ${statusColors[s.status] || "text-gray-400 border-gray-400/30"}`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-[var(--conch-text-dim)]">
                    {s.submittedAt ? new Date(s.submittedAt).toLocaleDateString() : "—"}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <button className="text-xs px-3 py-1 rounded border border-green-400/30 text-green-400 hover:bg-green-400/10 transition-colors">
                        Approve
                      </button>
                      <button className="text-xs px-3 py-1 rounded border border-red-400/30 text-red-400 hover:bg-red-400/10 transition-colors">
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
