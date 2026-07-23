"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/components/ui/toaster";
import type { SubscriptionStatus } from "@/lib/subscription";
import type { PaymentDoc, AppwriteDoc, BillingCycle } from "@/lib/db";

interface SubscriptionData {
  status: SubscriptionStatus;
  plan: string;
  planExpiresAt: string | null;
  payments: AppwriteDoc<PaymentDoc>[];
}

async function fetchSubscription(): Promise<SubscriptionData> {
  const res = await fetch("/api/subscription");
  if (!res.ok) throw new Error("Failed to load subscription");
  return res.json();
}

async function confirmPayment(data: { txHash: string; billingCycle: BillingCycle }) {
  const res = await fetch("/api/subscription/confirm", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? "Failed to confirm payment");
  }
  return res.json();
}

export function useSubscription() {
  const qc = useQueryClient();
  const key = ["subscription"];

  const query = useQuery({ queryKey: key, queryFn: fetchSubscription, staleTime: 30_000 });

  const confirm = useMutation({
    mutationFn: confirmPayment,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: key });
      toast({ title: "Subscription active" });
    },
    onError: (err: Error) => toast({ title: "Payment couldn't be confirmed", description: err.message, variant: "destructive" }),
  });

  return { ...query, confirm };
}
