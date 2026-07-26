"use client";

import { createConnector } from "wagmi";
import { injected } from "wagmi/connectors";
import { metaMaskWallet } from "@rainbow-me/rainbowkit/wallets";
import type { Wallet, WalletDetailsParams } from "@rainbow-me/rainbowkit";

// RainbowKit's own metaMaskWallet always connects through @metamask/sdk,
// which runs a real async init() handshake before it can connect — several
// seconds of lag even when the extension is already installed (verified by
// reading @wagmi/connectors' source this session). That's real; so is
// showing "MetaMask" by name instead of a generic "Browser Wallet" label,
// which is what a plain injectedWallet swap loses.
//
// This gets both: reuse metaMaskWallet's own icon/branding/downloadUrls
// (the real public API, not an internal RainbowKit asset path), but swap
// its connector for wagmi's plain injected({ target: "metaMask" }) — a
// direct eth_requestAccounts call against the flagged MetaMask provider,
// no SDK layer. Mobile users without the extension still get a working
// path via the separate WalletConnect entry already in the wallet list;
// this tile is the fast, branded, extension-first path.
export function fastMetaMaskWallet(params: Parameters<typeof metaMaskWallet>[0]): Wallet {
  const base = metaMaskWallet(params);
  return {
    ...base,
    createConnector: (walletDetails: WalletDetailsParams) =>
      createConnector((config) => ({
        ...injected({ target: "metaMask" })(config),
        ...walletDetails,
      })),
  };
}
