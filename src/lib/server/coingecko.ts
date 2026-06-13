import { TtlCache } from '@/lib/cache';

const PRICE_TTL_MS = 60_000;
const REQUEST_TIMEOUT_MS = 5_000;
const BASE_URL = 'https://api.coingecko.com/api/v3/simple/price';

const cache = new TtlCache<Record<string, number>>(PRICE_TTL_MS);

/**
 * Fetch USD prices for CoinGecko ids. Cached 60s. Degrades to `{}` on any
 * failure so callers can still render balances without prices.
 */
export async function fetchPrices(ids: string[]): Promise<Record<string, number>> {
  if (ids.length === 0) return {};

  const cacheKey = [...ids].sort().join(',');
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const url = new URL(BASE_URL);
  url.searchParams.set('ids', ids.join(','));
  url.searchParams.set('vs_currencies', 'usd');
  const apiKey = process.env.COINGECKO_API_KEY;
  if (apiKey) url.searchParams.set('x_cg_demo_api_key', apiKey);

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
    if (!res.ok) return {};
    const data = (await res.json()) as Record<string, { usd?: number }>;
    const prices: Record<string, number> = {};
    for (const id of ids) {
      const usd = data[id]?.usd;
      if (typeof usd === 'number') prices[id] = usd;
    }
    cache.set(cacheKey, prices);
    return prices;
  } catch {
    return {};
  }
}
