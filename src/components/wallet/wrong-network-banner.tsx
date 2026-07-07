'use client';

import { useAccount, useSwitchChain } from 'wagmi';

import { SUPPORTED_CHAINS, isSupportedChain } from '@/config/chains';

export function WrongNetworkBanner() {
  const { chainId, isConnected } = useAccount();
  const { switchChain } = useSwitchChain();

  if (!isConnected || chainId === undefined || isSupportedChain(chainId)) return null;

  const fallback = SUPPORTED_CHAINS[0];
  return (
    <div
      role="alert"
      className="border-ochre bg-ochre/10 mb-6 flex flex-wrap items-center justify-between gap-3 border border-dashed px-4 py-3 text-sm"
    >
      <span>
        <span className="text-ochre mr-3 font-mono text-[10px] tracking-[0.24em] uppercase">
          Off chart
        </span>
        This network isn&apos;t supported. Switch to a supported chain to continue.
      </span>
      <button
        type="button"
        onClick={() => switchChain({ chainId: fallback.id })}
        className="border-linestrong bg-ink text-bg hover:bg-accent hover:text-accentink border px-3 py-1.5 font-mono text-[11px] tracking-[0.14em] uppercase transition-colors"
      >
        Switch to {fallback.name}
      </button>
    </div>
  );
}
