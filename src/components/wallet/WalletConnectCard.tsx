"use client";

import { useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { CheckCircle2, Unlink, ExternalLink, Copy, WifiOff } from "lucide-react";
import { GlassCard } from "@/components/shared/GlassCard";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toaster";
import { useWalletLink } from "@/hooks/useWalletLink";

function truncateAddress(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function WalletConnectCard() {
  const { wallet, isLoading, isConnected, chain, signing, verify, unlink } = useWalletLink();
  const [copied, setCopied] = useState(false);

  const copyAddress = () => {
    if (!wallet?.address) return;
    navigator.clipboard.writeText(wallet.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <GlassCard className="p-6">
        <div className="h-24 animate-pulse bg-white/5 rounded-xl" />
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-6">
      <h2 className="text-base font-semibold text-white mb-1">Wallet</h2>
      <p className="text-xs text-slate-400 mb-6">
        Link a Web3 wallet to verify your on-chain identity and earn reputation.
      </p>

      {wallet ? (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/8">
            <div className="w-9 h-9 rounded-full bg-linear-to-br from-coral-600 to-gold-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <code className="text-sm font-mono text-white">
                  {truncateAddress(wallet.address)}
                </code>
                <Badge className="text-xs bg-emerald-500/15 text-emerald-300 border-emerald-500/30">
                  Verified
                </Badge>
                {chain && (
                  <Badge className="text-xs bg-blue-500/15 text-blue-300 border-blue-500/30">
                    {chain.name}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Linked {wallet.verifiedAt ? new Date(wallet.verifiedAt).toLocaleDateString() : ""}
              </p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={copyAddress}
                title="Copy address"
              >
                <Copy className="w-3.5 h-3.5 text-slate-400" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                asChild
              >
                <a
                  href={`https://basescan.org/address/${wallet.address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="View on Basescan"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                </a>
              </Button>
            </div>
          </div>

          {copied && (
            <p className="text-xs text-emerald-400">Address copied!</p>
          )}

          {/* Linking to Conch never expires, but the live session in this browser
              can — a new device, cleared storage, or an expired mobile
              WalletConnect session all drop `isConnected` without unlinking the
              wallet. Surface a reconnect path right here instead of leaving the
              user stuck on a page with no connect button at all. */}
          {!isConnected && (
            <div className="flex items-center justify-between gap-3 p-3 bg-amber-500/10 rounded-xl border border-amber-500/20 flex-wrap">
              <div className="flex items-center gap-2 text-xs text-amber-200">
                <WifiOff className="w-3.5 h-3.5 shrink-0" />
                Not connected in this browser right now — reconnect to pay or manage your wallet.
              </div>
              <ConnectButton showBalance={false} chainStatus="none" accountStatus="address" />
            </div>
          )}

          <Button
            variant="destructive"
            size="sm"
            className="gap-1.5"
            onClick={() => unlink.mutate(undefined, { onSuccess: () => toast({ title: "Wallet unlinked" }), onError: (err: Error) => toast({ title: "Failed to unlink wallet", description: err.message, variant: "destructive" }) })}
            disabled={unlink.isPending}
          >
            {unlink.isPending ? <LoadingSpinner size="sm" /> : <Unlink className="w-3.5 h-3.5" />}
            {unlink.isPending ? "Unlinking…" : "Unlink Wallet"}
          </Button>
        </div>
      ) : (
        <div className="flex flex-col items-start gap-4">
          {signing || verify.isPending ? (
            <div className="flex items-center gap-3 text-sm text-slate-300">
              <div className="w-4 h-4 border-2 border-coral-500 border-t-transparent rounded-full animate-spin" />
              {signing ? "Sign the message in your wallet…" : "Verifying signature…"}
            </div>
          ) : (
            <>
              <p className="text-sm text-slate-400">
                Connect your wallet and sign a message to verify ownership.
                No gas required.
              </p>
              <ConnectButton
                showBalance={false}
                chainStatus="none"
                accountStatus="address"
              />
              {verify.isError && (
                <p className="text-xs text-red-400">
                  Verification failed. Please try again.
                </p>
              )}
            </>
          )}
        </div>
      )}
    </GlassCard>
  );
}
