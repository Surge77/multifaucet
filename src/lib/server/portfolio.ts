import { type Address, erc20Abi } from 'viem';

import { getChain, MAINNET_CHAINS } from '@/config/chains';
import { sumUsd, valueBalance } from '@/lib/portfolio-math';
import type { ChainPortfolio, NativeBalance, TokenBalance } from '@/types';

import { logError } from './logger';
import { fetchPrices } from './prices';
import { publicClientFor } from './rpc';

const NATIVE_DECIMALS = 18;

export async function getChainPortfolio(
  address: Address,
  chainId: number,
): Promise<ChainPortfolio> {
  const chain = getChain(chainId);
  const client = publicClientFor(chainId);
  if (!chain || !client) throw new Error(`Unsupported chain: ${chainId}`);

  const tokens = chain.trackedTokens;

  // Price ids derive from static chain config, so prices can be fetched
  // concurrently with the on-chain balance reads instead of after them.
  const priceIds = Array.from(
    new Set(
      [chain.nativeCoingeckoId, ...tokens.map((t) => t.coingeckoId)].filter((id): id is string =>
        Boolean(id),
      ),
    ),
  );

  const [nativeRaw, tokenResults, prices] = await Promise.all([
    client.getBalance({ address }),
    tokens.length
      ? client.multicall({
          allowFailure: true,
          contracts: tokens.map((token) => ({
            address: token.address,
            abi: erc20Abi,
            functionName: 'balanceOf' as const,
            args: [address] as const,
          })),
        })
      : Promise.resolve([]),
    fetchPrices(priceIds),
  ]);

  const nativeValued = valueBalance(
    nativeRaw,
    NATIVE_DECIMALS,
    prices[chain.nativeCoingeckoId] ?? null,
  );
  const native: NativeBalance = { symbol: chain.nativeSymbol, ...nativeValued };

  const tokenBalances: TokenBalance[] = tokens.map((token, i) => {
    const result = tokenResults[i];
    const raw = result && result.status === 'success' ? (result.result as bigint) : 0n;
    const price = token.coingeckoId ? (prices[token.coingeckoId] ?? null) : null;
    return { token, ...valueBalance(raw, token.decimals, price) };
  });

  const totalUsd = sumUsd([native.usdValue, ...tokenBalances.map((t) => t.usdValue)]);

  return { chainId, chainName: chain.name, native, tokens: tokenBalances, totalUsd };
}

/**
 * Portfolios across every mainnet for `address`, fetched concurrently. A single
 * failing chain is logged and dropped rather than failing the whole request, so
 * the client makes one round-trip instead of one per chain.
 */
export async function getAllMainnetPortfolios(address: Address): Promise<ChainPortfolio[]> {
  const results = await Promise.allSettled(
    MAINNET_CHAINS.map((chain) => getChainPortfolio(address, chain.id)),
  );
  return results.flatMap((result, i) => {
    if (result.status === 'fulfilled') return [result.value];
    logError('portfolio.chain', result.reason, { chainId: MAINNET_CHAINS[i]!.id });
    return [];
  });
}
