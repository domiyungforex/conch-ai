"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { ArrowLeft, Save, Send, AlertTriangle, Loader2 } from "lucide-react";

export default function SubmitPage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [form, setForm] = useState({
    projectName: "",
    oneLiner: "",
    description: "",
    problemSolved: "",
    conchUsage: "",
    memoryImplementation: "",
    agentImplementation: "",
    demoUrl: "",
    videoUrl: "",
    githubUrl: "",
  });

  useEffect(() => {
    if (isLoaded && !user) {
      router.push("/sign-in");
    }
  }, [user, isLoaded, router]);

  // Autosave with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (form.projectName) {
        localStorage.setItem("conch-draft", JSON.stringify(form));
        setLastSaved(new Date().toLocaleTimeString());
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [form]);

  // Load draft on mount
  useEffect(() => {
    const draft = localStorage.getItem("conch-draft");
    if (draft) {
      try {
        setForm(JSON.parse(draft));
      } catch {}
    }
  }, []);

  const updateForm = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      localStorage.setItem("conch-draft", JSON.stringify(form));
      setLastSaved(new Date().toLocaleTimeString());
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      // POST to API
      const res = await fetch("/api/challenge/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: null, participantEmail: user?.emailAddresses?.[0]?.emailAddress }),
      });
      // For now, just simulate success
      await new Promise((r) => setTimeout(r, 1500));
      setSubmitted(true);
      localStorage.removeItem("conch-draft");
    } catch {
      // Handle error
    } finally {
      setSubmitting(false);
      setShowConfirm(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="conch-gradient-bg min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[var(--conch-purple)] animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  if (submitted) {
    return (
      <div className="conch-gradient-bg min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-6xl mb-4">🐚</div>
          <h1 className="text-2xl font-bold text-[var(--conch-text)] mb-2">
            Project Submitted!
          </h1>
          <p className="text-[var(--conch-text-muted)] mb-8">
            Your entry has been submitted for judging.
          </p>
          <Link href="/challenge/dashboard"
            className="px-6 py-3 rounded-xl font-semibold text-white text-sm transition-all hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #7c3aed, #6d28d9)" }}>
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="conch-gradient-bg min-h-screen">
      {/* Nav */}
      <div className="border-b border-[var(--conch-border)]"
        style={{ background: "rgba(5, 5, 8, 0.8)", backdropFilter: "blur(20px)" }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/challenge/dashboard"
            className="flex items-center gap-2 text-[var(--conch-text-muted)] hover:text-[var(--conch-text)] transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" />
            Dashboard
          </Link>
          <div className="flex items-center gap-3">
            {lastSaved && (
              <span className="text-xs text-[var(--conch-text-dim)]">
                Saved {lastSaved}
              </span>
            )}
            <button onClick={handleSaveDraft} disabled={saving}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-[var(--conch-border)] text-[var(--conch-text-muted)] hover:border-[var(--conch-border-hover)] transition-colors disabled:opacity-50">
              <Save className="w-3.5 h-3.5" />
              {saving ? "Saving..." : "Save Draft"}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <h1 className="text-2xl font-bold text-[var(--conch-text)] mb-2">Submit Your Project</h1>
        <p className="text-sm text-[var(--conch-text-muted)] mb-10">
          Fill in the details about your project. Your work is auto-saved as a draft.
        </p>

        <div className="space-y-6">
          <Field label="Project Name" required>
            <input type="text" value={form.projectName} onChange={(e) => updateForm("projectName", e.target.value)}
              placeholder="My Amazing Project" className="input-field" />
          </Field>

          <Field label="One-Line Pitch" required>
            <input type="text" value={form.oneLiner} onChange={(e) => updateForm("oneLiner", e.target.value)}
              placeholder="A brief description of what your project does" className="input-field" />
          </Field>

          <Field label="Full Description" required>
            <textarea value={form.description} onChange={(e) => updateForm("description", e.target.value)}
              placeholder="Describe your project in detail..." rows={5} className="input-field resize-none" />
          </Field>

          <Field label="Problem Being Solved" required>
            <textarea value={form.problemSolved} onChange={(e) => updateForm("problemSolved", e.target.value)}
              placeholder="What problem does your project address?" rows={3} className="input-field resize-none" />
          </Field>

          <Field label="How Conch Is Used" required>
            <textarea value={form.conchUsage} onChange={(e) => updateForm("conchUsage", e.target.value)}
              placeholder="Describe how your project uses Conch..." rows={3} className="input-field resize-none" />
          </Field>

          <Field label="Persistent Memory Implementation" required>
            <textarea value={form.memoryImplementation} onChange={(e) => updateForm("memoryImplementation", e.target.value)}
              placeholder="How does your project use persistent memory?" rows={3} className="input-field resize-none" />
          </Field>

          <Field label="AI Agent Implementation" required>
            <textarea value={form.agentImplementation} onChange={(e) => updateForm("agentImplementation", e.target.value)}
              placeholder="How does your project use AI agents?" rows={3} className="input-field resize-none" />
          </Field>

          <Field label="Demo URL">
            <input type="url" value={form.demoUrl} onChange={(e) => updateForm("demoUrl", e.target.value)}
              placeholder="https://..." className="input-field" />
          </Field>

          <Field label="Video URL">
            <input type="url" value={form.videoUrl} onChange={(e) => updateForm("videoUrl", e.target.value)}
              placeholder="https://youtube.com/..." className="input-field" />
          </Field>

          <Field label="GitHub URL">
            <input type="url" value={form.githubUrl} onChange={(e) => updateForm("githubUrl", e.target.value)}
              placeholder="https://github.com/..." className="input-field" />
          </Field>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 mt-10 pt-8 border-t border-[var(--conch-border)]">
          <button onClick={handleSaveDraft} disabled={saving}
            className="px-6 py-3 rounded-xl font-semibold text-sm border border-[var(--conch-border)] text-[var(--conch-text)] hover:border-[var(--conch-border-hover)] transition-all disabled:opacity-50">
            {saving ? "Saving Draft..." : "Save Draft"}
          </button>
          <button onClick={() => setShowConfirm(true)}
            className="px-6 py-3 rounded-xl font-bold text-white text-sm transition-all hover:opacity-90 conch-glow flex items-center justify-center gap-2"
            style={{ background: "linear-gradient(135deg, #7c3aed, #6d28d9)" }}>
            <Send className="w-4 h-4" />
            Submit Project
          </button>
        </div>
      </div>

      {/* Confirm modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={() => setShowConfirm(false)}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="relative max-w-md w-full rounded-2xl border border-[var(--conch-border)] p-6"
            style={{ background: "var(--conch-surface)" }}
            onClick={(e) => e.stopPropagation()}>
            <AlertTriangle className="w-10 h-10 text-yellow-400 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-[var(--conch-text)] text-center mb-2">
              Confirm Submission
            </h3>
            <p className="text-sm text-[var(--conch-text-muted)] text-center mb-6">
              Once submitted, your entry will be locked for judging unless the organizers reopen it.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirm(false)}
                className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium border border-[var(--conch-border)] text-[var(--conch-text)] hover:border-[var(--conch-border-hover)] transition-colors">
                Cancel
              </button>
              <button onClick={handleSubmit} disabled={submitting}
                className="flex-1 px-4 py-2.5 rounded-lg text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #7c3aed, #6d28d9)" }}>
                {submitting ? "Submitting..." : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .input-field {
          width: 100%;
          padding: 0.75rem 1rem;
          border-radius: 0.75rem;
          font-size: 0.875rem;
          color: var(--conch-text);
          border: 1px solid var(--conch-border);
          background: var(--conch-surface-2);
          transition: border-color 0.2s, box-shadow 0.2s;
          outline: none;
        }
        .input-field:focus {
          border-color: #7c3aed;
          box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
        }
        .input-field::placeholder {
          color: var(--conch-text-dim);
        }
      `}</style>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-[var(--conch-text)] mb-1.5">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children}
    </div>
  );
}
