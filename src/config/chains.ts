import type { Address } from 'viem';
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

import type { FaucetDeployment, SupportedChain, TokenMeta } from '@/types';
import deployments from '../../deployments/addresses.json';

interface DeploymentEntry {
  chainName: string;
  token: string;
  faucet: string;
}

const DEPLOYMENTS = deployments as Record<string, DeploymentEntry>;

function faucetFor(chainId: number): FaucetDeployment | undefined {
  const entry = DEPLOYMENTS[String(chainId)];
  if (!entry || !entry.token || !entry.faucet) return undefined;
  return { token: entry.token as Address, faucet: entry.faucet as Address };
}

const WETH: Omit<TokenMeta, 'address'> = {
  symbol: 'WETH',
  name: 'Wrapped Ether',
  decimals: 18,
  coingeckoId: 'weth',
};
const USDC: Omit<TokenMeta, 'address'> = {
  symbol: 'USDC',
  name: 'USD Coin',
  decimals: 6,
  coingeckoId: 'usd-coin',
};

export const SUPPORTED_CHAINS: readonly SupportedChain[] = [
  // --- mainnets (read-only portfolio) -------------------------------------
  {
    id: mainnet.id,
    name: 'Ethereum',
    shortName: 'ETH',
    kind: 'mainnet',
    nativeSymbol: 'ETH',
    nativeCoingeckoId: 'ethereum',
    explorerUrl: 'https://etherscan.io',
    trackedTokens: [
      { ...WETH, address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2' },
      { ...USDC, address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' },
      {
        symbol: 'DAI',
        name: 'Dai Stablecoin',
        decimals: 18,
        coingeckoId: 'dai',
        address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
      },
    ],
  },
  {
    id: base.id,
    name: 'Base',
    shortName: 'BASE',
    kind: 'mainnet',
    nativeSymbol: 'ETH',
    nativeCoingeckoId: 'ethereum',
    explorerUrl: 'https://basescan.org',
    trackedTokens: [
      { ...WETH, address: '0x4200000000000000000000000000000000000006' },
      { ...USDC, address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' },
    ],
  },
  {
    id: arbitrum.id,
    name: 'Arbitrum One',
    shortName: 'ARB',
    kind: 'mainnet',
    nativeSymbol: 'ETH',
    nativeCoingeckoId: 'ethereum',
    explorerUrl: 'https://arbiscan.io',
    trackedTokens: [
      { ...WETH, address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1' },
      { ...USDC, address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831' },
      {
        symbol: 'ARB',
        name: 'Arbitrum',
        decimals: 18,
        coingeckoId: 'arbitrum',
        address: '0x912CE59144191C1204E64559FE8253a0e49E6548',
      },
    ],
  },

  {
    id: optimism.id,
    name: 'OP Mainnet',
    shortName: 'OP',
    kind: 'mainnet',
    nativeSymbol: 'ETH',
    nativeCoingeckoId: 'ethereum',
    explorerUrl: 'https://optimistic.etherscan.io',
    trackedTokens: [
      { ...WETH, address: '0x4200000000000000000000000000000000000006' },
      { ...USDC, address: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85' },
    ],
  },
  {
    id: polygon.id,
    name: 'Polygon',
    shortName: 'POL',
    kind: 'mainnet',
    nativeSymbol: 'POL',
    nativeCoingeckoId: 'matic-network',
    explorerUrl: 'https://polygonscan.com',
    trackedTokens: [
      { ...WETH, address: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619' },
      { ...USDC, address: '0x3c499c542cEF5E3811e1192ce70d8cc03d5c3359' },
    ],
  },

  // --- testnets (faucet + balances) ---------------------------------------
  {
    id: sepolia.id,
    name: 'Ethereum Sepolia',
    shortName: 'Sepolia',
    kind: 'testnet',
    nativeSymbol: 'ETH',
    nativeCoingeckoId: 'ethereum',
    explorerUrl: 'https://sepolia.etherscan.io',
    faucet: faucetFor(sepolia.id),
    trackedTokens: [],
  },
  {
    id: baseSepolia.id,
    name: 'Base Sepolia',
    shortName: 'Base Sepolia',
    kind: 'testnet',
    nativeSymbol: 'ETH',
    nativeCoingeckoId: 'ethereum',
    explorerUrl: 'https://sepolia.basescan.org',
    faucet: faucetFor(baseSepolia.id),
    trackedTokens: [],
  },
  {
    id: arbitrumSepolia.id,
    name: 'Arbitrum Sepolia',
    shortName: 'Arb Sepolia',
    kind: 'testnet',
    nativeSymbol: 'ETH',
    nativeCoingeckoId: 'ethereum',
    explorerUrl: 'https://sepolia.arbiscan.io',
    faucet: faucetFor(arbitrumSepolia.id),
    trackedTokens: [],
  },
] as const;

export const TESTNET_CHAINS = SUPPORTED_CHAINS.filter((c) => c.kind === 'testnet');
export const MAINNET_CHAINS = SUPPORTED_CHAINS.filter((c) => c.kind === 'mainnet');

const CHAINS_BY_ID = new Map(SUPPORTED_CHAINS.map((c) => [c.id, c]));

export function getChain(chainId: number): SupportedChain | undefined {
  return CHAINS_BY_ID.get(chainId);
}

export function isSupportedChain(chainId: number): boolean {
  return CHAINS_BY_ID.has(chainId);
}

export function explorerTxUrl(chainId: number, hash: string): string {
  const chain = getChain(chainId);
  return chain ? `${chain.explorerUrl}/tx/${hash}` : '#';
}

export function explorerAddressUrl(chainId: number, address: string): string {
  const chain = getChain(chainId);
  return chain ? `${chain.explorerUrl}/address/${address}` : '#';
}
