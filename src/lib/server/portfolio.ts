import { type Address, erc20Abi } from 'viem';

import { getChain } from '@/config/chains';
import { sumUsd, valueBalance } from '@/lib/portfolio-math';
import type { ChainPortfolio, NativeBalance, TokenBalance } from '@/types';

import { fetchPrices } from './coingecko';
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

  const [nativeRaw, tokenResults] = await Promise.all([
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
  ]);

  const priceIds = Array.from(
    new Set(
      [chain.nativeCoingeckoId, ...tokens.map((t) => t.coingeckoId)].filter((id): id is string =>
        Boolean(id),
      ),
    ),
  );
  const prices = await fetchPrices(priceIds);

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
