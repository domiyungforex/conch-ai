import { Query } from "node-appwrite";
import { createAdminClient } from "./appwrite";
import { generateEmbedding } from "./embeddings";
import { topKBySimilarity } from "./vectorSearch";
import { DB_ID, COLLECTIONS, type MemoryDoc, type MemoryCategory, type AppwriteDoc } from "./db";

export interface MemoryWithScore extends AppwriteDoc<MemoryDoc> {
  score: number;
}

// Bounds the brute-force scan below Appwrite's max query limit.
const MAX_CANDIDATES = 1000;

export async function retrieveRelevantMemories(
  userId: string,
  query: string,
  topK = 5,
  category?: MemoryCategory,
  // Voyage AI cosine scores run lower than OpenAI's did — 0.65 (the old Pinecone-era
  // default) filtered out every real match. ~0.3 is where relevant pairs separate from noise.
  minScore = 0.3
): Promise<MemoryWithScore[]> {
  try {
    const queryVector = await generateEmbedding(query);
    const { databases } = createAdminClient();

    const filters = [
      Query.equal("userId", userId),
      Query.equal("isArchived", false),
      Query.limit(MAX_CANDIDATES),
    ];
    if (category) filters.push(Query.equal("category", category));

    const result = await databases.listDocuments(DB_ID, COLLECTIONS.MEMORIES, filters);
    const memories = result.documents as unknown as AppwriteDoc<MemoryDoc>[];

    const relevant = topKBySimilarity(queryVector, memories, topK, minScore);
    if (relevant.length === 0) return [];

    const now = new Date().toISOString();
    await Promise.all(
      relevant.map((m) =>
        databases.updateDocument(DB_ID, COLLECTIONS.MEMORIES, m.$id, {
          accessCount: m.accessCount + 1,
          lastAccessed: now,
        })
      )
    );

    return relevant;
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
    `You are Conch, an AI assistant with persistent, searchable memory of the user across every conversation. Your job is to be genuinely useful — not just responsive.

MEMORY CAPABILITIES:
- saveMemory: use it proactively whenever the user shares a preference, fact, plan, or personal detail worth remembering — don't wait to be asked. Always briefly confirm what you saved (e.g., "Got it, I'll remember that.").
- searchMemory: the memories shown below are only the ones auto-retrieved for this specific message. If the user references something not covered there — an older conversation, a different topic — call searchMemory instead of saying you don't know.
- When asked what you remember about the user, synthesize the relevant memories below into a real answer, don't just list them.${totalMemoryCount > 0 ? ` The user has ${totalMemoryCount} total memories; you're seeing the most relevant ones for this message.` : ""}

STYLE:
- Be direct and concise by default; expand only when the question warrants it.
- If a request is ambiguous, ask a clarifying question rather than guessing.
- Say when you're not sure, rather than filling gaps with confident-sounding guesses.`;

  const memoryContext = injectMemoryContext(memories);
  return base + memoryContext;
}
