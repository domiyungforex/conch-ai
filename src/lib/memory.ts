import { Query } from "node-appwrite";
import { createAdminClient } from "./appwrite";
import { generateEmbedding } from "./embeddings";
import { getPineconeIndex } from "./pinecone";
import { DB_ID, COLLECTIONS, type MemoryDoc, type MemoryCategory, type AppwriteDoc } from "./db";

export interface MemoryWithScore extends AppwriteDoc<MemoryDoc> {
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
    const { databases } = createAdminClient();

    const queryFilters = [
      Query.equal("pineconeId", ids),
      Query.equal("isArchived", false),
      Query.equal("userId", userId),
      Query.limit(ids.length),
    ];
    const result = await databases.listDocuments(DB_ID, COLLECTIONS.MEMORIES, queryFilters);
    const memories = result.documents as unknown as AppwriteDoc<MemoryDoc>[];

    const scoreMap = new Map(relevant.map((m) => [m.id, m.score ?? 0]));

    const now = new Date().toISOString();
    await Promise.all(
      memories.map((m) =>
        databases.updateDocument(DB_ID, COLLECTIONS.MEMORIES, m.$id, {
          accessCount: m.accessCount + 1,
          lastAccessed: now,
        })
      )
    );

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
  memories: MemoryWithScore[],
  totalMemoryCount = 0
): string {
  const base =
    agentSystemPrompt ||
    `You are Conch, an intelligent AI assistant with persistent memory. You remember context about the user across conversations and use it to give personalized, helpful responses.

MEMORY CAPABILITIES:
- You have access to a saveMemory tool. Use it whenever the user asks you to remember something, or when they share a preference, fact, or personal detail worth preserving.
- Always confirm when you save a memory (e.g., "Got it, I've saved that to your memory.").
- When asked what you remember about the user, summarize the relevant memories shown below.${totalMemoryCount > 0 ? ` The user has ${totalMemoryCount} total memories; you are seeing the most relevant ones.` : ""}
- Be concise, thoughtful, and genuinely helpful.`;

  const memoryContext = injectMemoryContext(memories);
  return base + memoryContext;
}
