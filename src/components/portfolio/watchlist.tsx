'use client';

import { useState } from 'react';
import { isAddress } from 'viem';

import { shortenAddress } from '@/lib/format';
import { isInWatchlist, type WatchEntry } from '@/lib/watchlist';

interface WatchlistProps {
  entries: WatchEntry[];
  /** The address currently shown in the portfolio (connected or pasted). */
  activeAddress: string;
  onSelect: (address: string) => void;
  onSave: (label: string) => void;
  onRemove: (address: string) => void;
}

export function Watchlist({ entries, activeAddress, onSelect, onSave, onRemove }: WatchlistProps) {
  const [label, setLabel] = useState('');
  const canSave = isAddress(activeAddress) && !isInWatchlist(entries, activeAddress);

  function handleSave() {
    onSave(label);
    setLabel('');
  }

  return (
    <div className="mt-4">
      {isAddress(activeAddress) && (
        <div className="flex gap-2">
          <input
            aria-label="Watchlist label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Label (optional)"
            disabled={!canSave}
            className="min-w-0 flex-1 rounded-lg border border-black/10 bg-transparent px-2 py-1.5 text-sm outline-none focus:border-violet-500 disabled:opacity-50 dark:border-white/15"
          />
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave}
            className="shrink-0 rounded-lg border border-black/10 px-3 py-1.5 text-sm font-medium hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/15 dark:hover:bg-white/10"
          >
            {canSave ? 'Save address' : 'Saved'}
          </button>
        </div>
      )}

      {entries.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2">
          {entries.map((entry) => (
            <li
              key={entry.address}
              className="flex items-center gap-1 rounded-full border border-black/10 pr-1 pl-3 text-sm dark:border-white/15"
            >
              <button
                type="button"
                onClick={() => onSelect(entry.address)}
                className="py-1 font-medium hover:text-violet-600 dark:hover:text-violet-400"
              >
                {entry.label ?? shortenAddress(entry.address)}
              </button>
              <button
                type="button"
                aria-label={`Remove ${entry.label ?? entry.address}`}
                onClick={() => onRemove(entry.address)}
                className="flex size-5 items-center justify-center rounded-full text-neutral-500 hover:bg-black/10 hover:text-red-600 dark:hover:bg-white/10"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
