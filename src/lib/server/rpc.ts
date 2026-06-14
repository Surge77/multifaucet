import { type Chain, createPublicClient, http, type PublicClient } from 'viem';
import {
  arbitrum,
  arbitrumSepolia,
  base,
  baseSepolia,
  mainnet,
  optimism,
  polygon,
  sepolia,
} from 'viem/chains';

const VIEM_CHAINS = {
  [mainnet.id]: mainnet,
  [base.id]: base,
  [arbitrum.id]: arbitrum,
  [optimism.id]: optimism,
  [polygon.id]: polygon,
  [sepolia.id]: sepolia,
  [baseSepolia.id]: baseSepolia,
  [arbitrumSepolia.id]: arbitrumSepolia,
} as const;

const ALCHEMY_NETWORK: Record<number, string> = {
  [mainnet.id]: 'eth-mainnet',
  [base.id]: 'base-mainnet',
  [arbitrum.id]: 'arb-mainnet',
  [optimism.id]: 'opt-mainnet',
  [polygon.id]: 'polygon-mainnet',
  [sepolia.id]: 'eth-sepolia',
  [baseSepolia.id]: 'base-sepolia',
  [arbitrumSepolia.id]: 'arb-sepolia',
};

/** Alchemy RPC URL for a chain, or undefined when no key is configured. */
export function alchemyRpcUrl(chainId: number): string | undefined {
  const key = process.env.ALCHEMY_API_KEY;
  const network = ALCHEMY_NETWORK[chainId];
  if (!key || !network) return undefined;
  return `https://${network}.g.alchemy.com/v2/${key}`;
}

/**
 * Server-side viem client for a chain. Uses Alchemy when a key is present,
 * otherwise falls back to the chain's default public RPC.
 */
export function publicClientFor(chainId: number): PublicClient | undefined {
  const chain = VIEM_CHAINS[chainId as keyof typeof VIEM_CHAINS] as Chain | undefined;
  if (!chain) return undefined;
  // Collapse the chain union to a single Chain so the client is uniformly typed.
  // Fail fast (8s, 1 retry) so a missing Alchemy key degrades quickly instead
  // of hanging on a flaky public RPC.
  const transport = http(alchemyRpcUrl(chainId), { timeout: 8_000, retryCount: 1, batch: true });
  return createPublicClient({ chain, transport }) as PublicClient;
}
