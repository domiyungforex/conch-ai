import { clerkClient } from "@clerk/nextjs/server";
import { Query, type Databases } from "node-appwrite";
import { DB_ID, COLLECTIONS, type UserDoc, type AppwriteDoc } from "./db";
import { getEffectivePlan, isTesterUserId } from "./subscription";
import type { PlanId } from "./plans";

// Tier limits. Free-tier numbers no longer appear on the landing page
// (src/components/landing/PricingSection.tsx): non-tester free accounts are
// gated behind an upgrade via checkFeatureAccess, so these quotas only ever
// apply to legacy/edge paths, not real free users.
// Starter: 500 memories, 3 agents, 200 contexts, 5 projects.
// Pro: 2,000 memories, 10 agents, 1,000 contexts, 20 projects, unlimited conversations & chat.
// Premium: unlimited everything — every check below short-circuits for it.
export const FREE_LIMITS = {
  memories: 100,
  agents: 1,
  conversationsPerMonth: 50,
  chatMessagesPerDay: 20,
  contexts: 0,
  projects: 0,
};
export const STARTER_LIMITS = {
  memories: 500,
  agents: 3,
  contexts: 200,
  projects: 5,
};
export const PRO_LIMITS = {
  memories: 2000,
  agents: 10,
  contexts: 1000,
  projects: 20,
};

async function getUser(databases: Databases, userId: string): Promise<AppwriteDoc<UserDoc> | null> {
  try {
    return await databases.getDocument(DB_ID, COLLECTIONS.USERS, userId) as unknown as AppwriteDoc<UserDoc>;
  } catch {
    return null;
  }
}

// Resolves the email that drives plan logic for a user. Docs provisioned
// before the email field existed (or with a blank email) would otherwise
// silently defeat the tester override in subscription.ts. Falls back to the
// Clerk user's primary email and backfills the Appwrite doc so the fallback
// only runs once per legacy user. Fire-and-forget backfill: a failed write
// must never break the originating request.
export async function resolveUserEmail(
  databases: Databases,
  userId: string,
  user: AppwriteDoc<UserDoc> | null
): Promise<string | null> {
  const stored = user?.email?.trim();
  if (stored) return stored;

  let email: string | null = null;
  try {
    const clerkUser = await (await clerkClient()).users.getUser(userId);
    email = clerkUser.emailAddresses[0]?.emailAddress ?? null;
  } catch {
    return null;
  }

  if (email && user) {
    databases.updateDocument(DB_ID, COLLECTIONS.USERS, userId, { email }).catch(() => {});
  }
  return email;
}

// getEffectivePlan for a user whose email may be missing from the Appwrite
// doc. Used by every server-side plan chokepoint so the tester override in
// subscription.ts still fires for pre-email docs; a missing Clerk lookup
// falls back to the doc's (blank) email, i.e. a plain free user.
async function resolvePlan(
  databases: Databases,
  userId: string,
  user: AppwriteDoc<UserDoc> | null
): Promise<PlanId> {
  // The tester account is allowlisted by Clerk user ID, so no email on the
  // doc and no Clerk lookup is ever needed for it.
  if (isTesterUserId(userId)) return "premium";

  if (!user) {
    // No doc at all: only the tester override can still grant access, so
    // resolve the email instead of defaulting straight to "free".
    const email = await resolveUserEmail(databases, userId, null);
    return getEffectivePlan({ email: email ?? "", plan: "free", planExpiresAt: null });
  }
  if (user.email?.trim()) return getEffectivePlan(user);
  const email = await resolveUserEmail(databases, userId, user);
  return getEffectivePlan({ ...user, email: email ?? "" });
}

export async function getPlan(databases: Databases, userId: string): Promise<PlanId> {
  const user = await getUser(databases, userId);
  return resolvePlan(databases, userId, user);
}

// The feature-access gate: the tester account (dominionakinyele@gmail.com)
// has every feature unlocked, and paid subscribers keep theirs — everyone
// else must upgrade before using any feature. This is the single chokepoint
// every core route (chat, memory, agents, conversations, search, export)
// calls after auth; module routes are gated separately in moduleFlags.ts.
export async function checkFeatureAccess(
  databases: Databases,
  userId: string
): Promise<{ allowed: boolean; plan: PlanId }> {
  const plan = await getPlan(databases, userId);
  return { allowed: plan !== "free", plan };
}

// The controlled response every gated core route returns for a non-tester
// free user — never a generic 403, always the upgrade call to action.
export function upgradeRequiredResponse(): Response {
  return new Response(
    JSON.stringify({ error: "This feature requires Pro or Premium. Upgrade to unlock it.", code: "PLAN_REQUIRED" }),
    { status: 402 }
  );
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
  const user = await getUser(databases, userId);
  const plan = await resolvePlan(databases, userId, user);
  const grandfathered = plan === "pro" && user?.grandfatheredUnlimitedMemory === true;
  if (plan === "premium" || plan === "enterprise" || grandfathered) return { allowed: true, plan };
  let limit: number;
  if (plan === "pro") limit = PRO_LIMITS.memories;
  else if (plan === "starter") limit = STARTER_LIMITS.memories;
  else limit = FREE_LIMITS.memories;
  const result = await databases.listDocuments(DB_ID, COLLECTIONS.MEMORIES, [
    Query.equal("userId", userId), Query.equal("isArchived", false), Query.limit(1),
  ]);
  return { allowed: result.total < limit, limit, plan };
}

export async function checkAgentQuota(databases: Databases, userId: string): Promise<QuotaResult> {
  const plan = await getPlan(databases, userId);
  if (plan === "premium" || plan === "enterprise") return { allowed: true, plan };
  let limit: number;
  if (plan === "pro") limit = PRO_LIMITS.agents;
  else if (plan === "starter") limit = STARTER_LIMITS.agents;
  else limit = FREE_LIMITS.agents;
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

// Conch 2.0: Context Engine quotas
export async function checkContextQuota(databases: Databases, userId: string): Promise<QuotaResult> {
  const plan = await getPlan(databases, userId);
  if (plan === "premium" || plan === "enterprise") return { allowed: true, plan };
  let limit: number;
  if (plan === "pro") limit = PRO_LIMITS.contexts;
  else if (plan === "starter") limit = STARTER_LIMITS.contexts;
  else limit = FREE_LIMITS.contexts;
  const result = await databases.listDocuments(DB_ID, COLLECTIONS.CONTEXT_OBJECTS, [
    Query.equal("userId", userId),
    Query.notEqual("lifecycle", "deleted"),
    Query.limit(1),
  ]);
  return { allowed: result.total < limit, limit, plan };
}

export async function checkProjectQuota(databases: Databases, userId: string): Promise<QuotaResult> {
  const plan = await getPlan(databases, userId);
  if (plan === "premium" || plan === "enterprise") return { allowed: true, plan };
  let limit: number;
  if (plan === "pro") limit = PRO_LIMITS.projects;
  else if (plan === "starter") limit = STARTER_LIMITS.projects;
  else limit = FREE_LIMITS.projects;
  const result = await databases.listDocuments(DB_ID, COLLECTIONS.PROJECTS, [
    Query.equal("userId", userId),
    Query.notEqual("status", "archived"),
    Query.limit(1),
  ]);
  return { allowed: result.total < limit, limit, plan };
}
