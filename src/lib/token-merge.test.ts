import { describe, expect, it } from 'vitest';

import type { TokenBalance } from '@/types';

import { mergeTokenBalances } from './token-merge';

function tb(address: string, symbol: string, usd: number | null, raw = '1'): TokenBalance {
  return {
    token: { address: address as `0x${string}`, symbol, name: symbol, decimals: 18 },
    raw,
    formatted: '1',
    usdValue: usd,
  };
}

const CURATED = '0x1111111111111111111111111111111111111111';
const DISC_A = '0x2222222222222222222222222222222222222222';
const DISC_B = '0x3333333333333333333333333333333333333333';

describe('mergeTokenBalances', () => {
  it('sorts by USD value descending and drops unpriced discovered dust', () => {
    const merged = mergeTokenBalances(
      [tb(CURATED, 'CUR', 10)],
      [tb(DISC_A, 'A', 100), tb(DISC_B, 'B', null)],
    );
    // B (discovered, no USD) is dropped as dust; A and curated CUR remain.
    expect(merged.map((t) => t.token.symbol)).toEqual(['A', 'CUR']);
  });

  it('keeps an unpriced curated token but never unpriced discovered ones', () => {
    const merged = mergeTokenBalances(
      [tb(CURATED, 'CUR', null)],
      [tb(DISC_A, 'SPAM', 0), tb(DISC_B, 'SPAM2', null)],
    );
    expect(merged.map((t) => t.token.symbol)).toEqual(['CUR']);
  });

  it('keeps the curated entry on an address collision (case-insensitive)', () => {
    const merged = mergeTokenBalances(
      [tb(CURATED, 'CURATED', 5)],
      [tb(CURATED.toUpperCase(), 'DUP', 999)],
    );
    expect(merged).toHaveLength(1);
    expect(merged[0]!.token.symbol).toBe('CURATED');
  });

  it('drops zero-balance entries', () => {
    const merged = mergeTokenBalances([tb(CURATED, 'CUR', 0, '0')], [tb(DISC_A, 'A', 1)]);
    expect(merged.map((t) => t.token.symbol)).toEqual(['A']);
  });

  it('caps the result length', () => {
    const discovered = Array.from({ length: 30 }, (_, i) =>
      tb(`0x${(i + 10).toString(16).padStart(40, '0')}`, `T${i}`, i),
    );
    expect(mergeTokenBalances([], discovered, 25)).toHaveLength(25);
  });
});
