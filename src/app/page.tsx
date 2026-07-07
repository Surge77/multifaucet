import { Dashboard } from '@/components/dashboard';
import { SiteHeader } from '@/components/site-header';
import { SUPPORTED_CHAINS } from '@/config/chains';

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="flex-1">
        <section className="mx-auto grid w-full max-w-5xl items-end gap-8 px-4 pt-14 pb-10 lg:grid-cols-[1fr_auto]">
          <div>
            <p className="rise text-inkmute font-mono text-[11px] tracking-[0.28em] uppercase">
              Fig. 01 — Multi-chain supply desk
            </p>
            <h1 className="rise rise-1 font-display mt-5 text-5xl leading-[1.02] font-medium tracking-tight text-balance sm:text-7xl">
              Fund testnets.
              <br />
              <em className="text-accent italic">Watch mainnets.</em>
            </h1>
            <p className="rise rise-2 text-inkmute mt-6 max-w-xl text-pretty">
              Claim testnet tokens from a custom on-chain faucet across Sepolia, Base, and Arbitrum
              — then view a read-only, multi-chain portfolio with live USD values. No keys in the
              browser, no custody.
            </p>
          </div>
          <FaucetSchematic />
        </section>

        <ChainTicker />

        <Dashboard />
      </main>
      <footer className="border-line border-t">
        <div className="text-inkmute mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-6 font-mono text-[11px] tracking-[0.2em] uppercase">
          <span>MultiFaucet — testnet supply &amp; mainnet ledger</span>
          <a
            href="https://github.com/Surge77/multifaucet"
            className="hover:text-accent transition-colors"
            target="_blank"
            rel="noreferrer"
          >
            Source ↗
          </a>
        </div>
      </footer>
    </>
  );
}

/* Line-art tap with three staggered droplets — the whole product in one glyph. */
function FaucetSchematic() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 160 200"
      className="rise rise-2 text-ink hidden h-48 w-40 lg:block"
      fill="none"
    >
      {/* pipe */}
      <path d="M10 34 H86 V58 H66" stroke="currentColor" strokeOpacity="0.55" strokeWidth="1.5" />
      <path d="M10 22 H98 V70 H66" stroke="currentColor" strokeOpacity="0.25" strokeWidth="1.5" />
      {/* valve wheel */}
      <circle cx="52" cy="22" r="12" stroke="currentColor" strokeOpacity="0.55" strokeWidth="1.5" />
      <path
        d="M52 10 V34 M40 22 H64"
        stroke="currentColor"
        strokeOpacity="0.55"
        strokeWidth="1.5"
      />
      {/* spout mouth */}
      <path d="M58 70 H74" stroke="currentColor" strokeWidth="2" />
      {/* droplets */}
      <g className="drip">
        <path d="M66 84 q5 7 0 11 q-5 -4 0 -11z" fill="var(--accent)" />
      </g>
      <g className="drip drip-2">
        <path d="M66 84 q5 7 0 11 q-5 -4 0 -11z" fill="var(--accent)" />
      </g>
      <g className="drip drip-3">
        <path d="M66 84 q5 7 0 11 q-5 -4 0 -11z" fill="var(--accent)" />
      </g>
      {/* catch line */}
      <path d="M34 168 H98" stroke="currentColor" strokeOpacity="0.4" strokeWidth="1.5" />
      <path d="M42 176 H90" stroke="currentColor" strokeOpacity="0.2" strokeWidth="1.5" />
      {/* annotation */}
      <text
        x="104"
        y="120"
        fill="currentColor"
        fillOpacity="0.5"
        fontSize="9"
        fontFamily="var(--font-plex-mono)"
        letterSpacing="1"
      >
        24H
      </text>
      <path d="M100 116 L82 104" stroke="currentColor" strokeOpacity="0.3" strokeWidth="1" />
    </svg>
  );
}

function ChainTicker() {
  const items = SUPPORTED_CHAINS.map((c) => ({
    label: c.shortName,
    kind: c.kind,
  }));

  const strip = (ariaHidden: boolean) => (
    <span aria-hidden={ariaHidden || undefined} className="flex shrink-0 items-center">
      {items.map(({ label, kind }) => (
        <span key={`${label}-${ariaHidden}`} className="flex items-center">
          <span className="px-5">
            {label}
            <span className="text-inkmute ml-2 text-[9px]">
              {kind === 'testnet' ? 'TEST' : 'MAIN'}
            </span>
          </span>
          <span className="text-accent">✕</span>
        </span>
      ))}
    </span>
  );

  return (
    <div className="ticker border-line overflow-hidden border-y py-2 font-mono text-[11px] tracking-[0.22em] uppercase">
      <div className="ticker-track flex w-max">
        {strip(false)}
        {strip(true)}
        {strip(true)}
        {strip(true)}
      </div>
    </div>
  );
}
