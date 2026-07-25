import type { UserDoc } from "./db";
import { isPaidPlanId, type PlanId, type PaidPlanId } from "./plans";

export const GRACE_PERIOD_MS = 7 * 24 * 60 * 60 * 1000;

export type SubscriptionStatus = "active" | "grace" | "expired-to-free";

export function getSubscriptionStatus(
  user: Pick<UserDoc, "plan" | "planExpiresAt">,
  now: Date = new Date()
): SubscriptionStatus {
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
  user: Pick<UserDoc, "plan" | "planExpiresAt">,
  now: Date = new Date()
): PlanId {
  const status = getSubscriptionStatus(user, now);
  if (status === "expired-to-free") return "free";
  return user.plan as PaidPlanId;
}
