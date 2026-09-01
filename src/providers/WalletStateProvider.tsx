"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import { useAccount, useDisconnect, useSignMessage } from "wagmi";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { WalletPublic } from "@/types/api";
import type { SubscriptionStatus } from "@/lib/subscription";

// ── Types ──────────────────────────────────────────────────────────────────

export interface WalletState {
  /** Linked wallet in Appwrite (persists across sessions) */
  wallet: WalletPublic | null;
  /** Whether wallet data is still loading */
  isLoading: boolean;
  /** Whether the wagmi session is connected */
  isConnected: boolean;
  /** Currently connected wagmi address */
  address: string | undefined;
  /** Current chain info from wagmi */
  chainId: number | undefined;
  /** Whether a signature verification is in progress */
  signing: boolean;
  /** Whether unlink is in progress */
  unlinking: boolean;
  /** Whether the connected wallet matches the linked wallet */
  isWalletMatch: boolean;
  /** Subscription status (globally available) */
  subscriptionStatus: SubscriptionStatus | null;
  /** Current plan ID */
  plan: string | null;
  /** Plan expiry date */
  planExpiresAt: string | null;

  // Actions
  /** Disconnect wallet from wagmi + clear linked wallet */
  disconnectWallet: () => void;
  /** Unlink wallet from Conch account (keeps wagmi session) */
  unlinkWallet: () => void;
}

const WalletStateContext = createContext<WalletState | null>(null);

// ── API calls ──────────────────────────────────────────────────────────────

async function fetchWallet(): Promise<WalletPublic | null> {
  const res = await fetch("/api/wallet");
  if (!res.ok) return null;
  const data = await res.json();
  return data.wallet ?? null;
}

async function fetchSubscription(): Promise<{
  status: SubscriptionStatus;
  plan: string;
  planExpiresAt: string | null;
} | null> {
  const res = await fetch("/api/subscription");
  if (!res.ok) return null;
  return res.json();
}

async function verifyWallet(data: {
  address: string;
  signature: string;
  message: string;
}): Promise<WalletPublic> {
  const res = await fetch("/api/wallet", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to verify wallet");
  const body = await res.json();
  return body.wallet;
}

async function unlinkWalletApi(): Promise<void> {
  const res = await fetch("/api/wallet", { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to unlink wallet");
}

// ── Provider ───────────────────────────────────────────────────────────────

export function WalletStateProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const { address, isConnected, chain } = useAccount();
  const { disconnect } = useDisconnect();
  const { signMessageAsync } = useSignMessage();
  const [signing, setSigning] = useState(false);

  // ── Linked wallet (Appwrite) ──
  const {
    data: walletData,
    isLoading: walletLoading,
  } = useQuery({
    queryKey: ["wallet"],
    queryFn: fetchWallet,
  });
  const wallet = walletData ?? null;

  // ── Subscription status ──
  const { data: sub } = useQuery({
    queryKey: ["subscription"],
    queryFn: fetchSubscription,
    staleTime: 30_000,
  });

  // ── Verify mutation (auto-link on connect) ──
  const verify = useMutation({
    mutationFn: verifyWallet,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["wallet"] });
    },
  });

  // ── Unlink mutation ──
  const unlink = useMutation({
    mutationFn: unlinkWalletApi,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["wallet"] });
    },
  });

  // ── Auto-sign when connected but not yet linked ──
  useEffect(() => {
    if (
      isConnected &&
      address &&
      !wallet &&
      !walletLoading &&
      !signing &&
      !verify.isPending
    ) {
      handleSign();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, address, wallet, walletLoading]);

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

  // ── Disconnect: clear wagmi + unlink wallet ──
  const disconnectWallet = useCallback(() => {
    disconnect();
    unlink.mutate();
  }, [disconnect, unlink]);

  // ── Unlink only (keep wagmi session) ──
  const unlinkWallet = useCallback(() => {
    unlink.mutate();
  }, [unlink]);

  // ── Derived state ──
  const isWalletMatch = useMemo(() => {
    if (!address || !wallet) return false;
    return address.toLowerCase() === wallet.address.toLowerCase();
  }, [address, wallet]);

  const value: WalletState = useMemo(
    () => ({
      wallet,
      isLoading: walletLoading,
      isConnected,
      address,
      chainId: chain?.id,
      signing,
      unlinking: unlink.isPending,
      isWalletMatch,
      subscriptionStatus: sub?.status ?? null,
      plan: sub?.plan ?? null,
      planExpiresAt: sub?.planExpiresAt ?? null,
      disconnectWallet,
      unlinkWallet,
    }),
    [
      wallet,
      walletLoading,
      isConnected,
      address,
      chain?.id,
      signing,
      unlink.isPending,
      isWalletMatch,
      sub,
      disconnectWallet,
      unlinkWallet,
    ]
  );

  return (
    <WalletStateContext.Provider value={value}>
      {children}
    </WalletStateContext.Provider>
  );
}

// ── Hook ───────────────────────────────────────────────────────────────────

export function useWalletState(): WalletState {
  const ctx = useContext(WalletStateContext);
  if (!ctx) {
    throw new Error("useWalletState must be used within a WalletStateProvider");
  }
  return ctx;
}
