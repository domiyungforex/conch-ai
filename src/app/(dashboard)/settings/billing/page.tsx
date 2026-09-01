"use client";

import { useEffect, useState } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useSwitchChain } from "wagmi";
import { base } from "wagmi/chains";
import { erc20Abi, BaseError } from "viem";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import {
  CheckCircle2,
  ExternalLink,
  Wallet as WalletIcon,
  Copy,
  WifiOff,
  Clock,
  XCircle,
  Shield,
  AlertTriangle,
} from "lucide-react";
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
import {
  PLANS,
  planPriceUsd,
  usdToUsdcBaseUnits,
  PAID_PLAN_IDS,
  type PaidPlanId,
  type PlanId,
} from "@/lib/plans";
import { USDC_ADDRESS_BASE } from "@/lib/subscriptionChain";
import {
  TREASURY_ADDRESS,
  getBlockExplorerTxUrl,
} from "@/lib/chainConfig";
import { cn } from "@/lib/utils";
import type { BillingCycle, PaymentState } from "@/lib/db";

const PLAN_BLURB: Record<PaidPlanId, string> = {
  starter: "500 memories, 3 agents, 200 contexts, 5 projects",
  pro: "2,000 memories, 10 agents, 1,000 contexts, unlimited chat",
  premium: "Unlimited memories, agents, contexts & chat. Everything",
  enterprise: "Unlimited everything + priority support + custom integrations",
};

