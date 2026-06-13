import type { Address } from 'viem';

import type { Transfer, TransferDirection } from '@/types';

import { alchemyRpcUrl } from './rpc';

const REQUEST_TIMEOUT_MS = 8_000;

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

async function queryTransfers(url: string, params: TransferParams): Promise<AlchemyTransfer[]> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      id: 1,
      jsonrpc: '2.0',
      method: 'alchemy_getAssetTransfers',
      params: [params],
    }),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!res.ok) return [];
  const json = (await res.json()) as { result?: { transfers?: AlchemyTransfer[] } };
  return json.result?.transfers ?? [];
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
    fromBlock: '0x0',
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
  } catch {
    return [];
  }
}
