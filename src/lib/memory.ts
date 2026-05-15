import { prisma } from "./prisma";
import { generateEmbedding } from "./embeddings";
import { getPineconeIndex } from "./pinecone";
import type { Memory, MemoryCategory } from "@prisma/client";

export interface MemoryWithScore extends Memory {
  score: number;
}

export async function retrieveRelevantMemories(
  userId: string,
  query: string,
  topK = 5,
  category?: MemoryCategory,
  minScore = 0.65
): Promise<MemoryWithScore[]> {
  try {
    const queryVector = await generateEmbedding(query);
    const index = getPineconeIndex();

    const filter: Record<string, string> = { userId };
    if (category) filter.category = category;

    const results = await index.query({
      vector: queryVector,
      topK,
      filter,
      includeMetadata: true,
    });

    const relevant = results.matches.filter(
      (m) => (m.score ?? 0) >= minScore
    );
    if (relevant.length === 0) return [];

    const ids = relevant.map((m) => m.id);
    const memories = await prisma.memory.findMany({
      where: { pineconeId: { in: ids }, isArchived: false, userId },
    });

    const scoreMap = new Map(relevant.map((m) => [m.id, m.score ?? 0]));

    await prisma.memory.updateMany({
      where: { pineconeId: { in: ids } },
      data: { accessCount: { increment: 1 }, lastAccessed: new Date() },
    });

    return memories
      .map((m) => ({ ...m, score: scoreMap.get(m.pineconeId!) ?? 0 }))
      .sort((a, b) => b.score - a.score);
  } catch {
    return [];
  }
}

export function injectMemoryContext(memories: MemoryWithScore[]): string {
  if (memories.length === 0) return "";

  const lines = memories.map(
    (m) =>
      `[${m.category}] ${m.content.slice(0, 300)}${m.content.length > 300 ? "…" : ""}`
  );

  return `\n\n## Relevant context about this user:\n${lines.join("\n")}`;
}

export function buildSystemPrompt(
  agentSystemPrompt: string | null,
  memories: MemoryWithScore[]
): string {
  const base =
    agentSystemPrompt ||
    "You are Conch, an intelligent AI assistant with persistent memory. You remember context about the user across conversations and use it to give personalized, helpful responses. Be concise, thoughtful, and genuinely helpful.";

  const memoryContext = injectMemoryContext(memories);
  return base + memoryContext;
}
