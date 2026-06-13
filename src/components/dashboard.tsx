'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';

import { ChainSwitcher } from '@/components/wallet/chain-switcher';
import { WrongNetworkBanner } from '@/components/wallet/wrong-network-banner';
import { getChain } from '@/config/chains';
import { shortenAddress } from '@/lib/format';
import { cn } from '@/lib/utils';

type Mode = 'faucet' | 'portfolio';

const MODES: { id: Mode; label: string }[] = [
  { id: 'faucet', label: 'Faucet' },
  { id: 'portfolio', label: 'Portfolio' },
];

export function Dashboard() {
  const [mode, setMode] = useState<Mode>('faucet');
  const { address, chainId, isConnected } = useAccount();
  const chain = chainId !== undefined ? getChain(chainId) : undefined;

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
        {!isConnected ? (
          <EmptyState />
        ) : mode === 'faucet' ? (
          <PanelStub
            title="Faucet"
            line={
              chain?.faucet
                ? `Faucet ready on ${chain.name}. Claim flow lands in the next phase.`
                : chain?.kind === 'testnet'
                  ? `No faucet deployed yet on ${chain.name}.`
                  : `Switch to a testnet to claim MFT.`
            }
          />
        ) : (
          <PanelStub
            title="Portfolio"
            line={`Reading balances for ${address ? shortenAddress(address) : 'your wallet'} — live data lands in the portfolio phase.`}
          />
        )}
      </div>
    </section>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-black/15 p-10 text-center text-neutral-500 dark:border-white/15">
      Connect a wallet to claim testnet tokens or view your portfolio.
    </div>
  );
}

function PanelStub({ title, line }: { title: string; line: string }) {
  return (
    <div className="rounded-2xl border border-black/10 p-6 dark:border-white/10">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">{line}</p>
    </div>
  );
}
