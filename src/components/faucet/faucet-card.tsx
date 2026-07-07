'use client';

import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile';
import { useRef, useState } from 'react';
import { useAccount } from 'wagmi';

import { useCountdown } from '@/hooks/use-countdown';
import { useFaucet } from '@/hooks/use-faucet';
import { explorerTxUrl, getChain } from '@/config/chains';
import { formatDuration, formatTokenAmount } from '@/lib/format';
import { cn } from '@/lib/utils';

import { ClaimHistory } from './claim-history';

const FAUCET_DECIMALS = 18;
// Cloudflare "always passes" test key; real key comes from env in production.
const TEST_SITE_KEY = '1x00000000000000000000AA';
const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? TEST_SITE_KEY;

export function FaucetCard() {
  const { chainId } = useAccount();
  const chain = chainId !== undefined ? getChain(chainId) : undefined;
  const faucet = useFaucet();
  const secondsRemaining = useCountdown(faucet.unlockAtMs);

  const turnstileRef = useRef<TurnstileInstance>(null);
  const [token, setToken] = useState('');

  // A Turnstile token is single-use. Consume it on submit and reset the widget
  // so it issues a fresh token for any follow-up claim.
  function submitClaim() {
    const current = token;
    setToken('');
    turnstileRef.current?.reset();
    faucet.claim(current);
  }

  if (!chain || chain.kind !== 'testnet') {
    return (
      <Card>
        <p className="text-inkmute text-sm">
          Switch to a testnet — Sepolia, Base Sepolia, or Arbitrum Sepolia — to claim MFT.
        </p>
      </Card>
    );
  }

  if (!faucet.isAvailable) {
    return (
      <Card>
        <p className="text-inkmute text-sm">No faucet is deployed on {chain.name} yet.</p>
      </Card>
    );
  }

  const drip =
    faucet.dripAmount !== undefined ? formatTokenAmount(faucet.dripAmount, FAUCET_DECIMALS) : '—';
  const onCooldown = secondsRemaining > 0;
  const busy =
    faucet.status === 'requesting' || faucet.status === 'pending' || faucet.status === 'confirming';
  const disabled = busy || onCooldown || !faucet.canClaim || !token;

  return (
    <Card>
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="font-display text-2xl font-medium">Claim MFT</h2>
        <span className="border-line text-inkmute border px-2 py-0.5 font-mono text-[10px] tracking-[0.18em] uppercase">
          {chain.name}
        </span>
      </div>

      <dl className="divide-line border-line mt-5 flex flex-wrap divide-x border border-dashed font-mono text-xs">
        <SpecCell term="Drip" value={`${drip} MFT`} />
        <SpecCell term="Interval" value="24H" />
        <SpecCell term="Scope" value="Per address" />
      </dl>

      {!onCooldown && (
        <div className="mt-5">
          <Turnstile
            ref={turnstileRef}
            siteKey={SITE_KEY}
            onSuccess={setToken}
            onExpire={() => setToken('')}
            onError={() => setToken('')}
            options={{ size: 'flexible' }}
          />
        </div>
      )}

      <button
        type="button"
        onClick={submitClaim}
        disabled={disabled}
        aria-disabled={disabled}
        className={cn(
          'mt-6 w-full px-4 py-4 font-mono text-sm font-semibold tracking-[0.18em] uppercase transition-[transform,box-shadow,background-color,color] duration-150',
          disabled
            ? 'border-line bg-surface2 text-inkmute cursor-not-allowed border'
            : 'bg-accent text-accentink hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_var(--ink)] active:translate-x-0 active:translate-y-0 active:shadow-none',
        )}
      >
        {busy
          ? faucet.status === 'requesting'
            ? 'Verifying…'
            : faucet.status === 'pending'
              ? 'Confirm in wallet…'
              : 'Claiming…'
          : onCooldown
            ? `Available in ${formatDuration(secondsRemaining)}`
            : !token
              ? 'Complete the captcha'
              : 'Claim tokens'}
      </button>

      <div aria-live="polite" className="mt-3 min-h-5 font-mono text-sm">
        {faucet.status === 'success' && faucet.txHash && (
          <a
            href={explorerTxUrl(chain.id, faucet.txHash)}
            target="_blank"
            rel="noreferrer"
            className="text-teal hover:underline"
          >
            ✓ Claimed — view transaction
          </a>
        )}
        {faucet.status === 'error' && faucet.error && (
          <span className="text-danger">{faucet.error}</span>
        )}
      </div>

      <ClaimHistory />
    </Card>
  );
}

function SpecCell({ term, value }: { term: string; value: string }) {
  return (
    <div className="flex flex-1 flex-col gap-1 px-4 py-3 whitespace-nowrap">
      <dt className="text-inkmute text-[10px] tracking-[0.24em] uppercase">{term}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="plate p-6 sm:p-7">{children}</div>;
}
