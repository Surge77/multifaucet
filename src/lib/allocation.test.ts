import { describe, expect, it } from 'vitest';

import type { ChainPortfolio } from '@/types';

import { buildAllocation } from './allocation';

function chain(overrides: Partial<ChainPortfolio>): ChainPortfolio {
  return {
    chainId: 1,
    chainName: 'Ethereum',
    native: { symbol: 'ETH', raw: '0', formatted: '0', usdValue: null },
    tokens: [],
    totalUsd: 0,
    ...overrides,
  };
}

describe('buildAllocation', () => {
  it('aggregates the same symbol across chains', () => {
    const result = buildAllocation([
      chain({ native: { symbol: 'ETH', raw: '0', formatted: '1', usdValue: 100 } }),
      chain({ native: { symbol: 'ETH', raw: '0', formatted: '1', usdValue: 50 } }),
    ]);
    expect(result).toEqual([{ name: 'ETH', value: 150 }]);
  });

  it('omits assets without a USD value and sorts descending', () => {
    const result = buildAllocation([
      chain({
        native: { symbol: 'ETH', raw: '0', formatted: '1', usdValue: 100 },
        tokens: [
          {
            token: { address: '0x1', symbol: 'USDC', name: 'USD Coin', decimals: 6 },
            raw: '0',
            formatted: '300',
            usdValue: 300,
          },
          {
            token: { address: '0x2', symbol: 'DAI', name: 'Dai', decimals: 18 },
            raw: '0',
            formatted: '0',
            usdValue: null,
          },
        ],
      }),
    ]);
    expect(result).toEqual([
      { name: 'USDC', value: 300 },
      { name: 'ETH', value: 100 },
    ]);
  });

  it('returns an empty array when nothing is valued', () => {
    expect(buildAllocation([chain({})])).toEqual([]);
  });
});
