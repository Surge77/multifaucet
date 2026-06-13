import { describe, expect, it } from 'vitest';

import { TtlCache } from './cache';

describe('TtlCache', () => {
  it('returns a stored value before it expires', () => {
    const cache = new TtlCache<number>(1_000);
    cache.set('a', 5, 0);
    expect(cache.get('a', 500)).toBe(5);
  });

  it('evicts a value once the ttl elapses', () => {
    const cache = new TtlCache<number>(1_000);
    cache.set('a', 5, 0);
    expect(cache.get('a', 1_000)).toBeUndefined();
    expect(cache.get('a', 2_000)).toBeUndefined();
  });

  it('returns undefined for unknown keys', () => {
    const cache = new TtlCache<number>(1_000);
    expect(cache.get('missing')).toBeUndefined();
  });
});
