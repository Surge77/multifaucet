import { formatUnits } from 'viem';

/** Shorten an address to `0x1234…abcd` form. */
export function shortenAddress(address: string, chars = 4): string {
  if (address.length < 2 + chars * 2) return address;
  return `${address.slice(0, 2 + chars)}…${address.slice(-chars)}`;
}

/** Format a raw token amount, trimming trailing zeros to `maxFractionDigits`. */
export function formatTokenAmount(raw: bigint, decimals: number, maxFractionDigits = 4): string {
  const full = formatUnits(raw, decimals);
  const [int, frac = ''] = full.split('.');
  if (maxFractionDigits === 0 || frac === '') return int;
  const trimmed = frac.slice(0, maxFractionDigits).replace(/0+$/, '');
  return trimmed ? `${int}.${trimmed}` : int;
}

/** Format a USD value, or an em dash when unknown. */
export function formatUsd(value: number | null): string {
  if (value === null) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(value);
}

/** Human-readable countdown like `5h 12m` or `42s`, `now` when elapsed. */
export function formatDuration(totalSeconds: number): string {
  if (totalSeconds <= 0) return 'now';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts: string[] = [];
  if (hours) parts.push(`${hours}h`);
  if (minutes) parts.push(`${minutes}m`);
  if (!hours) parts.push(`${seconds}s`);
  return parts.join(' ');
}
