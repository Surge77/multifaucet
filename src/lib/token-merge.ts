import type { TokenBalance } from '@/types';

/** Default cap on token rows per chain — bounds spam from auto-discovery. */
export const MAX_TOKENS_PER_CHAIN = 25;

/**
 * Merge curated and auto-discovered token balances: curated entries win on
 * address collisions, zero balances are dropped, and the result is sorted by USD
 * value (unpriced last) and capped.
 */
export function mergeTokenBalances(
  curated: TokenBalance[],
  discovered: TokenBalance[],
  cap: number = MAX_TOKENS_PER_CHAIN,
): TokenBalance[] {
  const seen = new Set(curated.map((t) => t.token.address.toLowerCase()));
  const merged = [...curated];
  for (const token of discovered) {
    const key = token.token.address.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(token);
  }
  return merged
    .filter((t) => t.raw !== '0')
    .sort((a, b) => (b.usdValue ?? 0) - (a.usdValue ?? 0))
    .slice(0, cap);
}
