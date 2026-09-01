"use client";

import { useEffect, useState } from "react";
import { useAccount, useSignMessage, useDisconnect } from "wagmi";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { WalletPublic } from "@/types/api";

async function fetchWallet(): Promise<WalletPublic | null> {
  const res = await fetch("/api/wallet");
  if (!res.ok) return null;
  const data = await res.json();
  return data.wallet ?? null;
}

async function verifyWallet(data: { address: string; signature: string; message: string }): Promise<WalletPublic> {
  const res = await fetch("/api/wallet", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to verify wallet");
  const body = await res.json();
  return body.wallet;
}

async function unlinkWallet(): Promise<void> {
  const res = await fetch("/api/wallet", { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to unlink wallet");
}

// Shared by every surface that needs a linked+live wallet (Wallet page, Billing
// page, anywhere else). Two states can drift apart: `wallet` (linked in Appwrite,
// persists forever) and `isConnected` (this browser's live wagmi session, which
// can drop on a new device, cleared storage, or an expired mobile WalletConnect
// session). Whenever the wallet connects and isn't linked yet, this auto-fires
// the sign+verify flow — so connecting from anywhere (not just /wallet) is enough
// to end up linked, with no extra navigation required.
export function useWalletLink() {
  const qc = useQueryClient();
  const { address, isConnected, chain } = useAccount();
  const { disconnect } = useDisconnect();
  const { signMessageAsync } = useSignMessage();
  const [signing, setSigning] = useState(false);

  const { data: wallet, isLoading } = useQuery({
    queryKey: ["wallet"],
    queryFn: fetchWallet,
  });

  const verify = useMutation({
    mutationFn: verifyWallet,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["wallet"] });
    },
  });

  const unlink = useMutation({
    mutationFn: unlinkWallet,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["wallet"] });
    },
  });

  useEffect(() => {
    if (isConnected && address && !wallet && !isLoading && !signing && !verify.isPending) {
      handleSign();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, address, wallet, isLoading]);

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

  return { wallet, isLoading, isConnected, address, chain, signing, verify, unlink };
}
