import type { BillingCycle } from "./db";
import { USDC_DECIMALS } from "./subscriptionChain";

// Matches the prices already advertised on the landing page
// (src/components/landing/PricingSection.tsx). Keep these in sync if either
// changes.
export const PLANS = {
  free: { id: "free", label: "Free", priceMonthlyUsd: 0, priceAnnualUsd: 0 },
  pro: { id: "pro", label: "Pro", priceMonthlyUsd: 19, priceAnnualUsd: 180 },
  premium: { id: "premium", label: "Premium", priceMonthlyUsd: 39, priceAnnualUsd: 374 },
} as const;

export type PlanId = keyof typeof PLANS;

// Any plan a user can actually be subscribed to and pay for (excludes "free",
// which is the default state rather than something purchased).
export const PAID_PLAN_IDS = ["pro", "premium"] as const satisfies readonly PlanId[];
export type PaidPlanId = (typeof PAID_PLAN_IDS)[number];

export function isPaidPlanId(id: string): id is PaidPlanId {
  return (PAID_PLAN_IDS as readonly string[]).includes(id);
}

export function planPriceUsd(planId: PlanId, cycle: BillingCycle): number {
  const plan = PLANS[planId];
  return cycle === "annual" ? plan.priceAnnualUsd : plan.priceMonthlyUsd;
}

export function usdToUsdcBaseUnits(usd: number): bigint {
  return BigInt(Math.round(usd * 10 ** USDC_DECIMALS));
}

export function addBillingPeriod(from: Date, cycle: BillingCycle): Date {
  const d = new Date(from);
  const day = d.getUTCDate();
  if (cycle === "annual") d.setUTCFullYear(d.getUTCFullYear() + 1);
  else d.setUTCMonth(d.getUTCMonth() + 1);
  // setUTCMonth/FullYear roll into the following month when `day` doesn't
  // exist there (Jan 31 + 1 month -> "Mar 3"); clamp back to the last real
  // day of the intended month instead of silently drifting the renewal date.
  if (d.getUTCDate() !== day) d.setUTCDate(0);
  return d;
}
