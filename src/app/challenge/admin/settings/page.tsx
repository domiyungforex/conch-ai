"use client";

import { useEffect, useState } from "react";

interface ChallengeSettings {
  title: string;
  description: string;
  phase: string;
  startDate: string;
  endDate: string;
  submissionDeadline: string;
  judgingStart: string;
  winnerAnnouncementDate: string;
  totalPrizeFund: number;
  firstPrize: number;
  secondPrize: number;
  thirdPrize: number;
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<ChallengeSettings>({
    title: "The Conch Creator Challenge",
    description: "Build something meaningful using Conch's persistent memory and agent infrastructure.",
    phase: "upcoming",
    startDate: "",
    endDate: "",
    submissionDeadline: "",
    judgingStart: "",
    winnerAnnouncementDate: "",
    totalPrizeFund: 5000,
    firstPrize: 2500,
    secondPrize: 1500,
    thirdPrize: 1000,
  });
  const [saved, setSaved] = useState(false);

  const updateSetting = (key: keyof ChallengeSettings, value: string | number) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    try {
      await fetch("/api/challenge/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      // Handle error
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-[var(--conch-text)]">Settings</h1>
        <button
          onClick={handleSave}
          className="px-5 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90"
          style={{ background: "linear-gradient(135deg, #7c3aed, #6d28d9)" }}
        >
          {saved ? "Saved ✓" : "Save Changes"}
        </button>
      </div>

      <div className="space-y-6">
        {/* Challenge Info */}
        <div className="conch-glass rounded-xl p-6">
          <h2 className="text-lg font-semibold text-[var(--conch-text)] mb-4">Challenge Information</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-[var(--conch-text-dim)] uppercase tracking-wider mb-1.5">Title</label>
              <input type="text" value={settings.title} onChange={(e) => updateSetting("title", e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg text-sm text-[var(--conch-text)] border border-[var(--conch-border)] focus:border-[var(--conch-purple)] focus:outline-none"
                style={{ background: "var(--conch-surface-2)" }} />
            </div>
            <div>
              <label className="block text-xs text-[var(--conch-text-dim)] uppercase tracking-wider mb-1.5">Phase</label>
              <select value={settings.phase} onChange={(e) => updateSetting("phase", e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg text-sm text-[var(--conch-text)] border border-[var(--conch-border)] focus:border-[var(--conch-purple)] focus:outline-none"
                style={{ background: "var(--conch-surface-2)" }}>
                <option value="upcoming">Upcoming</option>
                <option value="open">Open</option>
                <option value="building">Building</option>
                <option value="submission">Submission</option>
                <option value="judging">Judging</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs text-[var(--conch-text-dim)] uppercase tracking-wider mb-1.5">Description</label>
              <textarea value={settings.description} onChange={(e) => updateSetting("description", e.target.value)} rows={2}
                className="w-full px-4 py-2.5 rounded-lg text-sm text-[var(--conch-text)] border border-[var(--conch-border)] focus:border-[var(--conch-purple)] focus:outline-none resize-none"
                style={{ background: "var(--conch-surface-2)" }} />
            </div>
          </div>
        </div>

        {/* Dates */}
        <div className="conch-glass rounded-xl p-6">
          <h2 className="text-lg font-semibold text-[var(--conch-text)] mb-4">Important Dates</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { key: "startDate" as const, label: "Start Date" },
              { key: "endDate" as const, label: "End Date" },
              { key: "submissionDeadline" as const, label: "Submission Deadline" },
              { key: "judgingStart" as const, label: "Judging Start" },
              { key: "winnerAnnouncementDate" as const, label: "Winner Announcement" },
            ].map((field) => (
              <div key={field.key}>
                <label className="block text-xs text-[var(--conch-text-dim)] uppercase tracking-wider mb-1.5">{field.label}</label>
                <input type="datetime-local" value={settings[field.key]}
                  onChange={(e) => updateSetting(field.key, e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg text-sm text-[var(--conch-text)] border border-[var(--conch-border)] focus:border-[var(--conch-purple)] focus:outline-none"
                  style={{ background: "var(--conch-surface-2)" }} />
              </div>
            ))}
          </div>
        </div>

        {/* Prize */}
        <div className="conch-glass rounded-xl p-6">
          <h2 className="text-lg font-semibold text-[var(--conch-text)] mb-4">Prize Configuration</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { key: "totalPrizeFund" as const, label: "Total Fund ($)" },
              { key: "firstPrize" as const, label: "1st Place ($)" },
              { key: "secondPrize" as const, label: "2nd Place ($)" },
              { key: "thirdPrize" as const, label: "3rd Place ($)" },
            ].map((field) => (
              <div key={field.key}>
                <label className="block text-xs text-[var(--conch-text-dim)] uppercase tracking-wider mb-1.5">{field.label}</label>
                <input type="number" value={settings[field.key]}
                  onChange={(e) => updateSetting(field.key, parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-2.5 rounded-lg text-sm text-[var(--conch-text)] border border-[var(--conch-border)] focus:border-[var(--conch-purple)] focus:outline-none"
                  style={{ background: "var(--conch-surface-2)" }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
