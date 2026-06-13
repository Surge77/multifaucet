'use client';

import type { ChainPortfolio } from '@/types';
import { formatUsd } from '@/lib/format';

export function BalanceTable({ perChain }: { perChain: ChainPortfolio[] }) {
  return (
    <div className="space-y-6">
      {perChain.map((chain) => {
        const tokens = chain.tokens.filter((t) => t.raw !== '0');
        return (
          <div key={chain.chainId}>
            <div className="flex items-baseline justify-between text-sm font-semibold">
              <span>{chain.chainName}</span>
              <span>{formatUsd(chain.totalUsd)}</span>
            </div>
            <ul className="mt-2 divide-y divide-black/5 dark:divide-white/10">
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
    <li className="flex items-center justify-between py-2 text-sm">
      <span className="font-medium">{symbol}</span>
      <span className="flex gap-4 tabular-nums">
        <span className="text-neutral-600 dark:text-neutral-300">{formatted}</span>
        <span className="w-20 text-right text-neutral-500">{formatUsd(usd)}</span>
      </span>
    </li>
  );
}
