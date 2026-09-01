"use client";

import Link from "next/link";
import { Lock, Sparkles } from "lucide-react";
import { GlassCard } from "@/components/shared/GlassCard";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/hooks/useSubscription";
import { hasProAccess } from "@/lib/subscription";

// Gates a feature page behind a paid plan. The tester account
// (dominionakinyele@gmail.com) resolves to an "active" subscription status
// server-side, so it always passes; every other free account sees the
// upgrade prompt instead of the feature. While the subscription is loading
// or unavailable, children render (the server enforces the real gate).
export function UpgradeGate({ children }: { children: React.ReactNode }) {
  const { data: sub, isLoading, isError } = useSubscription();

  if (isLoading || isError || !sub || hasProAccess(sub.status)) {
    return <>{children}</>;
  }

  return (
    <div className="flex items-center justify-center py-16">
      <GlassCard className="max-w-lg w-full p-8 text-center">
        <div className="w-14 h-14 rounded-2xl bg-coral-500/15 border border-coral-500/30 flex items-center justify-center mx-auto mb-5">
          <Lock className="w-7 h-7 text-coral-400" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">This feature requires Pro or Premium</h2>
        <p className="text-sm text-slate-500 mb-6 leading-relaxed">
          Upgrade to unlock chat, memory, agents, and every memory space. Your memories stay yours
          and everything keeps working after you upgrade.
        </p>
        <Button asChild className="gap-2 w-full sm:w-auto">
          <Link href="/settings/billing">
            <Sparkles className="w-4 h-4" /> Upgrade
          </Link>
        </Button>
      </GlassCard>
    </div>
  );
}
