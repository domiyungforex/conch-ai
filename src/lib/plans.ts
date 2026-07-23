import type { BillingCycle } from "./db";
import { USDC_DECIMALS } from "./subscriptionChain";

// Matches the prices already advertised on the landing page
// (src/components/landing/PricingSection.tsx) — $19/mo, or $15/mo billed
// annually ($180/yr). Keep these in sync if either changes.
export const PLANS = {
  free: { id: "free", label: "Free", priceMonthlyUsd: 0, priceAnnualUsd: 0 },
  pro: { id: "pro", label: "Pro", priceMonthlyUsd: 19, priceAnnualUsd: 180 },
} as const;

export type PlanId = keyof typeof PLANS;

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
