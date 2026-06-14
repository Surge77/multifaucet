const REQUEST_TIMEOUT_MS = 5_000;
const REVALIDATE_SECONDS = 60;
const BASE_URL = 'https://api.coingecko.com/api/v3/simple/price';

/**
 * USD prices for CoinGecko ids. Responses are cached for 60s via the Next.js
 * Data Cache (`next.revalidate`), which is shared across serverless instances on
 * Vercel — unlike a per-instance in-memory cache. Degrades to `{}` on failure so
 * callers can still render balances without prices.
 */
export async function fetchCoinGeckoPrices(ids: string[]): Promise<Record<string, number>> {
  if (ids.length === 0) return {};

  const url = new URL(BASE_URL);
  url.searchParams.set('ids', ids.join(','));
  url.searchParams.set('vs_currencies', 'usd');
  const apiKey = process.env.COINGECKO_API_KEY;
  if (apiKey) url.searchParams.set('x_cg_demo_api_key', apiKey);

  const res = await fetch(url, {
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    next: { revalidate: REVALIDATE_SECONDS },
  });
  if (!res.ok) return {};

  const data = (await res.json()) as Record<string, { usd?: number }>;
  const prices: Record<string, number> = {};
  for (const id of ids) {
    const usd = data[id]?.usd;
    if (typeof usd === 'number') prices[id] = usd;
  }
  return prices;
}
