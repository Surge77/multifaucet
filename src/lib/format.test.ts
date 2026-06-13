import { describe, expect, it } from 'vitest';

import { formatDuration, formatTokenAmount, formatUsd, shortenAddress } from './format';

describe('shortenAddress', () => {
  it('shortens a full address to head…tail form', () => {
    expect(shortenAddress('0x1234567890abcdef1234567890abcdef12345678')).toBe('0x1234…5678');
  });

  it('respects a custom char count', () => {
    expect(shortenAddress('0x1234567890abcdef1234567890abcdef12345678', 6)).toBe('0x123456…345678');
  });

  it('returns the input unchanged when too short to shorten', () => {
    expect(shortenAddress('0x1234')).toBe('0x1234');
  });
});

describe('formatTokenAmount', () => {
  it('formats whole units with trimmed fraction', () => {
    expect(formatTokenAmount(1_500_000_000_000_000_000n, 18)).toBe('1.5');
  });

  it('drops the fraction entirely when zero', () => {
    expect(formatTokenAmount(2_000_000_000_000_000_000n, 18)).toBe('2');
  });

  it('caps fraction digits and trims trailing zeros', () => {
    expect(formatTokenAmount(1_234_560_000_000_000_000n, 18, 2)).toBe('1.23');
  });

  it('honors decimals other than 18', () => {
    expect(formatTokenAmount(1_500_000n, 6)).toBe('1.5');
  });

  it('returns integer part when maxFractionDigits is 0', () => {
    expect(formatTokenAmount(1_500_000_000_000_000_000n, 18, 0)).toBe('1');
  });
});

describe('formatUsd', () => {
  it('formats a number as USD currency', () => {
    expect(formatUsd(1234.5)).toBe('$1,234.50');
  });

  it('renders an em dash for unknown values', () => {
    expect(formatUsd(null)).toBe('—');
  });
});

describe('formatDuration', () => {
  it('returns "now" when elapsed', () => {
    expect(formatDuration(0)).toBe('now');
    expect(formatDuration(-5)).toBe('now');
  });

  it('formats hours and minutes, dropping seconds', () => {
    expect(formatDuration(3600 + 12 * 60 + 30)).toBe('1h 12m');
  });

  it('formats minutes and seconds when under an hour', () => {
    expect(formatDuration(5 * 60 + 30)).toBe('5m 30s');
  });

  it('formats seconds only', () => {
    expect(formatDuration(42)).toBe('42s');
  });
});
