"use client";

import "@rainbow-me/rainbowkit/styles.css";
import { getDefaultConfig, RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import { coinbaseWallet, phantomWallet, rabbyWallet, walletConnectWallet } from "@rainbow-me/rainbowkit/wallets";
import { fastMetaMaskWallet } from "@/lib/wallets/fastMetaMask";
import { WagmiProvider } from "wagmi";
import { base } from "wagmi/chains";

const config = getDefaultConfig({
  appName: "Conch",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "YOUR_PROJECT_ID",
  chains: [base],
  wallets: [
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

const rainbowTheme = darkTheme({
  accentColor: "#7a5dff",
  accentColorForeground: "white",
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
