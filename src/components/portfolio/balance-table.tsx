'use client';

import type { ChainPortfolio } from '@/types';
import { formatUsd } from '@/lib/format';

export function BalanceTable({ perChain }: { perChain: ChainPortfolio[] }) {
  return (
    <div className="space-y-7">
      {perChain.map((chain) => {
        const tokens = chain.tokens.filter((t) => t.raw !== '0');
        return (
          <div key={chain.chainId}>
            <div className="border-linestrong flex items-baseline justify-between border-b pb-1.5">
              <span className="font-display text-base italic">{chain.chainName}</span>
              <span className="font-mono text-sm font-medium tabular-nums">
                {formatUsd(chain.totalUsd)}
              </span>
            </div>
            <ul className="divide-line divide-y">
              <Row
                symbol={chain.native.symbol}
                formatted={chain.native.formatted}
                usd={chain.native.usdValue}
              />
              {tokens.map((t) => (
                <Row
                  key={t.token.address}
                  symbol={t.token.symbol}
                  formatted={t.formatted}
                  usd={t.usdValue}
                />
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

function Row({
  symbol,
  formatted,
  usd,
}: {
  symbol: string;
  formatted: string;
  usd: number | null;
}) {
  return (
    <li className="flex items-center justify-between py-2.5 font-mono text-sm">
      <span className="font-medium">{symbol}</span>
      <span className="flex gap-5 tabular-nums">
        <span className="text-inkmute">{formatted}</span>
        <span className="w-20 text-right">{formatUsd(usd)}</span>
      </span>
    </li>
  );
}
