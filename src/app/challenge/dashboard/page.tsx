"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth/client";
import { ArrowLeft, Clock, CheckCircle, Circle, Loader2 } from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [challengeStatus] = useState("Joined");
  const [submissionStatus] = useState("In Progress");

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/sign-in");
    }
  }, [session, isPending, router]);

  if (isPending) {
    return (
      <div className="conch-gradient-bg min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[var(--conch-purple)] animate-spin" />
      </div>
    );
  }

  if (!session) return null;

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

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <h1 className="text-2xl md:text-3xl font-bold text-[var(--conch-text)] mb-8">
          Your Dashboard
        </h1>

        {/* Status cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Status", value: challengeStatus },
            { label: "Submission", value: submissionStatus },
            { label: "Deadline", value: "TBD" },
            { label: "Time Left", value: "—" },
          ].map((card) => (
            <div key={card.label} className="conch-glass rounded-xl p-4">
              <span className="text-xs text-[var(--conch-text-dim)] uppercase tracking-wider">{card.label}</span>
              <p className="text-lg font-semibold text-[var(--conch-text)] mt-1">{card.value}</p>
            </div>
          ))}
        </div>

        {/* User info */}
        <div className="conch-glass rounded-xl p-5 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #7c3aed, #a78bfa)" }}>
              <span className="text-white text-sm font-bold">
                {session.user.name?.charAt(0) || session.user.email?.charAt(0) || "U"}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--conch-text)]">{session.user.name || "User"}</p>
              <p className="text-xs text-[var(--conch-text-dim)]">{session.user.email}</p>
            </div>
          </div>
        </div>

        {/* My Project */}
        <div className="conch-glass rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-[var(--conch-text)] mb-4">My Project</h2>
          <p className="text-sm text-[var(--conch-text-dim)]">
            You haven&apos;t created a project yet.
          </p>
          <Link href="/challenge/dashboard/submit"
            className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #7c3aed, #6d28d9)" }}>
            Create Project
          </Link>
        </div>

        {/* Submission progress */}
        <div className="conch-glass rounded-xl p-6">
          <h2 className="text-lg font-semibold text-[var(--conch-text)] mb-4">Submission Progress</h2>
          <div className="space-y-3">
            {[
              { label: "Profile", done: true },
              { label: "Project Details", done: false },
              { label: "Demo", done: false },
              { label: "Conch Usage", done: false },
              { label: "Submit", done: false },
            ].map((step) => (
              <div key={step.label} className="flex items-center gap-3">
                {step.done ? (
                  <CheckCircle className="w-5 h-5 text-green-400 shrink-0" />
                ) : (
                  <Circle className="w-5 h-5 text-[var(--conch-text-dim)] shrink-0" />
                )}
                <span className={`text-sm ${step.done ? "text-[var(--conch-text)]" : "text-[var(--conch-text-muted)]"}`}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
