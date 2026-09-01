export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Appwrite has no native vector index, so relevance search is brute-force:
// score every candidate against the query vector in-process, then keep the top K.
// Fine at personal/small-team scale; revisit if a single user's memory count grows large.
//
// `score` returned is always the raw cosine similarity (used for the minScore filter and
// reported to callers). Ranking additionally weights in `importance` as a light tiebreaker —
// among comparably-relevant memories, ones the user (or the AI) flagged as more important
// surface first, without letting importance override genuine semantic relevance.
export function topKBySimilarity<T extends { embedding: number[]; importance?: number }>(
  queryVector: number[],
  candidates: T[],
  topK: number,
  minScore: number
): Array<T & { score: number }> {
  return candidates
    .map((c) => ({ ...c, score: cosineSimilarity(queryVector, c.embedding) }))
    .filter((c) => c.score >= minScore)
    .sort((a, b) => {
      const rankA = a.score * 0.85 + (a.importance ?? 0.5) * 0.15;
      const rankB = b.score * 0.85 + (b.importance ?? 0.5) * 0.15;
      return rankB - rankA;
    })
    .slice(0, topK);
}
