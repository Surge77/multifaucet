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
    <div className="border-line mt-7 border-t border-dashed pt-4">
      <h3 className="text-inkmute font-mono text-[10px] tracking-[0.28em] uppercase">
        Your recent claims
      </h3>
      <ul className="mt-3 space-y-1.5">
        {claims.map((claim) => (
          <li key={claim.txHash} className="flex items-center justify-between font-mono text-sm">
            <span className="tabular-nums">
              {formatTokenAmount(BigInt(claim.amount), FAUCET_DECIMALS)} MFT
            </span>
            <a
              href={explorerTxUrl(chain.id, claim.txHash)}
              target="_blank"
              rel="noreferrer"
              className="text-inkmute hover:text-accent transition-colors hover:underline"
            >
              {new Date(claim.timestamp * 1000).toLocaleDateString()} ↗
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
