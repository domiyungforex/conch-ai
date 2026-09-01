import type { Address } from "viem";

// ── Chain Configuration ────────────────────────────────────────────────────
// All chain-specific constants live here. No hard-coded chain IDs elsewhere.

export const BASE_MAINNET_CHAIN_ID = 8453;
export const BASE_SEPOLIA_CHAIN_ID = 84532;

export const SUPPORTED_CHAINS = {
  baseMainnet: {
    id: BASE_MAINNET_CHAIN_ID,
    name: "Base",
    rpcUrl: process.env.BASE_RPC_URL ?? "https://mainnet.base.org",
    blockExplorer: "https://basescan.org",
  },
  baseSepolia: {
    id: BASE_SEPOLIA_CHAIN_ID,
    name: "Base Sepolia",
    rpcUrl: process.env.BASE_SEPOLIA_RPC_URL ?? "https://sepolia.base.org",
    blockExplorer: "https://sepolia.basescan.org",
  },
} as const;

// The active chain is driven by env — never hard-coded in UI or API routes.
// Default to mainnet for production safety.
export const ACTIVE_CHAIN =
  process.env.BASE_CHAIN_ENV === "testnet"
    ? SUPPORTED_CHAINS.baseSepolia
    : SUPPORTED_CHAINS.baseMainnet;

export const ACTIVE_CHAIN_ID = ACTIVE_CHAIN.id;

// ── Treasury ───────────────────────────────────────────────────────────────
// Where subscription payments are sent. Set per environment.
// NEVER expose the private key — users sign from their own wallets.

export const TREASURY_ADDRESS: Address =
  (process.env.NEXT_PUBLIC_SUBSCRIPTION_TREASURY_ADDRESS_BASE as Address) ??
  "0x0000000000000000000000000000000000000000";

// ── Supported Payment Tokens ───────────────────────────────────────────────
// Configurable per chain. Currently USDC on Base.

export interface PaymentToken {
  symbol: string;
  name: string;
  address: Address;
  decimals: number;
}

export const SUPPORTED_TOKENS: Record<number, PaymentToken[]> = {
  [BASE_MAINNET_CHAIN_ID]: [
    {
      symbol: "USDC",
      name: "USD Coin",
      address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
      decimals: 6,
    },
  ],
  [BASE_SEPOLIA_CHAIN_ID]: [
    {
      symbol: "USDC",
      name: "USD Coin (Testnet)",
      address: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
      decimals: 6,
    },
  ],
};

// Convenience: default payment token for the active chain
export function getDefaultPaymentToken(): PaymentToken {
  const tokens = SUPPORTED_TOKENS[ACTIVE_CHAIN_ID];
  if (!tokens || tokens.length === 0) {
    throw new Error(`No supported payment tokens for chain ${ACTIVE_CHAIN_ID}`);
  }
  return tokens[0];
}

// ── Subscription Plans (on-chain pricing configuration) ────────────────────
// This is the authoritative source for plan pricing on-chain.
// The subscription system reads these to determine expected payment amounts.

export const PLAN_PRICING = {
  starter: { monthlyUsdc: 5, annualUsdc: 48 },
  pro: { monthlyUsdc: 19, annualUsdc: 180 },
  premium: { monthlyUsdc: 39, annualUsdc: 374 },
  enterprise: { monthlyUsdc: 99, annualUsdc: 950 },
} as const;

// ── Block Explorer Helpers ─────────────────────────────────────────────────

export function getBlockExplorerTxUrl(txHash: string): string {
  return `${ACTIVE_CHAIN.blockExplorer}/tx/${txHash}`;
}

export function getBlockExplorerAddressUrl(address: string): string {
  return `${ACTIVE_CHAIN.blockExplorer}/address/${address}`;
}

// ── Network Validation ─────────────────────────────────────────────────────

export function isSupportedChainId(chainId: number): boolean {
  return chainId === BASE_MAINNET_CHAIN_ID || chainId === BASE_SEPOLIA_CHAIN_ID;
}

export function isTestnet(chainId: number): boolean {
  return chainId === BASE_SEPOLIA_CHAIN_ID;
}

export function isProductionChain(chainId: number): boolean {
  return chainId === BASE_MAINNET_CHAIN_ID;
}
