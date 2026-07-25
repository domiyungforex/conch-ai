import { Query, type Databases } from "node-appwrite";
import { DB_ID, COLLECTIONS, type UserDoc, type AppwriteDoc } from "./db";
import { getSubscriptionStatus, hasProAccess } from "./subscription";

// Matches the numbers already advertised on the landing page
// (src/components/landing/PricingSection.tsx) — Free: 100 memories, 1 agent,
// 50 conversations/month. Pro: unlimited memories/conversations, 10 agents.
export const FREE_LIMITS = {
  memories: 100,
  agents: 1,
  conversationsPerMonth: 50,
};
export const PRO_LIMITS = {
  agents: 10,
};

export async function getIsPro(databases: Databases, userId: string): Promise<boolean> {
  try {
    const user = await databases.getDocument(DB_ID, COLLECTIONS.USERS, userId) as unknown as AppwriteDoc<UserDoc>;
    return hasProAccess(getSubscriptionStatus(user));
  } catch {
    return false;
  }
}

interface QuotaResult {
  allowed: boolean;
  limit?: number;
}

export async function checkMemoryQuota(databases: Databases, userId: string): Promise<QuotaResult> {
  if (await getIsPro(databases, userId)) return { allowed: true };
  const result = await databases.listDocuments(DB_ID, COLLECTIONS.MEMORIES, [
    Query.equal("userId", userId), Query.equal("isArchived", false), Query.limit(1),
  ]);
  return { allowed: result.total < FREE_LIMITS.memories, limit: FREE_LIMITS.memories };
}

export async function checkAgentQuota(databases: Databases, userId: string): Promise<QuotaResult> {
  const isPro = await getIsPro(databases, userId);
  const limit = isPro ? PRO_LIMITS.agents : FREE_LIMITS.agents;
  const result = await databases.listDocuments(DB_ID, COLLECTIONS.AGENTS, [
    Query.equal("userId", userId), Query.notEqual("status", "ARCHIVED"), Query.limit(1),
  ]);
  return { allowed: result.total < limit, limit };
}

export async function checkConversationQuota(databases: Databases, userId: string): Promise<QuotaResult> {
  if (await getIsPro(databases, userId)) return { allowed: true };
  const startOfMonth = new Date();
  startOfMonth.setUTCDate(1);
  startOfMonth.setUTCHours(0, 0, 0, 0);
  const result = await databases.listDocuments(DB_ID, COLLECTIONS.CONVERSATIONS, [
    Query.equal("userId", userId), Query.greaterThanEqual("$createdAt", startOfMonth.toISOString()), Query.limit(1),
  ]);
  return { allowed: result.total < FREE_LIMITS.conversationsPerMonth, limit: FREE_LIMITS.conversationsPerMonth };
}
