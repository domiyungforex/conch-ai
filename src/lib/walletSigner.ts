"use client";

import { BrowserProvider, JsonRpcSigner } from "ethers";
import type { WalletClient } from "viem";

// The EAS SDK is built on ethers, while this app's wallet stack is wagmi/viem
// end to end. This is wagmi's own documented viem-Client-to-ethers-Signer
// conversion — it lets the EAS SDK sign through the same connected wallet
// (MetaMask, Rainbow, etc.) wagmi already has, without pulling ethers into
// the rest of the app's wallet code.
export function walletClientToSigner(walletClient: WalletClient): JsonRpcSigner {
  const { account, chain, transport } = walletClient;
  if (!account || !chain) throw new Error("Wallet not connected");
  const network = { chainId: chain.id, name: chain.name };
  const provider = new BrowserProvider(transport, network);
  return new JsonRpcSigner(provider, account.address);
}
