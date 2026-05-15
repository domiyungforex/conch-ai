"use client";

import { useState, useEffect } from "react";
import { useAccount, useSignMessage, useDisconnect } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Unlink, ExternalLink, Copy } from "lucide-react";
import { GlassCard } from "@/components/shared/GlassCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { WalletPublic } from "@/types/api";

async function fetchWallet(): Promise<WalletPublic | null> {
  const res = await fetch("/api/wallet");
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed");
  return res.json();
}

async function verifyWallet(data: { address: string; signature: string; message: string }): Promise<WalletPublic> {
  const res = await fetch("/api/wallet", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to verify wallet");
  return res.json();
}

async function unlinkWallet(): Promise<void> {
  await fetch("/api/wallet", { method: "DELETE" });
}

function truncateAddress(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function WalletConnectCard() {
  const qc = useQueryClient();
  const { address, isConnected, chain } = useAccount();
  const { disconnect } = useDisconnect();
  const { signMessageAsync } = useSignMessage();
  const [copied, setCopied] = useState(false);
  const [signing, setSigning] = useState(false);

  const { data: wallet, isLoading } = useQuery({
    queryKey: ["wallet"],
    queryFn: fetchWallet,
  });

  const verify = useMutation({
    mutationFn: verifyWallet,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["wallet"] }),
  });

  const unlink = useMutation({
    mutationFn: unlinkWallet,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["wallet"] }),
  });

  useEffect(() => {
    if (isConnected && address && !wallet && !signing && !verify.isPending) {
      handleSign();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, address]);

  const handleSign = async () => {
    if (!address) return;
    setSigning(true);
    try {
      const message = `Sign in to Conch: ${Date.now()}`;
      const signature = await signMessageAsync({ message });
      await verify.mutateAsync({ address, signature, message });
    } catch {
      // user rejected or error — disconnect so they can retry
      disconnect();
    } finally {
      setSigning(false);
    }
  };

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
            <div className="w-9 h-9 rounded-full bg-linear-to-br from-violet-600 to-indigo-600 flex items-center justify-center shrink-0">
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

          <Button
            variant="destructive"
            size="sm"
            className="gap-1.5"
            onClick={() => unlink.mutate()}
            disabled={unlink.isPending}
          >
            <Unlink className="w-3.5 h-3.5" />
            {unlink.isPending ? "Unlinking…" : "Unlink Wallet"}
          </Button>
        </div>
      ) : (
        <div className="flex flex-col items-start gap-4">
          {signing || verify.isPending ? (
            <div className="flex items-center gap-3 text-sm text-slate-300">
              <div className="w-4 h-4 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
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
