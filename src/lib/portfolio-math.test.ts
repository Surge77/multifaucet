import { describe, expect, it } from 'vitest';

import { sumUsd, valueBalance } from './portfolio-math';

describe('valueBalance', () => {
  it('formats and values a balance when a price is known', () => {
    const result = valueBalance(2_000_000_000_000_000_000n, 18, 1500);
    expect(result.formatted).toBe('2');
    expect(result.raw).toBe('2000000000000000000');
    expect(result.usdValue).toBe(3000);
  });

  it('leaves usdValue null when the price is unknown', () => {
    const result = valueBalance(1_000_000n, 6, null);
    expect(result.formatted).toBe('1');
    expect(result.usdValue).toBeNull();
  });
});

describe('sumUsd', () => {
  it('sums values, treating null as zero', () => {
    expect(sumUsd([100, null, 50, null])).toBe(150);
  });

  it('returns 0 for an all-null list', () => {
    expect(sumUsd([null, null])).toBe(0);
  });
});
