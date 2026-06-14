import { type Address, getAddress, isAddress } from 'viem';

export interface WatchEntry {
  address: Address;
  label?: string;
}

/** Cap saved addresses so localStorage stays bounded. */
export const MAX_WATCHLIST = 20;

function sameAddress(a: string, b: string): boolean {
  return a.toLowerCase() === b.toLowerCase();
}

/**
 * Add (or move-to-front) an address. Checksums it, dedupes case-insensitively,
 * and caps the list. Invalid addresses are ignored (returns the list unchanged).
 */
export function addEntry(list: WatchEntry[], address: string, label?: string): WatchEntry[] {
  if (!isAddress(address)) return list;
  const checksummed = getAddress(address);
  const trimmed = label?.trim();
  const entry: WatchEntry = trimmed
    ? { address: checksummed, label: trimmed }
    : { address: checksummed };
  const without = list.filter((e) => !sameAddress(e.address, checksummed));
  return [entry, ...without].slice(0, MAX_WATCHLIST);
}

export function removeEntry(list: WatchEntry[], address: string): WatchEntry[] {
  return list.filter((e) => !sameAddress(e.address, address));
}

export function isInWatchlist(list: WatchEntry[], address: string): boolean {
  if (!isAddress(address)) return false;
  return list.some((e) => sameAddress(e.address, address));
}
