'use client';

import { useAccount } from 'wagmi';

import { explorerTxUrl, getChain } from '@/config/chains';
import { useFaucetClaims } from '@/hooks/use-faucet-claims';
import { formatTokenAmount } from '@/lib/format';

const FAUCET_DECIMALS = 18;

export function ClaimHistory() {
  const { chainId } = useAccount();
  const chain = chainId !== undefined ? getChain(chainId) : undefined;
  const { claims, isLoading } = useFaucetClaims();

  // Nothing to show until at least one claim exists.
  if (!chain || (!isLoading && claims.length === 0)) return null;

  return (
    <div className="mt-6 border-t border-black/10 pt-4 dark:border-white/10">
      <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">
        Your recent claims
      </h3>
      <ul className="mt-2 space-y-1">
        {claims.map((claim) => (
          <li key={claim.txHash} className="flex items-center justify-between text-sm">
            <span className="tabular-nums">
              {formatTokenAmount(BigInt(claim.amount), FAUCET_DECIMALS)} MFT
            </span>
            <a
              href={explorerTxUrl(chain.id, claim.txHash)}
              target="_blank"
              rel="noreferrer"
              className="text-neutral-500 hover:underline"
            >
              {new Date(claim.timestamp * 1000).toLocaleDateString()} ↗
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
