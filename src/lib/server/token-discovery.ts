import { type Address, erc20Abi, hexToBigInt } from 'viem';

import { getChain } from '@/config/chains';
import type { TokenMeta } from '@/types';

import { logError } from './logger';
import { alchemyRpcUrl, publicClientFor } from './rpc';
import { rpcCall } from './transfers';

/** Cap discovered tokens before the metadata multicall to bound RPC cost. */
const MAX_DISCOVERED = 40;

interface RawTokenBalance {
  contractAddress: Address;
  tokenBalance: `0x${string}` | null;
}

export interface DiscoveredToken {
  token: TokenMeta;
  raw: bigint;
}

/**
 * Find ERC-20s held by `address` that aren't already in the chain's curated
 * list, via `alchemy_getTokenBalances` + a single viem multicall for metadata.
 * Discovered tokens have no `coingeckoId` (priced by contract address elsewhere).
 */
export async function discoverTokens(
  address: Address,
  chainId: number,
): Promise<DiscoveredToken[]> {
  const url = alchemyRpcUrl(chainId);
  const client = publicClientFor(chainId);
  const chain = getChain(chainId);
  if (!url || !client || !chain) return [];

  try {
    const result = await rpcCall<{ tokenBalances?: RawTokenBalance[] }>(
      url,
      'alchemy_getTokenBalances',
      [address, 'erc20'],
    );

    const curated = new Set(chain.trackedTokens.map((t) => t.address.toLowerCase()));
    const held = (result?.tokenBalances ?? [])
      .filter((b) => b.tokenBalance && hexToBigInt(b.tokenBalance) > 0n)
      .filter((b) => !curated.has(b.contractAddress.toLowerCase()))
      .slice(0, MAX_DISCOVERED);
    if (held.length === 0) return [];

    const meta = await client.multicall({
      allowFailure: true,
      contracts: held.flatMap((b) => [
        { address: b.contractAddress, abi: erc20Abi, functionName: 'symbol' as const },
        { address: b.contractAddress, abi: erc20Abi, functionName: 'name' as const },
        { address: b.contractAddress, abi: erc20Abi, functionName: 'decimals' as const },
      ]),
    });

    const tokens: DiscoveredToken[] = [];
    held.forEach((b, i) => {
      const symbol = meta[i * 3];
      const name = meta[i * 3 + 1];
      const decimals = meta[i * 3 + 2];
      // A token missing symbol/decimals is unusable; skip it (likely not a real ERC-20).
      if (symbol?.status !== 'success' || decimals?.status !== 'success') return;
      tokens.push({
        token: {
          address: b.contractAddress,
          symbol: String(symbol.result),
          name: name?.status === 'success' ? String(name.result) : String(symbol.result),
          decimals: Number(decimals.result),
        },
        raw: hexToBigInt(b.tokenBalance as `0x${string}`),
      });
    });
    return tokens;
  } catch (error) {
    logError('token-discovery', error, { chainId });
    return [];
  }
}
