"use client";

import { useEffect, useState } from "react";

interface Project {
  id: string;
  name: string;
  slug: string;
  status: string;
  featured: boolean;
  createdAt: string;
}

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/challenge/projects")
      .then((res) => res.json())
      .then((data) => setProjects(data.projects || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-[var(--conch-text)] mb-8">Projects</h1>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-[var(--conch-purple)] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : projects.length === 0 ? (
        <div className="conch-glass rounded-xl p-12 text-center">
          <p className="text-[var(--conch-text-muted)]">No projects yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {projects.map((p) => (
            <div key={p.id} className="conch-glass rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold text-[var(--conch-purple-light)]"
                  style={{ background: "rgba(124,58,237,0.12)" }}>
                  {p.name.charAt(0)}
                </div>
                <div>
                  <a href={`/challenge/projects/${p.slug}`} target="_blank" rel="noopener noreferrer"
                    className="font-medium text-[var(--conch-text)] hover:text-[var(--conch-purple-light)] transition-colors">
                    {p.name}
                  </a>
                  <p className="text-xs text-[var(--conch-text-dim)]">
                    Created {new Date(p.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs px-2 py-1 rounded-full border border-[var(--conch-border)] text-[var(--conch-text-dim)] capitalize">
                  {p.status}
                </span>
                <button
                  className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                    p.featured
                      ? "border-[var(--conch-purple)] text-[var(--conch-purple-light)] bg-[var(--conch-purple)]/10"
                      : "border-[var(--conch-border)] text-[var(--conch-text-dim)] hover:border-[var(--conch-border-hover)]"
                  }`}
                >
                  {p.featured ? "★ Featured" : "Feature"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
