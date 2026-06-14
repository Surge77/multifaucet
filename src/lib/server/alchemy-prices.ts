import { SUPPORTED_CHAINS } from '@/config/chains';

import { ALCHEMY_NETWORK } from './rpc';

const REQUEST_TIMEOUT_MS = 5_000;
const REVALIDATE_SECONDS = 60;
/** Alchemy caps by-address price requests at 25 tokens. */
const MAX_PRICE_ADDRESSES = 25;

/**
 * CoinGecko id <-> ticker symbol map, derived from the chain registry so it
 * never drifts from the tracked-token list. Alchemy's price API keys on symbol,
 * CoinGecko keys on slug; this bridges the two.
 */
function buildSymbolMaps(): { idToSymbol: Map<string, string>; symbolToId: Map<string, string> } {
  const idToSymbol = new Map<string, string>();
  const symbolToId = new Map<string, string>();
  for (const chain of SUPPORTED_CHAINS) {
    idToSymbol.set(chain.nativeCoingeckoId, chain.nativeSymbol);
    symbolToId.set(chain.nativeSymbol.toUpperCase(), chain.nativeCoingeckoId);
    for (const token of chain.trackedTokens) {
      if (!token.coingeckoId) continue;
      idToSymbol.set(token.coingeckoId, token.symbol);
      symbolToId.set(token.symbol.toUpperCase(), token.coingeckoId);
    }
  }
  return { idToSymbol, symbolToId };
}

const { idToSymbol, symbolToId } = buildSymbolMaps();

interface AlchemyPriceEntry {
  symbol?: string;
  prices?: { currency?: string; value?: string }[];
}

/**
 * Fallback USD prices via Alchemy's Prices API, reusing the existing Alchemy
 * key (no new credential). Returns `{}` when no key is set or on any failure.
 */
export async function fetchAlchemyPrices(ids: string[]): Promise<Record<string, number>> {
  const key = process.env.ALCHEMY_API_KEY;
  if (!key || ids.length === 0) return {};

  const symbols = ids.map((id) => idToSymbol.get(id)).filter((s): s is string => Boolean(s));
  if (symbols.length === 0) return {};

  const url = new URL(`https://api.g.alchemy.com/prices/v1/${key}/tokens/by-symbol`);
  for (const symbol of symbols) url.searchParams.append('symbols', symbol);

  const res = await fetch(url, {
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    next: { revalidate: REVALIDATE_SECONDS },
  });
  if (!res.ok) return {};

  const body = (await res.json()) as { data?: AlchemyPriceEntry[] };
  const prices: Record<string, number> = {};
  for (const entry of body.data ?? []) {
    const id = entry.symbol ? symbolToId.get(entry.symbol.toUpperCase()) : undefined;
    const usd = entry.prices?.find((p) => p.currency === 'usd')?.value;
    if (id && usd != null && Number.isFinite(Number(usd))) prices[id] = Number(usd);
  }
  return prices;
}

interface AlchemyAddressPriceEntry {
  address?: string;
  prices?: { currency?: string; value?: string }[];
}

/**
 * USD prices for arbitrary token contract addresses on `chainId` via Alchemy's
 * Prices `by-address` API. Used to price auto-discovered tokens that have no
 * CoinGecko id. Returns `{}` (keyed by lowercased address) on any failure.
 */
export async function fetchAlchemyPricesByAddress(
  chainId: number,
  addresses: string[],
): Promise<Record<string, number>> {
  const key = process.env.ALCHEMY_API_KEY;
  const network = ALCHEMY_NETWORK[chainId];
  if (!key || !network || addresses.length === 0) return {};

  const url = `https://api.g.alchemy.com/prices/v1/${key}/tokens/by-address`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      addresses: addresses.slice(0, MAX_PRICE_ADDRESSES).map((address) => ({ network, address })),
    }),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    next: { revalidate: REVALIDATE_SECONDS },
  });
  if (!res.ok) return {};

  const body = (await res.json()) as { data?: AlchemyAddressPriceEntry[] };
  const prices: Record<string, number> = {};
  for (const entry of body.data ?? []) {
    const usd = entry.prices?.find((p) => p.currency === 'usd')?.value;
    if (entry.address && usd != null && Number.isFinite(Number(usd))) {
      prices[entry.address.toLowerCase()] = Number(usd);
    }
  }
  return prices;
}
