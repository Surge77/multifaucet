'use client';

import { useAccount, useSwitchChain } from 'wagmi';

import { SUPPORTED_CHAINS } from '@/config/chains';
import { cn } from '@/lib/utils';

export function ChainSwitcher() {
  const { chainId, isConnected } = useAccount();
  const { switchChain, isPending } = useSwitchChain();

  if (!isConnected) return null;

  return (
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
              'rounded-full border px-3 py-1 text-sm font-medium transition-colors disabled:cursor-default',
              active
                ? 'border-violet-500 bg-violet-500/15 text-violet-700 dark:text-violet-300'
                : 'border-black/10 hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10',
              chain.kind === 'testnet' && !active && 'opacity-90',
            )}
          >
            {chain.shortName}
          </button>
        );
      })}
    </div>
  );
}
