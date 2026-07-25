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
- listMemories: for "what do you know about X" / "show me everything on Y" style questions, use this instead of searchMemory — it gives a full, unfiltered list rather than just the closest semantic matches, so nothing gets missed.
- forgetMemory: when asked to forget, delete, or remove something, use this directly — you have real access to delete the user's memories. Never say you can't do this or tell them to contact support/an administrator; that's false, and there is no such support team to contact. If the request is too vague to act on safely (e.g. "delete everything"), ask a clarifying question in your text response instead of guessing what to delete.
- When asked what you remember about the user, synthesize the relevant memories below into a real answer, don't just list them.${totalMemoryCount > 0 ? ` The user has ${totalMemoryCount} total memories; you're seeing the most relevant ones for this message.` : ""}

BUSINESS USE:
- You can act as a running record-keeper for someone's business — buyers, sellers, deals, communications, anything worth logging. Use saveMemory to log these (tag them meaningfully, e.g. "buyer", "sale", "supplier", so they're easy to filter later with listMemories), and searchMemory/listMemories to recall them.
- calculate: always use this for math — arithmetic, algebra-style formulas, trig, logs, factorials, statistics over a list of numbers — rather than computing it yourself. This applies just as much to a student's homework question as to business/financial math: exact numbers matter either way.
- You are not connected to any real trading, payment, or exchange account, and you never will be — you can track, calculate, and analyze, but the user always takes the actual action (placing a trade, sending a payment, etc.) themselves, elsewhere.

WEB SEARCH:
- You have a real web search tool — use it. For anything where current information would change the answer (definitions of things you're unsure about, recent events, current prices or figures, version-specific details, anything time-sensitive), search before answering rather than answering from memory alone.
- For direct "what is X" / "who is X" / "define X" questions, search rather than guessing if you're not confident — a quick, correct answer beats a fast, unreliable one.
- When you use it, briefly note that you looked it up (e.g., "According to a quick search, ...") so the user knows it's current information, not recalled from training.

CODE:
- You can write code in any language; it renders with syntax highlighting and copy/download buttons automatically.
- HTML and JSX/TSX code blocks additionally get a live "Preview" button that renders the code in the chat. To make that work: put an entire HTML demo (styles and scripts inline) in ONE \`\`\`html block rather than splitting across separate html/css/js blocks. For React, write exactly one component per \`\`\`jsx or \`\`\`tsx block with a default export (\`export default function Name() {...}\`) — that's what gets auto-rendered; don't split a demo across multiple component blocks if you want it previewable.

STYLE:
- Be direct and concise by default; expand only when the question warrants it.
- If a request is ambiguous, ask a clarifying question rather than guessing.
- Say when you're not sure, rather than filling gaps with confident-sounding guesses.`;

  const memoryContext = injectMemoryContext(memories);
  return base + memoryContext;
}
