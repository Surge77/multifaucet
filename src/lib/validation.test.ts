import { describe, expect, it } from 'vitest';

import { addressSchema, chainIdSchema, coingeckoIdsSchema } from './validation';

const VALID = '0xd8da6bf26964af9d7eed9e03e53415d37aa96045';

describe('addressSchema', () => {
  it('accepts and checksums a valid address', () => {
    expect(addressSchema.parse(VALID)).toBe('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045');
  });

  it('rejects a malformed address', () => {
    expect(addressSchema.safeParse('0x123').success).toBe(false);
    expect(addressSchema.safeParse('not-an-address').success).toBe(false);
  });
});

describe('chainIdSchema', () => {
  it('coerces and accepts a supported chain id', () => {
    expect(chainIdSchema.parse('11155111')).toBe(11155111);
  });

  it('rejects an unsupported chain id', () => {
    expect(chainIdSchema.safeParse('999999').success).toBe(false);
  });
});

describe('coingeckoIdsSchema', () => {
  it('splits, trims, lowercases, and dedupes', () => {
    expect(coingeckoIdsSchema.parse('Ethereum, weth ,ethereum')).toEqual(['ethereum', 'weth']);
  });

  it('rejects an empty list', () => {
    expect(coingeckoIdsSchema.safeParse('').success).toBe(false);
  });

  it('rejects ids with illegal characters', () => {
    expect(coingeckoIdsSchema.safeParse('usd_coin').success).toBe(false);
  });
});
