'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';

import { FaucetCard } from '@/components/faucet/faucet-card';
import { PortfolioPanel } from '@/components/portfolio/portfolio-panel';
import { ChainSwitcher } from '@/components/wallet/chain-switcher';
import { WrongNetworkBanner } from '@/components/wallet/wrong-network-banner';
import { cn } from '@/lib/utils';

type Mode = 'faucet' | 'portfolio';

const MODES: { id: Mode; label: string }[] = [
  { id: 'faucet', label: 'Faucet' },
  { id: 'portfolio', label: 'Portfolio' },
];

export function Dashboard() {
  const [mode, setMode] = useState<Mode>('faucet');
  const { isConnected } = useAccount();

  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-8">
      <WrongNetworkBanner />

      <div
        role="tablist"
        aria-label="Dashboard mode"
        className="inline-flex rounded-xl border border-black/10 p-1 dark:border-white/15"
      >
        {MODES.map(({ id, label }) => (
          <button
            key={id}
            role="tab"
            aria-selected={mode === id}
            onClick={() => setMode(id)}
            className={cn(
              'rounded-lg px-4 py-1.5 text-sm font-medium transition-colors',
              mode === id
                ? 'bg-violet-600 text-white'
                : 'text-neutral-600 hover:bg-black/5 dark:text-neutral-300 dark:hover:bg-white/10',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        <ChainSwitcher />
      </div>

      <div role="tabpanel" className="mt-6">
        {mode === 'faucet' ? isConnected ? <FaucetCard /> : <EmptyState /> : <PortfolioPanel />}
      </div>
    </section>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-black/15 p-10 text-center text-neutral-500 dark:border-white/15">
      Connect a wallet to claim testnet tokens.
    </div>
  );
}
