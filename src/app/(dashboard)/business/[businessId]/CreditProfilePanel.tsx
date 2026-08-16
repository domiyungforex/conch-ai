"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ShieldCheck, CheckCircle2 } from "lucide-react";
import { GlassCard } from "@/components/shared/GlassCard";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toaster";
import type { AppwriteDoc, CreditProfileDoc } from "@/lib/db";

async function fetchProfile(businessId: string): Promise<AppwriteDoc<CreditProfileDoc> | null> {
  const res = await fetch(`/api/credit/${businessId}`);
  if (!res.ok) throw new Error("Failed to load");
  const data = await res.json();
  return data.item;
}

export function CreditProfilePanel({ businessId }: { businessId: string }) {
  const qc = useQueryClient();
  const key = ["credit-profile", businessId];
  const { data: profile, isLoading } = useQuery({ queryKey: key, queryFn: () => fetchProfile(businessId) });

  const consent = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/credit/${businessId}/consent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consentGiven: true }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? "Failed to opt in");
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: key });
      toast({ title: "Opted in" });
    },
    onError: (err: Error) => toast({ title: "Couldn't opt in", description: err.message, variant: "destructive" }),
  });

  if (isLoading) return <div className="h-24 animate-pulse bg-white/5 rounded-xl" />;

  return (
    <GlassCard className="p-6">
      <h2 className="text-base font-semibold text-white mb-1">Credit Profile</h2>
      <p className="text-xs text-slate-400 mb-4">
        An opt-in summary of this business&apos;s own financial history. Never a credit score, never used for a lending
        decision. This is not a credit score.
      </p>

      {profile ? (
        <div className="flex items-start gap-3 p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm text-emerald-200">Opted in {new Date(profile.consentAt ?? profile.$createdAt).toLocaleDateString()}</p>
            <p className="text-xs text-slate-400 mt-1">{profile.disclaimer}</p>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-3 p-4 rounded-xl border border-white/8 bg-white/5">
          <ShieldCheck className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-white">Not opted in</p>
            <p className="text-xs text-slate-400 mt-0.5 mb-3">
              Opt in to let Conch start organizing this business&apos;s own financial data for you. No score is
              generated — that layer doesn&apos;t exist yet.
            </p>
            <Button size="sm" className="gap-1.5 h-8 text-xs" disabled={consent.isPending} onClick={() => consent.mutate()}>
              {consent.isPending && <LoadingSpinner size="sm" />}
              Opt in
            </Button>
          </div>
        </div>
      )}
    </GlassCard>
  );
}
