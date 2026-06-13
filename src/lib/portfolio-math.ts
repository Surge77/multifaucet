import { formatUnits } from 'viem';

export interface ValuedBalance {
  raw: string;
  formatted: string;
  usdValue: number | null;
}

/** Format a raw balance and value it in USD when a price is known. */
export function valueBalance(raw: bigint, decimals: number, price: number | null): ValuedBalance {
  const formatted = formatUnits(raw, decimals);
  return {
    raw: raw.toString(),
    formatted,
    usdValue: price !== null ? Number(formatted) * price : null,
  };
}

/** Sum USD values, treating unknown (null) values as 0. */
export function sumUsd(values: Array<number | null>): number {
  return values.reduce<number>((acc, value) => acc + (value ?? 0), 0);
}
