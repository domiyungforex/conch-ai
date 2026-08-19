import type { UserDoc } from "./db";
import { isPaidPlanId, type PlanId, type PaidPlanId } from "./plans";

export const GRACE_PERIOD_MS = 7 * 24 * 60 * 60 * 1000;

// The operator's testing account. All features — old and new — are unlocked
// for this account regardless of plan, while every other account must upgrade
// before it can use them (see checkFeatureAccess in planLimits.ts and the
// free-plan gate in moduleFlags.ts).
//
// Matched by both the Clerk email and the Clerk user ID (looked up via a
// read-only Clerk/Appwrite diagnostic). The user-ID match is authoritative:
// it keeps the override working even if the stored email is blank, stale, or
// ever changes — the email match is kept as a secondary belt-and-suspenders.
const TESTER_EMAILS = ["dominionakinyele@gmail.com"];
const TESTER_USER_IDS = ["user_3Do3FHfevXKyXwIBmbR9fJXJ4tZ"];

export function isTesterEmail(email: string | null | undefined): boolean {
  return !!email && TESTER_EMAILS.includes(email.toLowerCase());
}

export function isTesterUserId(userId: string | null | undefined): boolean {
  return !!userId && TESTER_USER_IDS.includes(userId);
}

export type SubscriptionStatus = "active" | "grace" | "expired-to-free";

export function getSubscriptionStatus(
  user: Pick<UserDoc, "email" | "plan" | "planExpiresAt">,
  now: Date = new Date()
): SubscriptionStatus {
  if (isTesterEmail(user.email)) return "active";
  if (!isPaidPlanId(user.plan) || !user.planExpiresAt) return "expired-to-free";
  const expiresAt = new Date(user.planExpiresAt);
  if (now < expiresAt) return "active";
  if (now.getTime() < expiresAt.getTime() + GRACE_PERIOD_MS) return "grace";
  return "expired-to-free";
}

// Grace still gets full paid-tier access — nag the user to renew, don't cut them off.
export function hasProAccess(status: SubscriptionStatus): boolean {
  return status === "active" || status === "grace";
}

// The plan tier that should actually gate features right now — folds in
// grace (still gets the paid tier) and expiry (falls back to free), so
// callers never have to re-derive this from raw plan + planExpiresAt.
export function getEffectivePlan(
  user: Pick<UserDoc, "email" | "plan" | "planExpiresAt">,
  now: Date = new Date()
): PlanId {
  if (isTesterEmail(user.email)) return "premium";
  const status = getSubscriptionStatus(user, now);
  if (status === "expired-to-free") return "free";
  return user.plan as PaidPlanId;
}

// Helper to check if a plan has context engine access
export function hasContextAccess(plan: PlanId): boolean {
  return plan === "starter" || plan === "pro" || plan === "premium" || plan === "enterprise";
}
