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
            className="border-line placeholder:text-inkmute focus:border-accent min-w-0 flex-1 border bg-transparent px-3 py-1.5 font-mono text-sm outline-none disabled:opacity-50"
          />
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave}
            className="border-linestrong hover:bg-ink hover:text-bg shrink-0 border px-3 py-1.5 font-mono text-[11px] tracking-[0.14em] uppercase transition-colors disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-inherit"
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
              className="border-line flex items-center gap-1 border pr-1 pl-3 font-mono text-sm"
            >
              <button
                type="button"
                onClick={() => onSelect(entry.address)}
                className="hover:text-accent py-1 font-medium transition-colors"
              >
                {entry.label ?? shortenAddress(entry.address)}
              </button>
              <button
                type="button"
                aria-label={`Remove ${entry.label ?? entry.address}`}
                onClick={() => onRemove(entry.address)}
                className="text-inkmute hover:bg-surface2 hover:text-danger flex size-5 items-center justify-center transition-colors"
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
