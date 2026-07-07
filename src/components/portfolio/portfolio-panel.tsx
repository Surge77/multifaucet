'use client';

import dynamic from 'next/dynamic';
import { useMemo, useState } from 'react';
import { type Address, isAddress } from 'viem';
import { useAccount } from 'wagmi';

import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { usePortfolio } from '@/hooks/use-portfolio';
import { buildAllocation } from '@/lib/allocation';
import { formatUsd, shortenAddress } from '@/lib/format';
import { addEntry, removeEntry, type WatchEntry } from '@/lib/watchlist';

import { BalanceTable } from './balance-table';
import { Watchlist } from './watchlist';

const AllocationChart = dynamic(() => import('./allocation-chart'), { ssr: false });

// Stable reference for the localStorage hook's initial value.
const EMPTY_WATCHLIST: WatchEntry[] = [];

export function PortfolioPanel() {
  const { address: connected } = useAccount();
  const [input, setInput] = useState('');
  const debounced = useDebouncedValue(input, 300);

  const effective = debounced.trim() || connected || '';
  const validAddress = isAddress(effective) ? (effective as Address) : undefined;
  const { perChain, totalUsd, isLoading, isError } = usePortfolio(validAddress);
  const allocation = useMemo(() => buildAllocation(perChain), [perChain]);

  const [watchlist, setWatchlist] = useLocalStorage<WatchEntry[]>('mf-watchlist', EMPTY_WATCHLIST);

  return (
    <div className="plate p-6 sm:p-7">
      <label
        htmlFor="portfolio-address"
        className="text-inkmute font-mono text-[10px] tracking-[0.28em] uppercase"
      >
        Address
      </label>
      <input
        id="portfolio-address"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={connected ? shortenAddress(connected) : '0x… or paste any address'}
        spellCheck={false}
        autoComplete="off"
        className="border-linestrong placeholder:text-inkmute focus:border-accent mt-2 w-full border-b bg-transparent py-2 font-mono text-sm outline-none"
      />

      <Watchlist
        entries={watchlist}
        activeAddress={effective}
        onSelect={setInput}
        onSave={(label) => validAddress && setWatchlist(addEntry(watchlist, validAddress, label))}
        onRemove={(address) => setWatchlist(removeEntry(watchlist, address))}
      />

      {!validAddress ? (
        <p className="text-inkmute mt-6 text-sm">
          Connect a wallet or paste any address to view a read-only portfolio across Ethereum, Base,
          and Arbitrum.
        </p>
      ) : isError ? (
        <p className="text-danger mt-6 font-mono text-sm">
          Couldn&apos;t load balances. Check the address or try again.
        </p>
      ) : (
        <>
          <div className="border-line mt-7 flex items-baseline justify-between border-t border-dashed pt-5">
            <span className="text-inkmute font-mono text-[10px] tracking-[0.28em] uppercase">
              Total value
            </span>
            <span className="font-mono text-3xl font-semibold tracking-tight tabular-nums">
              {isLoading && perChain.length === 0 ? '—' : formatUsd(totalUsd)}
            </span>
          </div>

          {allocation.length > 0 && (
            <div className="mt-4">
              <AllocationChart data={allocation} />
            </div>
          )}

          <div className="mt-6">
            {isLoading && perChain.length === 0 ? (
              <Skeleton />
            ) : (
              <BalanceTable perChain={perChain} />
            )}
          </div>
        </>
      )}
    </div>
  );
}

function Skeleton() {
  return (
    <div className="space-y-3" aria-hidden>
      {[0, 1, 2].map((i) => (
        <div key={i} className="bg-surface2 h-10 animate-pulse" />
      ))}
    </div>
  );
}
