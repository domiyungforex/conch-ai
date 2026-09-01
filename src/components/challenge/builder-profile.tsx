"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Globe, ExternalLink, Share2 } from "lucide-react";

interface Participant {
  id: string;
  fullName: string;
  twitterHandle: string | null;
  country: string | null;
  role: string;
  joinedAt: string;
}

interface Project {
  id: string;
  name: string;
  slug: string;
  oneLiner: string | null;
  status: string;
  featured: boolean;
  conchFeaturesUsed: unknown;
  createdAt: string;
}

export function BuilderProfile({ username }: { username: string }) {
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // Search by referral code or username
    fetch(`/api/challenge/participants/${username}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then((data) => {
        setParticipant(data.participant);
        setProjects(data.projects || []);
      })
      .catch(() => setError("Builder not found"))
      .finally(() => setLoading(false));
  }, [username]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center conch-gradient-bg">
        <div className="w-8 h-8 border-2 border-[var(--conch-purple)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !participant) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center conch-gradient-bg px-4">
        <p className="text-xl text-[var(--conch-text)] mb-4">Builder not found</p>
        <Link href="/challenge" className="text-[var(--conch-purple-light)] hover:underline">
          Back to Challenge
        </Link>
      </div>
    );
  }

  return (
    <div className="conch-gradient-bg min-h-screen">
      {/* Nav */}
      <div className="border-b border-[var(--conch-border)]"
        style={{ background: "rgba(5, 5, 8, 0.8)", backdropFilter: "blur(20px)" }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">
          <Link href="/challenge"
            className="flex items-center gap-2 text-[var(--conch-text-muted)] hover:text-[var(--conch-text)] transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" />
            Challenge
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 md:py-20">
        {/* Profile header */}
        <div className="flex flex-col sm:flex-row items-start gap-6 mb-12">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: "linear-gradient(135deg, #7c3aed, #a78bfa)" }}>
            <span className="text-white text-2xl font-bold">
              {participant.fullName.charAt(0)}
            </span>
          </div>
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold text-[var(--conch-text)] mb-1">
              {participant.fullName}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--conch-text-muted)] mb-4">
              <span className="flex items-center gap-1">
                <span className="text-xs px-2 py-0.5 rounded-full border border-[var(--conch-border)] text-[var(--conch-purple-light)] capitalize">
                  {participant.role}
                </span>
              </span>
              {participant.country && (
                <span className="flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5" />
                  {participant.country}
                </span>
              )}
              {participant.twitterHandle && (
                <a
                  href={`https://x.com/${participant.twitterHandle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-[var(--conch-purple-light)] transition-colors"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  @{participant.twitterHandle}
                </a>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400" />
              <span className="text-xs text-[var(--conch-text-dim)]">
                Conch Builder · Joined {new Date(participant.joinedAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Projects */}
        <section>
          <h2 className="text-xl font-bold text-[var(--conch-text)] mb-6">
            Projects ({projects.length})
          </h2>

          {projects.length === 0 ? (
            <div className="conch-glass rounded-2xl p-12 text-center">
              <p className="text-[var(--conch-text-muted)]">No projects yet.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-5">
              {projects.map((p) => {
                const features = Array.isArray(p.conchFeaturesUsed) ? (p.conchFeaturesUsed as string[]) : [];
                return (
                  <Link
                    key={p.id}
                    href={`/challenge/projects/${p.slug}`}
                    className="conch-glass rounded-2xl p-5 transition-all hover:scale-[1.02] duration-300"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-[var(--conch-text)]">{p.name}</h3>
                      {p.featured && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--conch-purple)] text-white font-medium">
                          Featured
                        </span>
                      )}
                    </div>
                    {p.oneLiner && (
                      <p className="text-sm text-[var(--conch-text-muted)] mb-3">{p.oneLiner}</p>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex gap-1.5">
                        {features.slice(0, 3).map((f) => (
                          <span key={f} className="text-[10px] px-2 py-0.5 rounded-full border border-[var(--conch-border)] text-[var(--conch-text-dim)]">
                            {f}
                          </span>
                        ))}
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-[var(--conch-text-dim)]" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
