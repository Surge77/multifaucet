import { type Address, erc20Abi } from 'viem';

import { getChain, MAINNET_CHAINS } from '@/config/chains';
import { sumUsd, valueBalance } from '@/lib/portfolio-math';
import { mergeTokenBalances } from '@/lib/token-merge';
import type { ChainPortfolio, NativeBalance, TokenBalance } from '@/types';

import { fetchAlchemyPricesByAddress } from './alchemy-prices';
import { logError } from './logger';
import { fetchPrices } from './prices';
import { publicClientFor } from './rpc';
import { discoverTokens } from './token-discovery';

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

  // Curated reads, CoinGecko prices, and token discovery all run concurrently.
  const [nativeRaw, tokenResults, prices, discovered] = await Promise.all([
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
    discoverTokens(address, chainId),
  ]);

  const nativeValued = valueBalance(
    nativeRaw,
    NATIVE_DECIMALS,
    prices[chain.nativeCoingeckoId] ?? null,
  );
  const native: NativeBalance = { symbol: chain.nativeSymbol, ...nativeValued };

  const curatedBalances: TokenBalance[] = tokens.map((token, i) => {
    const result = tokenResults[i];
    const raw = result && result.status === 'success' ? (result.result as bigint) : 0n;
    const price = token.coingeckoId ? (prices[token.coingeckoId] ?? null) : null;
    return { token, ...valueBalance(raw, token.decimals, price) };
  });

  // Discovered tokens have no CoinGecko id, so price them by contract address.
  const discoveredPrices = discovered.length
    ? await fetchAlchemyPricesByAddress(
        chainId,
        discovered.map((d) => d.token.address),
      )
    : {};
  const discoveredBalances: TokenBalance[] = discovered.map((d) => ({
    token: d.token,
    ...valueBalance(
      d.raw,
      d.token.decimals,
      discoveredPrices[d.token.address.toLowerCase()] ?? null,
    ),
  }));

  const tokenBalances = mergeTokenBalances(curatedBalances, discoveredBalances);
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
