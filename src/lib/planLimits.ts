import { Query, type Databases } from "node-appwrite";
import { DB_ID, COLLECTIONS, type UserDoc, type AppwriteDoc } from "./db";
import { getEffectivePlan } from "./subscription";
import type { PlanId } from "./plans";

// Matches the numbers advertised on the landing page
// (src/components/landing/PricingSection.tsx).
// Free: 100 memories, 1 agent, 50 conversations/month, 20 chat messages/day.
// Pro: 1,000 memories, 10 agents, unlimited conversations & chat.
// Premium: unlimited everything — every check below short-circuits for it.
export const FREE_LIMITS = {
  memories: 100,
  agents: 1,
  conversationsPerMonth: 50,
  chatMessagesPerDay: 20,
};
export const PRO_LIMITS = {
  memories: 1000,
  agents: 10,
};

export async function getPlan(databases: Databases, userId: string): Promise<PlanId> {
  try {
    const user = await databases.getDocument(DB_ID, COLLECTIONS.USERS, userId) as unknown as AppwriteDoc<UserDoc>;
    return getEffectivePlan(user);
  } catch {
    return "free";
  }
}

interface QuotaResult {
  allowed: boolean;
  limit?: number;
  plan: PlanId;
}

// The next tier up that would actually raise this specific limit — Free is
// capped everywhere so either paid tier helps; Pro is only capped on
// memories/agents, so only Premium raises those further.
export function upgradeHint(plan: PlanId): string {
  return plan === "free" ? "Upgrade to Pro or Premium" : "Upgrade to Premium";
}

export async function checkMemoryQuota(databases: Databases, userId: string): Promise<QuotaResult> {
  const plan = await getPlan(databases, userId);
  if (plan === "premium") return { allowed: true, plan };
  const limit = plan === "pro" ? PRO_LIMITS.memories : FREE_LIMITS.memories;
  const result = await databases.listDocuments(DB_ID, COLLECTIONS.MEMORIES, [
    Query.equal("userId", userId), Query.equal("isArchived", false), Query.limit(1),
  ]);
  return { allowed: result.total < limit, limit, plan };
}

export async function checkAgentQuota(databases: Databases, userId: string): Promise<QuotaResult> {
  const plan = await getPlan(databases, userId);
  if (plan === "premium") return { allowed: true, plan };
  const limit = plan === "pro" ? PRO_LIMITS.agents : FREE_LIMITS.agents;
  const result = await databases.listDocuments(DB_ID, COLLECTIONS.AGENTS, [
    Query.equal("userId", userId), Query.notEqual("status", "ARCHIVED"), Query.limit(1),
  ]);
  return { allowed: result.total < limit, limit, plan };
}

export async function checkConversationQuota(databases: Databases, userId: string): Promise<QuotaResult> {
  const plan = await getPlan(databases, userId);
  if (plan !== "free") return { allowed: true, plan };
  const startOfMonth = new Date();
  startOfMonth.setUTCDate(1);
  startOfMonth.setUTCHours(0, 0, 0, 0);
  const result = await databases.listDocuments(DB_ID, COLLECTIONS.CONVERSATIONS, [
    Query.equal("userId", userId), Query.greaterThanEqual("$createdAt", startOfMonth.toISOString()), Query.limit(1),
  ]);
  return { allowed: result.total < FREE_LIMITS.conversationsPerMonth, limit: FREE_LIMITS.conversationsPerMonth, plan };
}

// Free plan only — Pro and Premium both get unlimited chat. Counts this
// user's own messages sent since UTC midnight, regardless of which
// conversation they landed in (a cap on total usage, not on starting new
// threads — that's checkConversationQuota's job).
export async function checkChatMessageQuota(databases: Databases, userId: string): Promise<QuotaResult> {
  const plan = await getPlan(databases, userId);
  if (plan !== "free") return { allowed: true, plan };
  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);
  const result = await databases.listDocuments(DB_ID, COLLECTIONS.MESSAGES, [
    Query.equal("userId", userId),
    Query.equal("role", "user"),
    Query.greaterThanEqual("$createdAt", startOfDay.toISOString()),
    Query.limit(1),
  ]);
  return { allowed: result.total < FREE_LIMITS.chatMessagesPerDay, limit: FREE_LIMITS.chatMessagesPerDay, plan };
}
