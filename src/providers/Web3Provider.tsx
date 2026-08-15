"use client";

import "@rainbow-me/rainbowkit/styles.css";
import { getDefaultConfig, RainbowKitProvider, lightTheme } from "@rainbow-me/rainbowkit";
import { coinbaseWallet, metaMaskWallet, phantomWallet, rabbyWallet, walletConnectWallet } from "@rainbow-me/rainbowkit/wallets";
import { fastMetaMaskWallet } from "@/lib/wallets/fastMetaMask";
import { WagmiProvider } from "wagmi";
import { base } from "wagmi/chains";

// Phones and tablets browsing in a normal mobile browser have no injected
// MetaMask provider, so the fast extension-only tile dead-ends there. On touch
// devices use the SDK-based MetaMask wallet — it deep-links into the MetaMask
// app (or its embedded WalletConnect flow) — and keep the fast injected()
// path on desktop where the extension exists. Extension-only wallets (Phantom,
// Rabby) are likewise hidden on touch, so every tile in the modal is actually
// connectable from a phone or tablet.
const isTouchDevice =
  typeof window !== "undefined" &&
  (navigator.maxTouchPoints > 1 || /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent));

const config = getDefaultConfig({
  appName: "Conch",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "YOUR_PROJECT_ID",
  chains: [base],
  wallets: isTouchDevice
    ? [
        {
          groupName: "Popular",
          // metaMaskWallet (SDK): deep-links into the MetaMask mobile app —
          // the only MetaMask path that works from a mobile browser.
          wallets: [metaMaskWallet, coinbaseWallet],
        },
        {
          // WalletConnect opens the QR/deep-link flow for every other mobile
          // wallet (Trust, Rainbow, SafePal, ...).
          groupName: "All other wallets",
          wallets: [walletConnectWallet],
        },
      ]
    : [
        {
          groupName: "Popular",
          // fastMetaMaskWallet: real MetaMask name/icon (from RainbowKit's own
          // metaMaskWallet), connected via wagmi's plain injected() connector
          // instead of @metamask/sdk — same identification, without the SDK's
          // multi-second init handshake. See src/lib/wallets/fastMetaMask.ts.
          wallets: [fastMetaMaskWallet, coinbaseWallet],
        },
        {
          groupName: "All other wallets",
          wallets: [walletConnectWallet, phantomWallet, rabbyWallet],
        },
      ],
  ssr: true,
});

const rainbowTheme = lightTheme({
  accentColor: "#c8891f",
  accentColorForeground: "#241b10",
  borderRadius: "large",
  fontStack: "system",
  overlayBlur: "small",
});

export function Web3Provider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <RainbowKitProvider theme={rainbowTheme} modalSize="compact">
        {children}
      </RainbowKitProvider>
    </WagmiProvider>
  );
}
