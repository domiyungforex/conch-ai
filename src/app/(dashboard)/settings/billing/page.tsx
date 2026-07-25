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
import { planPriceUsd, usdToUsdcBaseUnits } from "@/lib/plans";
import { USDC_ADDRESS_BASE } from "@/lib/subscriptionChain";
import type { BillingCycle } from "@/lib/db";

const TREASURY = process.env.NEXT_PUBLIC_SUBSCRIPTION_TREASURY_ADDRESS_BASE as `0x${string}` | undefined;

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}

export default function BillingPage() {
  const [cycle, setCycle] = useState<BillingCycle>("monthly");
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
      confirm.mutate({ txHash: pendingHash, billingCycle: cycle });
      setPendingHash(undefined);
    }
    if (mineError && pendingHash) {
      toast({ title: "Transaction failed", description: "The transfer didn't confirm on-chain.", variant: "destructive" });
      setPendingHash(undefined);
    }
  }, [mined, mineError, pendingHash, cycle, confirm]);

  const handleUpgrade = async () => {
    if (!TREASURY) {
      toast({ title: "Not available yet", description: "Subscription payments aren't configured yet.", variant: "destructive" });
      return;
    }
    if (!wallet) return;
    if (address?.toLowerCase() !== wallet.address.toLowerCase()) {
      toast({
        title: "Wrong wallet connected",
        description: `Switch to ${wallet.address.slice(0, 6)}…${wallet.address.slice(-4)} — the wallet linked to your account — before paying.`,
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
      const amount = usdToUsdcBaseUnits(planPriceUsd("pro", cycle));
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
  const price = planPriceUsd("pro", cycle);

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
                  {isPro ? "Pro" : "Free"}
                </Badge>
                {status === "grace" && (
                  <Badge className="bg-amber-500/15 text-amber-300 border-amber-500/30">Renewal overdue</Badge>
                )}
                {isPro && sub?.planExpiresAt && (
                  <span className="text-xs text-slate-400">
                    {status === "grace" ? "Access ends soon — renews " : "Renews "}
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
            {isPro ? "Renew Pro" : "Upgrade to Pro"}
          </h2>
          <Tabs value={cycle} onValueChange={(v) => setCycle(v as BillingCycle)}>
            <TabsList className="glass border border-white/10 h-9">
              <TabsTrigger value="monthly" className="text-xs px-3 data-[state=active]:bg-coral-600/30 data-[state=active]:text-coral-200">Monthly</TabsTrigger>
              <TabsTrigger value="annual" className="text-xs px-3 data-[state=active]:bg-coral-600/30 data-[state=active]:text-coral-200">Annual</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="flex items-baseline gap-1 mb-6">
          <span className="text-3xl font-bold text-white">${price}</span>
          <span className="text-sm text-slate-400">/ {cycle === "annual" ? "year" : "month"}</span>
        </div>

        {!isConnected ? (
          <div className="flex items-center justify-between gap-3 p-4 bg-white/5 rounded-xl border border-white/8 flex-wrap">
            <div className="flex items-start gap-3">
              <WalletIcon className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm text-white">Connect a wallet to subscribe</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Payment is a direct USDC transfer on Base from your own wallet — connect right here to pay.
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
          <div className="flex items-start gap-3 p-4 bg-amber-500/10 rounded-xl border border-amber-500/20">
            <WalletIcon className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm text-amber-200">Couldn&apos;t verify this wallet.</p>
              {verify.isError && <p className="text-xs text-amber-300/80 mt-0.5">Try connecting again and approve the signature request.</p>}
            </div>
          </div>
        ) : address?.toLowerCase() !== wallet.address.toLowerCase() ? (
          <div className="flex items-start gap-3 p-4 bg-amber-500/10 rounded-xl border border-amber-500/20">
            <WalletIcon className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
            <p className="text-sm text-amber-200">
              Your connected wallet doesn&apos;t match the one linked to your account
              ({wallet.address.slice(0, 6)}…{wallet.address.slice(-4)}). Switch wallets in your extension before paying.
            </p>
          </div>
        ) : (
          <Button onClick={handleUpgrade} disabled={awaitingChain || confirm.isPending} className="gap-2">
            {(awaitingChain || confirm.isPending) && <LoadingSpinner size="sm" />}
            {sending ? "Confirm in your wallet…" : awaitingChain ? "Waiting for confirmation…" : confirm.isPending ? "Activating…" : isPro ? "Renew now" : "Upgrade to Pro"}
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
                    <p className="text-white capitalize">Pro · {p.billingCycle}</p>
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
