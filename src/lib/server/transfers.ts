import type { Address } from 'viem';

import type { Transfer, TransferDirection } from '@/types';

import { logError } from './logger';
import { alchemyRpcUrl } from './rpc';

const REQUEST_TIMEOUT_MS = 8_000;
const LOOKBACK_SECONDS = 30 * 24 * 60 * 60; // ~30 days of recent history

/** Approximate seconds per block, used to bound the transfer scan window. */
const BLOCK_TIME_SEC: Record<number, number> = {
  1: 12, // Ethereum
  8453: 2, // Base
  42161: 0.25, // Arbitrum One
  10: 2, // OP Mainnet
  137: 2, // Polygon
  11155111: 12, // Ethereum Sepolia
  84532: 2, // Base Sepolia
  421614: 0.25, // Arbitrum Sepolia
};

interface AlchemyTransfer {
  hash: string;
  from: string;
  to: string | null;
  value: number | null;
  asset: string | null;
  metadata?: { blockTimestamp?: string };
}

interface TransferParams {
  fromBlock: string;
  toBlock: string;
  category: string[];
  withMetadata: boolean;
  excludeZeroValue: boolean;
  maxCount: string;
  order: string;
  fromAddress?: Address;
  toAddress?: Address;
}

async function rpcCall<T>(url: string, method: string, params: unknown[]): Promise<T | undefined> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ id: 1, jsonrpc: '2.0', method, params }),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!res.ok) return undefined;
  const json = (await res.json()) as { result?: T };
  return json.result;
}

async function queryTransfers(url: string, params: TransferParams): Promise<AlchemyTransfer[]> {
  const result = await rpcCall<{ transfers?: AlchemyTransfer[] }>(
    url,
    'alchemy_getAssetTransfers',
    [params],
  );
  return result?.transfers ?? [];
}

/**
 * Lower block bound for the scan: ~30 days back from the latest block, so we
 * never ask Alchemy to consider the full chain history. Falls back to genesis
 * when the latest block can't be read.
 */
async function recentFromBlock(url: string, chainId: number): Promise<string> {
  const blockTime = BLOCK_TIME_SEC[chainId];
  const latestHex = await rpcCall<string>(url, 'eth_blockNumber', []);
  if (!blockTime || !latestHex) return '0x0';
  const latest = Number(BigInt(latestHex));
  const from = Math.max(0, latest - Math.ceil(LOOKBACK_SECONDS / blockTime));
  return `0x${from.toString(16)}`;
}

function toTransfer(raw: AlchemyTransfer, owner: string): Transfer {
  const from = (raw.from ?? '') as Address;
  const to = (raw.to ?? '') as Address;
  const fromMe = from.toLowerCase() === owner;
  const toMe = to.toLowerCase() === owner;
  const direction: TransferDirection = fromMe && toMe ? 'self' : fromMe ? 'out' : 'in';
  return {
    hash: raw.hash,
    from,
    to,
    asset: raw.asset ?? 'ETH',
    value: raw.value != null ? String(raw.value) : '0',
    timestamp: raw.metadata?.blockTimestamp ? Date.parse(raw.metadata.blockTimestamp) : null,
    direction,
  };
}

/** Recent external + ERC-20 transfers for an address. Empty without an Alchemy key. */
export async function getTransfers(
  address: Address,
  chainId: number,
  limit = 15,
): Promise<Transfer[]> {
  const url = alchemyRpcUrl(chainId);
  if (!url) return [];

  const common = {
    fromBlock: await recentFromBlock(url, chainId),
    toBlock: 'latest',
    category: ['external', 'erc20'],
    withMetadata: true,
    excludeZeroValue: true,
    maxCount: `0x${limit.toString(16)}`,
    order: 'desc',
  };

  try {
    const [sent, received] = await Promise.all([
      queryTransfers(url, { ...common, fromAddress: address }),
      queryTransfers(url, { ...common, toAddress: address }),
    ]);
    const owner = address.toLowerCase();
    const seen = new Set<string>();
    return [...sent, ...received]
      .map((raw) => toTransfer(raw, owner))
      .filter((t) => {
        const key = `${t.hash}:${t.direction}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0))
      .slice(0, limit);
  } catch (error) {
    logError('transfers.fetch', error, { chainId });
    return [];
  }
}
