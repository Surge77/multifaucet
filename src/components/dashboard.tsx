'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';

import { FaucetCard } from '@/components/faucet/faucet-card';
import { PortfolioPanel } from '@/components/portfolio/portfolio-panel';
import { ChainSwitcher } from '@/components/wallet/chain-switcher';
import { WrongNetworkBanner } from '@/components/wallet/wrong-network-banner';
import { cn } from '@/lib/utils';

type Mode = 'faucet' | 'portfolio';

const MODES: { id: Mode; index: string; label: string }[] = [
  { id: 'faucet', index: '01', label: 'Faucet' },
  { id: 'portfolio', index: '02', label: 'Portfolio' },
];

export function Dashboard() {
  const [mode, setMode] = useState<Mode>('faucet');
  const { isConnected } = useAccount();

  return (
    <section className="rise rise-3 mx-auto w-full max-w-5xl px-4 py-10">
      <WrongNetworkBanner />

      <div role="tablist" aria-label="Dashboard mode" className="border-line flex gap-8 border-b">
        {MODES.map(({ id, index, label }) => (
          <button
            key={id}
            id={`tab-${id}`}
            role="tab"
            aria-selected={mode === id}
            aria-controls="dashboard-panel"
            onClick={() => setMode(id)}
            className={cn(
              'focus-visible:outline-accent -mb-px flex items-baseline gap-2 border-b-2 pb-3 transition-colors focus-visible:outline-2 focus-visible:outline-offset-4',
              mode === id
                ? 'border-accent text-ink'
                : 'text-inkmute hover:text-ink border-transparent',
            )}
          >
            <span aria-hidden className="text-accent font-mono text-[10px] tracking-[0.2em]">
              {index}
            </span>
            <span className="font-display text-lg">{label}</span>
          </button>
        ))}
      </div>

      <div className="mt-6">
        <ChainSwitcher />
      </div>

      <div
        id="dashboard-panel"
        role="tabpanel"
        aria-labelledby={`tab-${mode}`}
        tabIndex={0}
        className="mt-6 focus-visible:outline-none"
      >
        {mode === 'faucet' ? isConnected ? <FaucetCard /> : <EmptyState /> : <PortfolioPanel />}
      </div>
    </section>
  );
}

function EmptyState() {
  return (
    <div className="border-linestrong border border-dashed p-12 text-center">
      <p className="text-inkmute font-mono text-[10px] tracking-[0.28em] uppercase">No signal</p>
      <p className="font-display mt-3 text-xl">Connect a wallet to claim testnet tokens.</p>
    </div>
  );
}
