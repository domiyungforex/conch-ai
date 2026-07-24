import { createPublicClient, http, decodeEventLog, erc20Abi, type Chain, type Hash, type Address } from "viem";

// Base mainnet USDC ("Circle: USDC Token"), confirmed against Circle's own
// docs and Basescan's contract label — not recalled from memory.
export const USDC_ADDRESS_BASE: Address = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
export const USDC_DECIMALS = 6;

// Defined inline rather than imported from "viem/chains" — that barrel pulls
// in every chain definition viem ships (including one with an internal
// dynamic-require pattern webpack can't statically analyze), which surfaces
// as a "Critical dependency: the request of a dependency is an expression"
// build warning for something this file never uses. All getTransactionReceipt
// needs is the chain id.
const base: Chain = {
  id: 8453,
  name: "Base",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: ["https://mainnet.base.org"] } },
};

const RPC_URL = process.env.BASE_RPC_URL ?? "https://mainnet.base.org";
const publicClient = createPublicClient({ chain: base, transport: http(RPC_URL) });

export interface UsdcTransfer {
  from: Address;
  to: Address;
  value: bigint;
  blockNumber: bigint;
}

// Reads a transaction back from chain and returns the USDC Transfer it made,
// or null if it doesn't exist, hasn't landed, reverted, or isn't a USDC
// transfer at all. Never trusts anything the client claims about the payment.
export async function getUsdcTransfer(txHash: Hash): Promise<UsdcTransfer | null> {
  let receipt;
  try {
    receipt = await publicClient.getTransactionReceipt({ hash: txHash });
  } catch {
    return null;
  }
  if (receipt.status !== "success") return null;

  // log.address (not receipt.to) is the authoritative source of "which
  // contract actually emitted this Transfer" — guards against a router/proxy
  // call whose top-level `to` differs from the token contract itself.
  const log = receipt.logs.find((l) => l.address.toLowerCase() === USDC_ADDRESS_BASE.toLowerCase());
  if (!log) return null;

  try {
    const { args } = decodeEventLog({ abi: erc20Abi, eventName: "Transfer", data: log.data, topics: log.topics });
    return { from: args.from, to: args.to, value: args.value, blockNumber: receipt.blockNumber };
  } catch {
    return null; // a USDC-contract log that isn't a Transfer (e.g. an Approval)
  }
}
