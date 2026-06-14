import { afterEach, describe, expect, it } from 'vitest';

import { rateLimit, resetRateLimits } from './rate-limit';

const LIMIT = 3;
const WINDOW = 60_000;
const T0 = 1_000_000;

afterEach(() => {
  resetRateLimits();
});

describe('rateLimit', () => {
  it('allows requests up to the limit within a window', () => {
    expect(rateLimit('a', LIMIT, WINDOW, T0).ok).toBe(true);
    expect(rateLimit('a', LIMIT, WINDOW, T0).ok).toBe(true);
    expect(rateLimit('a', LIMIT, WINDOW, T0).ok).toBe(true);
  });

  it('blocks once the limit is exceeded and reports retry-after', () => {
    for (let i = 0; i < LIMIT; i += 1) rateLimit('b', LIMIT, WINDOW, T0);
    const blocked = rateLimit('b', LIMIT, WINDOW, T0 + 10_000);
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfterSec).toBe(50);
  });

  it('resets after the window elapses', () => {
    for (let i = 0; i < LIMIT; i += 1) rateLimit('c', LIMIT, WINDOW, T0);
    expect(rateLimit('c', LIMIT, WINDOW, T0).ok).toBe(false);
    expect(rateLimit('c', LIMIT, WINDOW, T0 + WINDOW).ok).toBe(true);
  });

  it('tracks distinct keys independently', () => {
    for (let i = 0; i < LIMIT; i += 1) rateLimit('d', LIMIT, WINDOW, T0);
    expect(rateLimit('d', LIMIT, WINDOW, T0).ok).toBe(false);
    expect(rateLimit('e', LIMIT, WINDOW, T0).ok).toBe(true);
  });
});
