import { describe, expect, it } from 'vitest';

import {
  MAINNET_CHAINS,
  SUPPORTED_CHAINS,
  TESTNET_CHAINS,
  explorerAddressUrl,
  explorerTxUrl,
  getChain,
  isSupportedChain,
} from './chains';

describe('chain registry', () => {
  it('exposes 3 testnets and 5 mainnets', () => {
    expect(TESTNET_CHAINS).toHaveLength(3);
    expect(MAINNET_CHAINS).toHaveLength(5);
    expect(SUPPORTED_CHAINS).toHaveLength(8);
  });

  it('looks up a chain by id', () => {
    expect(getChain(1)?.name).toBe('Ethereum');
    expect(getChain(11155111)?.name).toBe('Ethereum Sepolia');
  });

  it('includes the newly added mainnets', () => {
    expect(getChain(10)?.name).toBe('OP Mainnet');
    expect(getChain(137)?.name).toBe('Polygon');
    expect(getChain(137)?.nativeSymbol).toBe('POL');
    const mainnetIds = MAINNET_CHAINS.map((c) => c.id);
    expect(mainnetIds).toContain(10);
    expect(mainnetIds).toContain(137);
  });

  it('returns undefined for an unknown chain', () => {
    expect(getChain(999999)).toBeUndefined();
  });

  it('reports supported chains', () => {
    expect(isSupportedChain(8453)).toBe(true);
    expect(isSupportedChain(999999)).toBe(false);
  });

  it('every mainnet tracks at least one token with a coingecko id', () => {
    for (const chain of MAINNET_CHAINS) {
      expect(chain.trackedTokens.length).toBeGreaterThan(0);
      for (const token of chain.trackedTokens) {
        expect(token.coingeckoId).toBeTruthy();
      }
    }
  });

  it('builds explorer URLs for known chains', () => {
    expect(explorerTxUrl(1, '0xabc')).toBe('https://etherscan.io/tx/0xabc');
    expect(explorerAddressUrl(8453, '0xdef')).toBe('https://basescan.org/address/0xdef');
  });

  it('falls back to "#" for unknown chains in explorer URLs', () => {
    expect(explorerTxUrl(999999, '0xabc')).toBe('#');
    expect(explorerAddressUrl(999999, '0xdef')).toBe('#');
  });
});
