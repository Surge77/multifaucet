'use client';

import { useAccount } from 'wagmi';

import { useCountdown } from '@/hooks/use-countdown';
import { useFaucet } from '@/hooks/use-faucet';
import { explorerTxUrl, getChain } from '@/config/chains';
import { formatDuration, formatTokenAmount } from '@/lib/format';
import { cn } from '@/lib/utils';

const FAUCET_DECIMALS = 18;

export function FaucetCard() {
  const { chainId } = useAccount();
  const chain = chainId !== undefined ? getChain(chainId) : undefined;
  const faucet = useFaucet();
  const secondsRemaining = useCountdown(faucet.unlockAtMs);

  if (!chain || chain.kind !== 'testnet') {
    return (
      <Card>
        <p className="text-sm text-neutral-600 dark:text-neutral-300">
          Switch to a testnet — Sepolia, Base Sepolia, or Arbitrum Sepolia — to claim MFT.
        </p>
      </Card>
    );
  }

  if (!faucet.isAvailable) {
    return (
      <Card>
        <p className="text-sm text-neutral-600 dark:text-neutral-300">
          No faucet is deployed on {chain.name} yet.
        </p>
      </Card>
    );
  }

  const drip =
    faucet.dripAmount !== undefined ? formatTokenAmount(faucet.dripAmount, FAUCET_DECIMALS) : '—';
  const onCooldown = secondsRemaining > 0;
  const busy = faucet.status === 'pending' || faucet.status === 'confirming';
  const disabled = busy || onCooldown || !faucet.canClaim;

  return (
    <Card>
      <div className="flex items-baseline justify-between">
        <h2 className="text-lg font-semibold">Claim MFT</h2>
        <span className="text-sm text-neutral-500">{chain.name}</span>
      </div>

      <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
        Drips <span className="font-medium">{drip} MFT</span> per claim, once every 24h per address.
      </p>

      <button
        type="button"
        onClick={faucet.claim}
        disabled={disabled}
        aria-disabled={disabled}
        className={cn(
          'mt-5 w-full rounded-xl px-4 py-3 font-semibold text-white transition-colors',
          disabled
            ? 'cursor-not-allowed bg-neutral-400 dark:bg-neutral-700'
            : 'bg-violet-600 hover:bg-violet-700',
        )}
      >
        {busy
          ? faucet.status === 'pending'
            ? 'Confirm in wallet…'
            : 'Claiming…'
          : onCooldown
            ? `Available in ${formatDuration(secondsRemaining)}`
            : 'Claim tokens'}
      </button>

      <div aria-live="polite" className="mt-3 min-h-5 text-sm">
        {faucet.status === 'success' && faucet.txHash && (
          <a
            href={explorerTxUrl(chain.id, faucet.txHash)}
            target="_blank"
            rel="noreferrer"
            className="text-emerald-600 hover:underline dark:text-emerald-400"
          >
            ✓ Claimed — view transaction
          </a>
        )}
        {faucet.status === 'error' && faucet.error && (
          <span className="text-red-600 dark:text-red-400">{faucet.error}</span>
        )}
      </div>
    </Card>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-black/10 p-6 dark:border-white/10">{children}</div>
  );
}
