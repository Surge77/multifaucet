import type { ChainPortfolio } from '@/types';

export interface AllocationSlice {
  name: string;
  value: number;
}

/**
 * Aggregate USD value by asset symbol across chains, for the allocation chart.
 * Assets with no known USD value are omitted; result is sorted descending.
 */
export function buildAllocation(perChain: ChainPortfolio[]): AllocationSlice[] {
  const totals = new Map<string, number>();

  const add = (symbol: string, usd: number | null) => {
    if (usd && usd > 0) totals.set(symbol, (totals.get(symbol) ?? 0) + usd);
  };

  for (const chain of perChain) {
    add(chain.native.symbol, chain.native.usdValue);
    for (const token of chain.tokens) add(token.token.symbol, token.usdValue);
  }

  return Array.from(totals, ([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
}
