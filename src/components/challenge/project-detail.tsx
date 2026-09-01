"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, ExternalLink, GitBranch, Play, Brain, Cpu,
  ArrowRight,
} from "lucide-react";

interface Project {
  id: string;
  name: string;
  slug: string;
  oneLiner: string | null;
  description: string | null;
  problemSolved: string | null;
  conchUsage: string | null;
  memoryImplementation: string | null;
  agentImplementation: string | null;
  demoUrl: string | null;
  videoUrl: string | null;
  githubUrl: string | null;
  coverImageUrl: string | null;
  status: string;
  featured: boolean;
  conchFeaturesUsed: unknown;
  teamMembers: unknown;
  createdAt: string;
  creatorName: string;
  creatorTwitter: string | null;
  creatorCountry: string | null;
  media: { url: string; alt: string | null; type: string }[];
}

export function ProjectDetail({ slug }: { slug: string }) {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/challenge/projects/${slug}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then((data) => setProject(data.project))
      .catch(() => setError("Project not found"))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center conch-gradient-bg">
        <div className="w-8 h-8 border-2 border-[var(--conch-purple)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center conch-gradient-bg px-4">
        <p className="text-xl text-[var(--conch-text)] mb-4">Project not found</p>
        <Link href="/challenge" className="text-[var(--conch-purple-light)] hover:underline">
          Back to Challenge
        </Link>
      </div>
    );
  }

  const features = Array.isArray(project.conchFeaturesUsed)
    ? (project.conchFeaturesUsed as string[])
    : [];

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
        {/* Cover image */}
        {project.coverImageUrl && (
          <div className="rounded-2xl overflow-hidden mb-8 border border-[var(--conch-border)]">
            <img
              src={project.coverImageUrl}
              alt={project.name}
              className="w-full h-64 md:h-80 object-cover"
            />
          </div>
        )}

        {/* Title */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2 mb-3">
            {project.featured && (
              <span className="text-xs px-2.5 py-1 rounded-full bg-[var(--conch-purple)] text-white font-medium">
                Featured
              </span>
            )}
            {features.map((f) => (
              <span key={f} className="text-xs px-2.5 py-1 rounded-full border border-[var(--conch-border)] text-[var(--conch-purple-light)]">
                {f}
              </span>
            ))}
          </div>

          <h1 className="text-3xl md:text-5xl font-bold text-[var(--conch-text)] mb-3">
            {project.name}
          </h1>
          {project.oneLiner && (
            <p className="text-lg text-[var(--conch-text-muted)]">{project.oneLiner}</p>
          )}

          {/* Creator info */}
          <div className="flex items-center gap-3 mt-6">
            <div className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #7c3aed, #a78bfa)" }}>
              <span className="text-white text-sm font-bold">
                {project.creatorName.charAt(0)}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--conch-text)]">{project.creatorName}</p>
              <p className="text-xs text-[var(--conch-text-dim)]">
                {project.creatorTwitter && `@${project.creatorTwitter}`}
                {project.creatorTwitter && project.creatorCountry && " · "}
                {project.creatorCountry}
              </p>
            </div>
          </div>
        </div>

        {/* Links */}
        <div className="flex flex-wrap gap-3 mb-12">
          {project.demoUrl && (
            <a
              href={project.demoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #7c3aed, #6d28d9)" }}
            >
              <ExternalLink className="w-4 h-4" />
              Live Demo
            </a>
          )}
          {project.videoUrl && (
            <a
              href={project.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border border-[var(--conch-border)] text-[var(--conch-text)] transition-all hover:border-[var(--conch-border-hover)]"
            >
              <Play className="w-4 h-4" />
              Watch Video
            </a>
          )}
          {project.githubUrl && (
            <a
              href={project.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border border-[var(--conch-border)] text-[var(--conch-text)] transition-all hover:border-[var(--conch-border-hover)]"
            >
              <GitBranch className="w-4 h-4" />
              Source Code
            </a>
          )}
        </div>

        {/* Description */}
        {project.description && (
          <section className="mb-12">
            <h2 className="text-xl font-bold text-[var(--conch-text)] mb-4">About</h2>
            <div className="prose prose-invert max-w-none">
              <p className="text-[var(--conch-text-muted)] leading-relaxed whitespace-pre-wrap">
                {project.description}
              </p>
            </div>
          </section>
        )}

        {/* Screenshots */}
        {project.media.length > 0 && (
          <section className="mb-12">
            <h2 className="text-xl font-bold text-[var(--conch-text)] mb-4">Screenshots</h2>
            <div className="grid gap-4">
              {project.media.map((m, i) => (
                <div key={i} className="rounded-xl overflow-hidden border border-[var(--conch-border)]">
                  <img src={m.url} alt={m.alt || `Screenshot ${i + 1}`} className="w-full" />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* How Conch was used */}
        {(project.conchUsage || project.memoryImplementation || project.agentImplementation) && (
          <section className="mb-12">
            <h2 className="text-xl font-bold text-[var(--conch-text)] mb-6">
              How Conch Was Used
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {project.memoryImplementation && (
                <div className="conch-glass rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Brain className="w-5 h-5 text-[var(--conch-purple-light)]" />
                    <h3 className="font-semibold text-[var(--conch-text)]">Memory Architecture</h3>
                  </div>
                  <p className="text-sm text-[var(--conch-text-muted)] leading-relaxed whitespace-pre-wrap">
                    {project.memoryImplementation}
                  </p>
                </div>
              )}
              {project.agentImplementation && (
                <div className="conch-glass rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Cpu className="w-5 h-5 text-[var(--conch-purple-light)]" />
                    <h3 className="font-semibold text-[var(--conch-text)]">Agent Architecture</h3>
                  </div>
                  <p className="text-sm text-[var(--conch-text-muted)] leading-relaxed whitespace-pre-wrap">
                    {project.agentImplementation}
                  </p>
                </div>
              )}
            </div>
            {project.conchUsage && (
              <div className="conch-glass rounded-xl p-5 mt-4">
                <p className="text-sm text-[var(--conch-text-muted)] leading-relaxed whitespace-pre-wrap">
                  {project.conchUsage}
                </p>
              </div>
            )}
          </section>
        )}

        {/* CTA */}
        <div className="text-center py-12 border-t border-[var(--conch-border)]">
          <p className="text-[var(--conch-text-muted)] mb-4">
            Build yours with Conch
          </p>
          <Link
            href="/challenge/waitlist"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-white transition-all hover:opacity-90 conch-glow"
            style={{ background: "linear-gradient(135deg, #7c3aed, #6d28d9)" }}
          >
            Join the Challenge
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
