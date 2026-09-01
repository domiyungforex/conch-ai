"use client";

import { useEffect, useState } from "react";
import { Trophy, Trash2, Eye, EyeOff, Award, AlertTriangle } from "lucide-react";

interface Winner {
  id: string;
  placement: number;
  prizeAmount: number;
  publishedAt: string | null;
  createdAt: string;
  projectName: string;
  projectSlug: string;
  projectOneLiner: string | null;
  participantName: string;
  participantEmail: string;
}

interface Project {
  projectId: string;
  projectName: string;
  projectSlug: string;
  projectOneLiner: string | null;
  participantId: string;
  participantName: string;
  participantEmail: string;
}

const placementConfig: Record<number, { medal: string; label: string; color: string; defaultPrize: number }> = {
  1: { medal: "🥇", label: "First Place", color: "#ffd700", defaultPrize: 2500 },
  2: { medal: "🥈", label: "Second Place", color: "#c0c0c0", defaultPrize: 1500 },
  3: { medal: "🥉", label: "Third Place", color: "#cd7f32", defaultPrize: 1000 },
};

export default function AdminWinnersPage() {
  const [winners, setWinners] = useState<Winner[]>([]);
  const [topProjects, setTopProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSelect, setShowSelect] = useState<number | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [prizeAmount, setPrizeAmount] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showConfirm, setShowConfirm] = useState<{ action: string; data?: unknown } | null>(null);

  const fetchData = () => {
    setLoading(true);
    fetch("/api/challenge/admin/winners")
      .then((res) => res.json())
      .then((data) => {
        setWinners(data.winners || []);
        setTopProjects(data.topProjects || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const takenPlacements = winners.map((w) => w.placement);
  const availablePlacements = [1, 2, 3].filter((p) => !takenPlacements.includes(p));

  const handleSelectWinner = async () => {
    if (!selectedProject || showSelect === null) return;
    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/challenge/admin/winners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: selectedProject.projectId,
          participantId: selectedProject.participantId,
          placement: showSelect,
          prizeAmount,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to select winner.");
        setSaving(false);
        return;
      }

      setShowSelect(null);
      setSelectedProject(null);
      fetchData();
    } catch {
      setError("Network error.");
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveWinner = async (winnerId: string) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/challenge/admin/winners?id=${winnerId}`, {
        method: "DELETE",
      });
      if (res.ok) fetchData();
    } finally {
      setSaving(false);
      setShowConfirm(null);
    }
  };

  const handlePublish = async () => {
    setSaving(true);
    try {
      await fetch("/api/challenge/admin/winners/publish", { method: "POST" });
      fetchData();
    } finally {
      setSaving(false);
      setShowConfirm(null);
    }
  };

  const allPublished = winners.length > 0 && winners.every((w) => w.publishedAt);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[var(--conch-text)]">Winners</h1>
          <p className="text-sm text-[var(--conch-text-muted)] mt-1">
            {winners.length} of 3 positions awarded
          </p>
        </div>
        {winners.length > 0 && (
          <button
            onClick={() => setShowConfirm({ action: "publish" })}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #7c3aed, #6d28d9)" }}
          >
            <Award className="w-4 h-4" />
            {allPublished ? "Published ✓" : "Publish Winners"}
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-[var(--conch-purple)] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Winner slots */}
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            {[1, 2, 3].map((placement) => {
              const config = placementConfig[placement];
              const winner = winners.find((w) => w.placement === placement);

              return (
                <div key={placement} className="conch-glass rounded-xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{config.medal}</span>
                      <div>
                        <p className="text-xs text-[var(--conch-text-dim)] uppercase tracking-wider">
                          {config.label}
                        </p>
                        <p className="text-lg font-bold" style={{ color: config.color }}>
                          ${config.defaultPrize.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    {winner && (
                      <div className="flex items-center gap-1">
                        {winner.publishedAt ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-400/10 text-green-400 border border-green-400/20">
                            Published
                          </span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-400/10 text-yellow-400 border border-yellow-400/20">
                            Draft
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {winner ? (
                    <div className="mb-3">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
                          style={{ background: `${config.color}20`, color: config.color }}>
                          {winner.participantName.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-[var(--conch-text)] truncate">
                            {winner.participantName}
                          </p>
                          <p className="text-xs text-[var(--conch-text-dim)] truncate">
                            {winner.participantEmail}
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-[var(--conch-text-muted)] mb-1 font-medium">
                        {winner.projectName}
                      </p>
                      {winner.projectOneLiner && (
                        <p className="text-[10px] text-[var(--conch-text-dim)] truncate">
                          {winner.projectOneLiner}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-[var(--conch-text-dim)] mb-3">
                      No winner selected yet.
                    </p>
                  )}

                  <div className="flex gap-2">
                    {!winner && (
                      <button
                        onClick={() => {
                          setShowSelect(placement);
                          setPrizeAmount(config.defaultPrize);
                        }}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-[var(--conch-border)] text-[var(--conch-text-muted)] hover:border-[var(--conch-border-hover)] transition-colors"
                      >
                        <Award className="w-3.5 h-3.5" />
                        Select Winner
                      </button>
                    )}
                    {winner && (
                      <button
                        onClick={() => setShowConfirm({ action: "remove", data: winner })}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-red-400/30 text-red-400 hover:bg-red-400/10 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selection modal */}
          {showSelect !== null && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={() => setShowSelect(null)}>
              <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
              <div
                className="relative max-w-lg w-full rounded-2xl border border-[var(--conch-border)] p-6 max-h-[80vh] overflow-y-auto conch-scroll"
                style={{ background: "var(--conch-surface)" }}
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-lg font-bold text-[var(--conch-text)] mb-1">
                  Select {placementConfig[showSelect].label}
                </h3>
                <p className="text-sm text-[var(--conch-text-muted)] mb-6">
                  Choose a project to award {placementConfig[showSelect].medal} ${prizeAmount.toLocaleString()}
                </p>

                {/* Prize amount */}
                <div className="mb-4">
                  <label className="block text-xs text-[var(--conch-text-dim)] uppercase tracking-wider mb-1.5">
                    Prize Amount ($)
                  </label>
                  <input
                    type="number"
                    value={prizeAmount}
                    onChange={(e) => setPrizeAmount(parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-2.5 rounded-lg text-sm text-[var(--conch-text)] border border-[var(--conch-border)] focus:border-[var(--conch-purple)] focus:outline-none"
                    style={{ background: "var(--conch-surface-2)" }}
                  />
                </div>

                {/* Project list */}
                <div className="space-y-2 mb-6">
                  {topProjects.length === 0 ? (
                    <p className="text-sm text-[var(--conch-text-dim)] text-center py-8">
                      No submitted projects to select from.
                    </p>
                  ) : (
                    topProjects.map((p) => (
                      <button
                        key={p.projectId}
                        onClick={() => setSelectedProject(p)}
                        className="w-full text-left p-4 rounded-xl border transition-all"
                        style={{
                          borderColor:
                            selectedProject?.projectId === p.projectId
                              ? "#7c3aed"
                              : "var(--conch-border)",
                          background:
                            selectedProject?.projectId === p.projectId
                              ? "rgba(124, 58, 237, 0.08)"
                              : "var(--conch-surface-2)",
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-[var(--conch-purple-light)]"
                            style={{ background: "rgba(124,58,237,0.12)" }}>
                            {p.participantName.charAt(0)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-[var(--conch-text)] truncate">
                              {p.projectName}
                            </p>
                            <p className="text-xs text-[var(--conch-text-dim)] truncate">
                              by {p.participantName}
                              {p.projectOneLiner && ` — ${p.projectOneLiner}`}
                            </p>
                          </div>
                          {selectedProject?.projectId === p.projectId && (
                            <div className="w-5 h-5 rounded-full flex items-center justify-center"
                              style={{ background: "#7c3aed" }}>
                              <span className="text-white text-xs">✓</span>
                            </div>
                          )}
                        </div>
                      </button>
                    ))
                  )}
                </div>

                {error && (
                  <p className="text-sm text-red-400 mb-4">{error}</p>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => { setShowSelect(null); setSelectedProject(null); setError(""); }}
                    className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium border border-[var(--conch-border)] text-[var(--conch-text)] hover:border-[var(--conch-border-hover)] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSelectWinner}
                    disabled={!selectedProject || saving}
                    className="flex-1 px-4 py-2.5 rounded-lg text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-50"
                    style={{ background: "linear-gradient(135deg, #7c3aed, #6d28d9)" }}
                  >
                    {saving ? "Saving..." : "Award Winner"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Confirm modal */}
          {showConfirm && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={() => setShowConfirm(null)}>
              <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
              <div
                className="relative max-w-sm w-full rounded-2xl border border-[var(--conch-border)] p-6"
                style={{ background: "var(--conch-surface)" }}
                onClick={(e) => e.stopPropagation()}
              >
                <AlertTriangle className="w-10 h-10 text-yellow-400 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-[var(--conch-text)] text-center mb-2">
                  {showConfirm.action === "publish" ? "Publish Winners?" : "Remove Winner?"}
                </h3>
                <p className="text-sm text-[var(--conch-text-muted)] text-center mb-6">
                  {showConfirm.action === "publish"
                    ? "This will make all awarded winners publicly visible. You can still modify after publishing."
                    : `This will remove the ${showConfirm.data ? `#${(showConfirm.data as Winner).placement} place` : ""} winner. This action cannot be undone.`}
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowConfirm(null)}
                    className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium border border-[var(--conch-border)] text-[var(--conch-text)] hover:border-[var(--conch-border-hover)] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (showConfirm.action === "publish") {
                        handlePublish();
                      } else if (showConfirm.action === "remove" && showConfirm.data) {
                        handleRemoveWinner((showConfirm.data as { id: string }).id);
                      }
                    }}
                    disabled={saving}
                    className="flex-1 px-4 py-2.5 rounded-lg text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-50"
                    style={{
                      background: showConfirm.action === "publish"
                        ? "linear-gradient(135deg, #7c3aed, #6d28d9)"
                        : "linear-gradient(135deg, #dc2626, #b91c1c)",
                    }}
                  >
                    {saving ? "Processing..." : showConfirm.action === "publish" ? "Publish" : "Remove"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
