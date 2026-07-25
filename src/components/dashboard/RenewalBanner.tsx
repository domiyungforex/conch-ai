"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { PLANS, type PlanId } from "@/lib/plans";

const REMINDER_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

export function RenewalBanner() {
  const { data: sub } = useSubscription();
  if (!sub || sub.status === "expired-to-free" || !sub.planExpiresAt) return null;

  const expiresAt = new Date(sub.planExpiresAt);
  const withinReminderWindow = expiresAt.getTime() - Date.now() < REMINDER_WINDOW_MS;
  if (sub.status === "active" && !withinReminderWindow) return null;

  const overdue = sub.status === "grace";
  const planLabel = sub.plan in PLANS ? PLANS[sub.plan as PlanId].label : "plan";

  return (
    <div className={`flex items-center gap-3 px-4 py-2 text-sm ${overdue ? "bg-red-500/10 text-red-300" : "bg-amber-500/10 text-amber-300"}`}>
      <AlertTriangle className="w-4 h-4 shrink-0" />
      <span className="flex-1">
        {overdue
          ? `Your ${planLabel} renewal is overdue — renew now to keep your access.`
          : `Your ${planLabel} subscription renews on ${expiresAt.toLocaleDateString()}.`}
      </span>
      <Link href="/settings/billing" className="font-medium underline hover:no-underline shrink-0">
        Renew
      </Link>
    </div>
  );
}