function formatDate(iso: string | null) {
  if (!iso) return "N/A";
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function truncateAddress(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function truncateHash(hash: string) {
  return `${hash.slice(0, 10)}…${hash.slice(-8)}`;
}

function getStateIcon(state: PaymentState) {
  switch (state) {
    case "CONFIRMED":
      return <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />;
    case "PENDING":
    case "INITIATED":
    case "CONFIRMING":
      return <Clock className="w-4 h-4 text-amber-400 shrink-0" />;
    case "FAILED":
    case "REJECTED":
    case "EXPIRED":
      return <XCircle className="w-4 h-4 text-red-400 shrink-0" />;
    default:
      return <Clock className="w-4 h-4 text-slate-400 shrink-0" />;
  }
}

function getStateLabel(state: PaymentState) {
  switch (state) {
    case "INITIATED":
      return "Initiated";
    case "PENDING":
      return "Pending";
    case "CONFIRMING":
      return "Confirming";
    case "CONFIRMED":
      return "Confirmed";
    case "FAILED":
      return "Failed";
    case "EXPIRED":
      return "Expired";
    case "REFUNDED":
      return "Refunded";
    case "REJECTED":
      return "Rejected";
    default:
      return state;
  }
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
  const [paymentStep, setPaymentStep] = useState<string | null>(null);
  const { isSuccess: mined, isError: mineError } = useWaitForTransactionReceipt({ hash: pendingHash });

  // Once the transfer is mined, hand the hash to the server for verification.
  useEffect(() => {
    if (mined && pendingHash) {
      setPaymentStep("verifying");
      confirm.mutate(
        { txHash: pendingHash, billingCycle: cycle, plan },
        {
          onSuccess: () => {
            setPaymentStep("activated");
            setPendingHash(undefined);
          },
          onError: () => {
            setPaymentStep("failed");
            setPendingHash(undefined);
          },
        }
      );
    }
    if (mineError && pendingHash) {
      setPaymentStep("failed");
      toast({
        title: "Transaction failed",
        description: "The transfer didn't confirm on-chain.",
        variant: "destructive",
      });
      setPendingHash(undefined);
    }
  }, [mined, mineError, pendingHash, cycle, plan, confirm]);

  const handleUpgrade = async () => {
    if (!TREASURY_ADDRESS || TREASURY_ADDRESS === "0x0000000000000000000000000000000000000000") {
      toast({
        title: "Not available yet",
        description: "Subscription payments aren't configured yet.",
        variant: "destructive",
      });
      return;
    }
    if (!wallet) return;
    if (address?.toLowerCase() !== wallet.address.toLowerCase()) {
      toast({
        title: "Wrong wallet connected",
        description: `Switch to ${truncateAddress(wallet.address)}, the wallet linked to your account, before paying.`,
        variant: "destructive",
      });
      return;
    }

    setPaymentStep("confirming");

    try {
      if (chainId !== base.id) {
        setPaymentStep("switching-network");
        await switchChainAsync({ chainId: base.id });
      }

      setPaymentStep("sending");
      const amount = usdToUsdcBaseUnits(planPriceUsd(plan, cycle));
      const hash = await writeContractAsync({
        address: USDC_ADDRESS_BASE,
        abi: erc20Abi,
        functionName: "transfer",
        args: [TREASURY_ADDRESS, amount],
        chainId: base.id,
        gas: BigInt(100_000),
      });

      setPendingHash(hash);
      setPaymentStep("pending");
    } catch (err) {
      const rejected =
        err instanceof BaseError &&
        err.walk(
          (e) => e instanceof Error && e.name === "UserRejectedRequestError"
        );
      if (rejected) {
        toast({ title: "Cancelled" });
        setPaymentStep(null);
      } else {
        const message =
          err instanceof BaseError
            ? err.shortMessage
            : "Could not open your wallet to send the payment.";
        toast({
          title: "Payment couldn't be started",
          description: message,
          variant: "destructive",
        });
        setPaymentStep("failed");
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
    <div className="space-y-4 sm:space-y-6">
      {/* ── Current Plan Card ──────────────────────────────────────────── */}
      <GlassCard className="p-4 sm:p-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-white mb-1">Current Plan</h2>
            {subLoading ? (
              <Skeleton className="h-5 w-32 rounded bg-white/5" />
            ) : subError ? (
              <p className="text-sm text-red-400">Couldn&apos;t load your subscription.</p>
            ) : (
              <div className="flex items-center gap-2 flex-wrap">
                <Badge
                  className={
                    isPro
                      ? "bg-coral-500/15 text-coral-300 border-coral-500/30"
                      : "bg-slate-500/15 text-slate-300 border-slate-500/30"
                  }
                >
                  {currentPlanLabel}
                </Badge>
                {status === "grace" && (
                  <Badge className="bg-amber-500/15 text-amber-300 border-amber-500/30">
                    Renewal overdue
                  </Badge>
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

      {/* ── Wallet Status Card ─────────────────────────────────────────── */}
      <GlassCard className="p-4 sm:p-6">
        <h2 className="text-base font-semibold text-white mb-3">Wallet</h2>
        {walletLoading || signing || verify.isPending ? (
          <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/8 text-sm text-slate-300">
            <LoadingSpinner size="sm" />
            <span className="text-xs sm:text-sm">
              {signing ? "Signing…" : verify.isPending ? "Verifying…" : "Loading…"}
            </span>
          </div>
        ) : wallet ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/8">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-linear-to-br from-coral-600 to-gold-600 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <code className="text-xs sm:text-sm font-mono text-white">
                    {truncateAddress(wallet.address)}
                  </code>
                  <Badge className="text-[10px] sm:text-xs bg-emerald-500/15 text-emerald-300 border-emerald-500/30">
                    Verified
                  </Badge>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Base · Linked {wallet.verifiedAt ? formatDate(wallet.verifiedAt) : ""}
                </p>
              </div>
              <CopyButton address={wallet.address} />
            </div>

            {/* Reconnect banner if disconnected */}
            {!isConnected && (
              <div className="flex items-center justify-between gap-3 p-3 bg-amber-500/10 rounded-xl border border-amber-500/20 flex-wrap">
                <div className="flex items-center gap-2 text-xs text-amber-200">
                  <WifiOff className="w-3.5 h-3.5 shrink-0" />
                  <span>Not connected in this browser</span>
                </div>
                <ConnectButton showBalance={false} chainStatus="none" accountStatus="address" />
              </div>
            )}

            {/* Wrong wallet warning */}
            {isConnected && address && wallet && address.toLowerCase() !== wallet.address.toLowerCase() && (
              <div className="flex items-center gap-2 p-3 bg-amber-500/10 rounded-xl border border-amber-500/20 text-xs text-amber-200 flex-wrap">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>
                  Connected wallet doesn&apos;t match linked wallet ({truncateAddress(wallet.address)}).
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 bg-white/5 rounded-xl border border-white/8">
            <div className="flex items-start gap-3">
              <WalletIcon className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm text-white">No wallet linked</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Connect and sign to link your wallet for payments.
                </p>
              </div>
            </div>
            <ConnectButton showBalance={false} chainStatus="none" accountStatus="address" />
          </div>
        )}
      </GlassCard>

      {/* ── Plan Selection + Payment ───────────────────────────────────── */}
      <GlassCard className="p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4 sm:mb-6 flex-wrap gap-3">
          <h2 className="text-base font-semibold text-white">
            {isRenewal ? `Renew ${currentPlanLabel}` : currentPlanId === "free" ? "Upgrade your plan" : "Change your plan"}
          </h2>
          <Tabs value={cycle} onValueChange={(v) => setCycle(v as BillingCycle)}>
            <TabsList className="glass border border-white/10 h-9">
              <TabsTrigger
                value="monthly"
                className="text-xs px-3 data-[state=active]:bg-coral-600/30 data-[state=active]:text-coral-200"
              >
                Monthly
              </TabsTrigger>
              <TabsTrigger
                value="annual"
                className="text-xs px-3 data-[state=active]:bg-coral-600/30 data-[state=active]:text-coral-200"
              >
                Annual
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Plan cards — 1 col on mobile, 2 on sm+ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {PAID_PLAN_IDS.map((id) => {
            const active = plan === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setPlan(id)}
                className={cn(
                  "text-left p-3 sm:p-4 rounded-xl border transition-colors",
                  active
                    ? "border-coral-500/50 bg-coral-500/10"
                    : "border-white/8 bg-white/5 hover:bg-white/8"
                )}
              >
                <div className="flex items-center justify-between mb-1 gap-2">
                  <span className="text-sm font-semibold text-white">{PLANS[id].label}</span>
                  {currentPlanId === id && isPro && (
                    <Badge className="text-xs bg-emerald-500/15 text-emerald-300 border-emerald-500/30">
                      Current
                    </Badge>
                  )}
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl sm:text-2xl font-bold text-white">
                    ${planPriceUsd(id, cycle)}
                  </span>
                  <span className="text-xs text-slate-400">/ {cycle === "annual" ? "year" : "month"}</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">{PLAN_BLURB[id]}</p>
              </button>
            );
          })}
        </div>

        {/* Payment flow */}
        {paymentStep && paymentStep !== "activated" && paymentStep !== "failed" ? (
          <PaymentStepIndicator step={paymentStep} />
        ) : !isConnected ? (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 sm:p-4 bg-white/5 rounded-xl border border-white/8">
            <div className="flex items-start gap-3">
              <WalletIcon className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm text-white">Connect a wallet to subscribe</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Payment is a direct USDC transfer on Base from your own wallet.
                </p>
              </div>
            </div>
            <ConnectButton showBalance={false} chainStatus="none" accountStatus="address" />
          </div>
        ) : !wallet ? (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 sm:p-4 bg-amber-500/10 rounded-xl border border-amber-500/20">
            <div className="flex items-start gap-3">
              <WalletIcon className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm text-amber-200">Link your wallet first</p>
                {verify.isError && (
                  <p className="text-xs text-amber-300/80 mt-0.5">Verification failed. Try again.</p>
                )}
              </div>
            </div>
            <ConnectButton showBalance={false} chainStatus="none" accountStatus="address" />
          </div>
        ) : address?.toLowerCase() !== wallet.address.toLowerCase() ? (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 sm:p-4 bg-amber-500/10 rounded-xl border border-amber-500/20">
            <div className="flex items-start gap-3">
              <WalletIcon className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
              <p className="text-sm text-amber-200">
                Switch to {truncateAddress(wallet.address)} to pay.
              </p>
            </div>
            <ConnectButton showBalance={false} chainStatus="none" accountStatus="address" />
          </div>
        ) : paymentStep === "activated" ? (
          <div className="flex items-center gap-3 p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <p className="text-sm font-medium text-emerald-300">Payment verified — {PLANS[plan].label} activated!</p>
              <p className="text-xs text-emerald-400/80 mt-0.5">
                Your subscription is now active. Enjoy Conch Pro features.
              </p>
            </div>
          </div>
        ) : (
          <Button onClick={handleUpgrade} disabled={awaitingChain || confirm.isPending} className="gap-2 w-full sm:w-auto">
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

      {/* ── Payment History ────────────────────────────────────────────── */}
      <GlassCard className="p-4 sm:p-6">
        <h2 className="text-base font-semibold text-white mb-4">Payment History</h2>
        {subLoading ? (
          <Skeleton className="h-16 rounded-lg bg-white/5" />
        ) : !sub?.payments?.length ? (
          <p className="text-sm text-slate-400">No payments yet.</p>
        ) : (
          <div className="space-y-2">
            {sub.payments.map((p) => (
              <div
                key={p.$id}
                className="flex items-center justify-between gap-3 p-3 bg-white/5 rounded-xl border border-white/8 text-sm"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {getStateIcon(p.paymentState ?? "CONFIRMED")}
                  <div className="min-w-0">
                    <p className="text-white capitalize text-xs sm:text-sm">
                      {p.plan in PLANS ? PLANS[p.plan as PlanId].label : p.plan} · {p.billingCycle}
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-[11px] text-slate-500">{formatDate(p.confirmedAt)}</p>
                      {p.paymentState && p.paymentState !== "CONFIRMED" && (
                        <Badge className="text-[10px] bg-white/5 text-slate-400 border-white/10">
                          {getStateLabel(p.paymentState)}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <a
                  href={getBlockExplorerTxUrl(p.txHash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-white shrink-0"
                  title={p.txHash}
                >
                  <span className="hidden sm:inline">${(p.amountUsdcBaseUnits / 10 ** 6).toFixed(2)}</span>
                  <span className="sm:hidden">{truncateHash(p.txHash)}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      {/* ── Security Notice ────────────────────────────────────────────── */}
      <div className="flex items-start gap-2 p-3 text-xs text-slate-500">
        <Shield className="w-3.5 h-3.5 mt-0.5 shrink-0" />
        <p>
          Payments are verified on-chain by our backend. We never store private keys.
          Your wallet remains in your control at all times.
        </p>
      </div>
    </div>
  );
}

// ── Copy Button ────────────────────────────────────────────────────────────

function CopyButton({ address }: { address: string }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-7 w-7 shrink-0"
      onClick={copy}
      title="Copy address"
    >
      {copied ? (
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
      ) : (
        <Copy className="w-3.5 h-3.5 text-slate-400" />
      )}
    </Button>
  );
}

// ── Payment Step Indicator ─────────────────────────────────────────────────

function PaymentStepIndicator({ step }: { step: string }) {
  const steps = [
    { key: "confirming", label: "Waiting for wallet confirmation…" },
    { key: "switching-network", label: "Switching to Base network…" },
    { key: "sending", label: "Submitting transaction…" },
    { key: "pending", label: "Transaction submitted — waiting for Base confirmation…" },
    { key: "verifying", label: "Payment submitted — backend verifying…" },
  ];

  const currentIdx = steps.findIndex((s) => s.key === step);
  const current = steps[currentIdx] ?? steps[steps.length - 1];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl border border-white/8">
        <LoadingSpinner size="sm" />
        <span className="text-sm text-slate-300">{current.label}</span>
      </div>

      {/* Progress steps */}
      <div className="flex items-center gap-1 px-1">
        {steps.map((s, i) => (
          <div key={s.key} className="flex items-center gap-1 flex-1">
            <div
              className={cn(
                "h-1 rounded-full flex-1 transition-colors",
                i <= currentIdx ? "bg-coral-500" : "bg-white/10"
              )}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
