import { describe, expect, it } from 'vitest';

import { MAX_WATCHLIST, addEntry, isInWatchlist, removeEntry, type WatchEntry } from './watchlist';

const A = '0x1111111111111111111111111111111111111111';
const B = '0x2222222222222222222222222222222222222222';

describe('addEntry', () => {
  it('adds a checksummed entry to the front', () => {
    const list = addEntry([], A, 'Main');
    expect(list).toEqual([
      { address: '0x1111111111111111111111111111111111111111', label: 'Main' },
    ]);
  });

  it('omits an empty/whitespace label', () => {
    expect(addEntry([], A, '   ')[0]).toEqual({ address: A });
  });

  it('dedupes an existing address, moves it to front, and updates the label', () => {
    const list: WatchEntry[] = [{ address: A }, { address: B }];
    const next = addEntry(list, A, 'renamed');
    expect(next).toHaveLength(2);
    expect(next[0]).toEqual({ address: A, label: 'renamed' });
  });

  it('ignores an invalid address', () => {
    const list: WatchEntry[] = [{ address: A }];
    expect(addEntry(list, 'not-an-address')).toBe(list);
  });

  it('caps the list at MAX_WATCHLIST', () => {
    let list: WatchEntry[] = [];
    for (let i = 0; i < MAX_WATCHLIST + 5; i += 1) {
      list = addEntry(list, `0x${(i + 1).toString(16).padStart(40, '0')}`);
    }
    expect(list).toHaveLength(MAX_WATCHLIST);
  });
});

describe('removeEntry', () => {
  it('removes case-insensitively', () => {
    const list: WatchEntry[] = [{ address: A }, { address: B }];
    expect(removeEntry(list, A.toUpperCase())).toEqual([{ address: B }]);
  });
});

describe('isInWatchlist', () => {
  it('matches case-insensitively and rejects invalid input', () => {
    const list: WatchEntry[] = [{ address: A }];
    expect(isInWatchlist(list, A.toLowerCase())).toBe(true);
    expect(isInWatchlist(list, B)).toBe(false);
    expect(isInWatchlist(list, 'nope')).toBe(false);
  });
});
