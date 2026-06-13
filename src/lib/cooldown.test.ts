import { describe, expect, it } from 'vitest';

import { secondsUntil, unlockTimestamp } from './cooldown';

describe('secondsUntil', () => {
  it('returns 0 when the target is in the past', () => {
    expect(secondsUntil(1_000, 2_000)).toBe(0);
  });

  it('returns 0 when the target is now', () => {
    expect(secondsUntil(5_000, 5_000)).toBe(0);
  });

  it('rounds partial seconds up', () => {
    expect(secondsUntil(10_500, 9_000)).toBe(2);
  });

  it('computes whole seconds remaining', () => {
    expect(secondsUntil(70_000, 10_000)).toBe(60);
  });
});

describe('unlockTimestamp', () => {
  it('projects seconds remaining onto an absolute time', () => {
    expect(unlockTimestamp(60, 1_000)).toBe(61_000);
  });

  it('returns now when nothing remains', () => {
    expect(unlockTimestamp(0, 42_000)).toBe(42_000);
  });
});
