"use client";

import { useEffect, useState } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useSwitchChain } from "wagmi";
import { base } from "wagmi/chains";
import { erc20Abi, BaseError } from "viem";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { CheckCircle2, ExternalLink, Wallet as WalletIcon } from "lucide-react";
import { GlassCard } from "@/components/shared/GlassCard";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toaster";
import { useSubscription } from "@/hooks/useSubscription";
import { useWalletLink } from "@/hooks/useWalletLink";
import { hasProAccess } from "@/lib/subscription";
import { PLANS, planPriceUsd, usdToUsdcBaseUnits, PAID_PLAN_IDS, type PaidPlanId, type PlanId } from "@/lib/plans";
import { USDC_ADDRESS_BASE } from "@/lib/subscriptionChain";
import { cn } from "@/lib/utils";
import type { BillingCycle } from "@/lib/db";

const TREASURY = process.env.NEXT_PUBLIC_SUBSCRIPTION_TREASURY_ADDRESS_BASE as `0x${string}` | undefined;

const PLAN_BLURB: Record<PaidPlanId, string> = {
  starter: "500 memories, 3 agents, 200 contexts, 5 projects",
  pro: "2,000 memories, 10 agents, 1,000 contexts, unlimited chat",
  premium: "Unlimited memories, agents, contexts & chat. Everything",
  enterprise: "Unlimited everything + priority support + custom integrations",
};

function formatDate(iso: string | null) {
  if (!iso) return "N/A";
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}

