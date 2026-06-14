import { fetchAlchemyPrices } from './alchemy-prices';
import { fetchCoinGeckoPrices } from './coingecko';
import { logError } from './logger';

/**
 * USD prices for CoinGecko ids, with CoinGecko as the primary source and
 * Alchemy as a fallback for any ids it could not price (outage or partial
 * response). Always resolves — an empty map means "render balances without USD".
 */
export async function fetchPrices(ids: string[]): Promise<Record<string, number>> {
  if (ids.length === 0) return {};

  const prices = await fetchCoinGeckoPrices(ids).catch((error) => {
    logError('prices.coingecko', error);
    return {} as Record<string, number>;
  });

  const missing = ids.filter((id) => prices[id] === undefined);
  if (missing.length === 0) return prices;

  const fallback = await fetchAlchemyPrices(missing).catch((error) => {
    logError('prices.alchemy', error);
    return {} as Record<string, number>;
  });

  return { ...prices, ...fallback };
}
