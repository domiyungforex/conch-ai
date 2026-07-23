import type { UserDoc } from "./db";

export const GRACE_PERIOD_MS = 7 * 24 * 60 * 60 * 1000;

export type SubscriptionStatus = "active" | "grace" | "expired-to-free";

export function getSubscriptionStatus(
  user: Pick<UserDoc, "plan" | "planExpiresAt">,
  now: Date = new Date()
): SubscriptionStatus {
  if (user.plan !== "pro" || !user.planExpiresAt) return "expired-to-free";
  const expiresAt = new Date(user.planExpiresAt);
  if (now < expiresAt) return "active";
  if (now.getTime() < expiresAt.getTime() + GRACE_PERIOD_MS) return "grace";
  return "expired-to-free";
}

// Grace still gets full Pro access — nag the user to renew, don't cut them off.
export function hasProAccess(status: SubscriptionStatus): boolean {
  return status === "active" || status === "grace";
}