export default function BillingPage() {
  const [cycle, setCycle] = useState<BillingCycle>("monthly");
  const [plan, setPlan] = useState<PaidPlanId>("pro");
  const { isConnected, address, chainId } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const { wallet, isLoading: walletLoading, signing, verify } = useWalletLink();
  const { data: sub, isLoading: subLoading, isError: subError, confirm } = useSubscription();

  const { writeContractAsync, isPending: sending } = useWriteContract();
  const [pendingHash, setPendingHash] = useState<`0x${string}` | undefined>(undefined);
  const { isSuccess: mined, isError: mineError } = useWaitForTransactionReceipt({ hash: pendingHash });

  // Once the transfer is mined, hand the hash to the server for verification.
  // The server is the only thing that ever activates the subscription — this
  // just tells it which transaction to go check.
  useEffect(() => {
    if (mined && pendingHash) {
      confirm.mutate({ txHash: pendingHash, billingCycle: cycle, plan });
      setPendingHash(undefined);
    }
    if (mineError && pendingHash) {
      toast({ title: "Transaction failed", description: "The transfer didn't confirm on-chain.", variant: "destructive" });
      setPendingHash(undefined);
    }
  }, [mined, mineError, pendingHash, cycle, plan, confirm]);

  const handleUpgrade = async () => {
    if (!TREASURY) {
      toast({ title: "Not available yet", description: "Subscription payments aren't configured yet.", variant: "destructive" });
      return;
    }
    if (!wallet) return;
    if (address?.toLowerCase() !== wallet.address.toLowerCase()) {
      toast({
        title: "Wrong wallet connected",
        description: `Switch to ${wallet.address.slice(0, 6)}…${wallet.address.slice(-4)}, the wallet linked to your account, before paying.`,
        variant: "destructive",
      });
      return;
    }
    try {
      // Most wallets default to Ethereum mainnet. Passing chainId alone to
      // writeContractAsync doesn't prompt a switch — it just rejects the
      // mismatch outright — so request the switch explicitly first and let
      // the wallet's own network-switch prompt handle it.
      if (chainId !== base.id) {
        await switchChainAsync({ chainId: base.id });
      }
      const amount = usdToUsdcBaseUnits(planPriceUsd(plan, cycle));
      const hash = await writeContractAsync({
        address: USDC_ADDRESS_BASE,
        abi: erc20Abi,
        functionName: "transfer",
        args: [TREASURY, amount],
        chainId: base.id,
        // A plain ERC-20 transfer costs well under 100k gas. Set this
        // explicitly rather than relying on automatic estimation — right
        // after a chain switch, estimation against the wallet's not-yet-
        // settled provider state can fall back to a wildly oversized
        // default (observed: 140,000,000, over 5x Base's 25M per-tx cap).
        gas: BigInt(100_000),
      });
      setPendingHash(hash);
    } catch (err) {
      const rejected = err instanceof BaseError && err.walk((e) => e instanceof Error && e.name === "UserRejectedRequestError");
      if (rejected) {
        toast({ title: "Cancelled" });
      } else {
        const message = err instanceof BaseError ? err.shortMessage : "Could not open your wallet to send the payment.";
        toast({ title: "Payment couldn't be started", description: message, variant: "destructive" });
      }
    }
  };

  const awaitingChain = sending || (!!pendingHash && !mined && !mineError);
  const status = sub?.status;
  const isPro = status ? hasProAccess(status) : false;
  const currentPlanId: PlanId = isPro && sub?.plan && sub.plan in PLANS ? (sub.plan as PlanId) : "free";
  const currentPlanLabel = PLANS[currentPlanId].label;
  const isRenewal = isPro && currentPlanId === plan;

  return (
    <div className="space-y-6">
      <GlassCard className="p-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-base font-semibold text-white mb-1">Current Plan</h2>
            {subLoading ? (
              <Skeleton className="h-5 w-32 rounded bg-white/5" />
            ) : subError ? (
              <p className="text-sm text-red-400">Couldn&apos;t load your subscription.</p>
            ) : (
              <div className="flex items-center gap-2">
                <Badge className={isPro ? "bg-coral-500/15 text-coral-300 border-coral-500/30" : "bg-slate-500/15 text-slate-300 border-slate-500/30"}>
                  {currentPlanLabel}
                </Badge>
                {status === "grace" && (
                  <Badge className="bg-amber-500/15 text-amber-300 border-amber-500/30">Renewal overdue</Badge>
                )}
                {isPro && sub?.planExpiresAt && (
                  <span className="text-xs text-slate-400">
                    {status === "grace" ? "Access ends soon. Renews " : "Renews "}
                    {formatDate(sub.planExpiresAt)}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </GlassCard>

      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <h2 className="text-base font-semibold text-white">
            {isRenewal ? `Renew ${currentPlanLabel}` : currentPlanId === "free" ? "Upgrade your plan" : "Change your plan"}
          </h2>
          <Tabs value={cycle} onValueChange={(v) => setCycle(v as BillingCycle)}>
            <TabsList className="glass border border-white/10 h-9">
              <TabsTrigger value="monthly" className="text-xs px-3 data-[state=active]:bg-coral-600/30 data-[state=active]:text-coral-200">Monthly</TabsTrigger>
              <TabsTrigger value="annual" className="text-xs px-3 data-[state=active]:bg-coral-600/30 data-[state=active]:text-coral-200">Annual</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {PAID_PLAN_IDS.map((id) => {
            const active = plan === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setPlan(id)}
                className={cn(
                  "text-left p-4 rounded-xl border transition-colors",
                  active ? "border-coral-500/50 bg-coral-500/10" : "border-white/8 bg-white/5 hover:bg-white/8"
                )}
              >
                <div className="flex items-center justify-between mb-1 gap-2">
                  <span className="text-sm font-semibold text-white">{PLANS[id].label}</span>
                  {currentPlanId === id && isPro && (
                    <Badge className="text-xs bg-emerald-500/15 text-emerald-300 border-emerald-500/30">Current</Badge>
                  )}
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-white">${planPriceUsd(id, cycle)}</span>
                  <span className="text-xs text-slate-400">/ {cycle === "annual" ? "year" : "month"}</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">{PLAN_BLURB[id]}</p>
              </button>
            );
          })}
        </div>

        {!isConnected ? (
          <div className="flex items-center justify-between gap-3 p-4 bg-white/5 rounded-xl border border-white/8 flex-wrap">
            <div className="flex items-start gap-3">
              <WalletIcon className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm text-white">Connect a wallet to subscribe</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Payment is a direct USDC transfer on Base from your own wallet. Connect right here to pay.
                </p>
              </div>
            </div>
            <ConnectButton showBalance={false} chainStatus="none" accountStatus="address" />
          </div>
        ) : walletLoading || signing || verify.isPending ? (
          <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl border border-white/8 text-sm text-slate-300">
            <LoadingSpinner size="sm" />
            {signing ? "Sign the message in your wallet to verify it…" : verify.isPending ? "Verifying signature…" : "Checking your wallet…"}
          </div>
        ) : !wallet ? (
          <div className="flex items-center justify-between gap-3 p-4 bg-amber-500/10 rounded-xl border border-amber-500/20 flex-wrap">
            <div className="flex items-start gap-3">
              <WalletIcon className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm text-amber-200">Couldn&apos;t verify this wallet.</p>
                {verify.isError && <p className="text-xs text-amber-300/80 mt-0.5">Connect again and approve the signature request.</p>}
              </div>
            </div>
            <ConnectButton showBalance={false} chainStatus="none" accountStatus="address" />
          </div>
        ) : address?.toLowerCase() !== wallet.address.toLowerCase() ? (
          <div className="flex items-center justify-between gap-3 p-4 bg-amber-500/10 rounded-xl border border-amber-500/20 flex-wrap">
            <div className="flex items-start gap-3">
              <WalletIcon className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
              <p className="text-sm text-amber-200">
                The connected wallet doesn&apos;t match the one linked to your account
                ({wallet.address.slice(0, 6)}…{wallet.address.slice(-4)}). Reconnect with that wallet to pay.
              </p>
            </div>
            <ConnectButton showBalance={false} chainStatus="none" accountStatus="address" />
          </div>
        ) : (
          <Button onClick={handleUpgrade} disabled={awaitingChain || confirm.isPending} className="gap-2">
            {(awaitingChain || confirm.isPending) && <LoadingSpinner size="sm" />}
            {sending
              ? "Confirm in your wallet…"
              : awaitingChain
              ? "Waiting for confirmation…"
              : confirm.isPending
              ? "Activating…"
              : isRenewal
              ? "Renew now"
              : currentPlanId === "free"
              ? `Subscribe to ${PLANS[plan].label}`
              : `Switch to ${PLANS[plan].label}`}
          </Button>
        )}
      </GlassCard>

      <GlassCard className="p-6">
        <h2 className="text-base font-semibold text-white mb-4">Payment History</h2>
        {subLoading ? (
          <Skeleton className="h-16 rounded-lg bg-white/5" />
        ) : !sub?.payments?.length ? (
          <p className="text-sm text-slate-400">No payments yet.</p>
        ) : (
          <div className="space-y-2">
            {sub.payments.map((p) => (
              <div key={p.$id} className="flex items-center justify-between gap-3 p-3 bg-white/5 rounded-xl border border-white/8 text-sm">
                <div className="flex items-center gap-2 min-w-0">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-white capitalize">
                      {p.plan in PLANS ? PLANS[p.plan as PlanId].label : p.plan} · {p.billingCycle}
                    </p>
                    <p className="text-xs text-slate-500">{formatDate(p.confirmedAt)}</p>
                  </div>
                </div>
                <a
                  href={`https://basescan.org/tx/${p.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-white shrink-0"
                >
                  ${(p.amountUsdcBaseUnits / 10 ** 6).toFixed(2)} <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
}
