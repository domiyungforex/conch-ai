// Reputation score and level are always DERIVED from the count fields
// (memoryCount/agentCount/chatCount/shareCount), never read as a separately
// stored number. The old approach stored `score`/`level` on ReputationDoc
// and expected every call site that changes a count to also update them —
// nothing ever did, so `score` sat frozen at 0 forever while the per-
// category "+N pts" breakdown (computed live from the same counts) kept
// climbing right next to it. One source of truth instead.

export interface ReputationCounts {
  memoryCount: number;
  agentCount: number;
  chatCount: number;
  shareCount: number;
}

// Matches the "how to earn points" copy already shown in the product.
export const POINTS_PER_MEMORY = 2;
export const POINTS_PER_AGENT = 5;
export const POINTS_PER_CHAT = 0.5;
export const POINTS_PER_SHARE = 3;

export function computeReputationScore(counts: ReputationCounts): number {
  return (
    counts.memoryCount * POINTS_PER_MEMORY +
    counts.agentCount * POINTS_PER_AGENT +
    counts.chatCount * POINTS_PER_CHAT +
    counts.shareCount * POINTS_PER_SHARE
  );
}

export interface ReputationLevel {
  name: string;
  label: string;
  min: number;
  max: number;
  color: string;
}

export const REPUTATION_LEVELS: ReputationLevel[] = [
  { name: "novice", label: "Novice", min: 0, max: 50, color: "text-slate-300" },
  { name: "apprentice", label: "Apprentice", min: 50, max: 150, color: "text-teal-300" },
  { name: "practitioner", label: "Practitioner", min: 150, max: 350, color: "text-coral-300" },
  { name: "expert", label: "Expert", min: 350, max: 700, color: "text-amber-300" },
  { name: "master", label: "Master", min: 700, max: Infinity, color: "text-emerald-300" },
];

export function getLevelInfo(score: number): ReputationLevel {
  return REPUTATION_LEVELS.find((l) => score >= l.min && score < l.max) ?? REPUTATION_LEVELS[0];
}

export function getNextLevel(score: number): ReputationLevel | null {
  const idx = REPUTATION_LEVELS.findIndex((l) => score >= l.min && score < l.max);
  return idx >= 0 && idx < REPUTATION_LEVELS.length - 1 ? REPUTATION_LEVELS[idx + 1] : null;
}

export function getProgressToNext(score: number): number {
  const current = getLevelInfo(score);
  const next = getNextLevel(score);
  if (!next) return 100;
  const range = next.min - current.min;
  const earned = score - current.min;
  return Math.min(100, Math.round((earned / range) * 100));
}
