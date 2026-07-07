'use client';

import { useAccount, useSwitchChain } from 'wagmi';

import { SUPPORTED_CHAINS } from '@/config/chains';
import { cn } from '@/lib/utils';

export function ChainSwitcher() {
  const { chainId, isConnected } = useAccount();
  const { switchChain, isPending } = useSwitchChain();

  if (!isConnected) return null;

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <span className="text-inkmute font-mono text-[10px] tracking-[0.28em] uppercase">
        Network
      </span>
      <div role="group" aria-label="Switch network" className="flex flex-wrap gap-2">
        {SUPPORTED_CHAINS.map((chain) => {
          const active = chain.id === chainId;
          return (
            <button
              key={chain.id}
              type="button"
              aria-pressed={active}
              disabled={isPending || active}
              onClick={() => switchChain({ chainId: chain.id })}
              className={cn(
                'border px-3 py-1 font-mono text-[11px] tracking-[0.14em] uppercase transition-colors disabled:cursor-default',
                // Dashed frame marks a testnet; solid marks mainnet.
                chain.kind === 'testnet' ? 'border-dashed' : 'border-solid',
                active
                  ? 'border-ink bg-ink text-bg'
                  : 'border-linestrong text-inkmute hover:border-ink hover:text-ink',
              )}
            >
              {chain.shortName}
            </button>
          );
        })}
      </div>
      <span aria-hidden className="text-inkmute font-mono text-[10px]">
        dashed = testnet
      </span>
    </div>
  );
}
