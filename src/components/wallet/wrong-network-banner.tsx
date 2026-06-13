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
      className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-200"
    >
      <span>This network isn&apos;t supported. Switch to a supported chain to continue.</span>
      <button
        type="button"
        onClick={() => switchChain({ chainId: fallback.id })}
        className="rounded-lg bg-amber-600 px-3 py-1.5 font-medium text-white transition-colors hover:bg-amber-700"
      >
        Switch to {fallback.name}
      </button>
    </div>
  );
}
