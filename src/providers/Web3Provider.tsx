"use client";

import "@rainbow-me/rainbowkit/styles.css";
import { getDefaultConfig, RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import { injectedWallet, coinbaseWallet, phantomWallet, rabbyWallet, walletConnectWallet } from "@rainbow-me/rainbowkit/wallets";
import { WagmiProvider } from "wagmi";
import { base } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

const config = getDefaultConfig({
  appName: "Conch",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "YOUR_PROJECT_ID",
  chains: [base],
  wallets: [
    {
      // RainbowKit's metaMaskWallet always routes through @metamask/sdk, which
      // does its own async init() handshake before connecting even when the
      // extension is already injected — several real seconds of avoidable lag.
      // injectedWallet uses wagmi's plain injected() connector instead: a
      // direct eth_requestAccounts call against window.ethereum, no SDK layer.
      // It detects MetaMask (or whatever extension is present) just as well,
      // just faster.
      groupName: "Popular",
      wallets: [injectedWallet, coinbaseWallet],
    },
    {
      groupName: "All other wallets",
      wallets: [walletConnectWallet, phantomWallet, rabbyWallet],
    },
  ],
  ssr: true,
});

const rainbowTheme = darkTheme({
  accentColor: "#c05f47",
  accentColorForeground: "white",
  borderRadius: "large",
  fontStack: "system",
  overlayBlur: "small",
});

export function Web3Provider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={rainbowTheme} modalSize="compact">
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
