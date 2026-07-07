'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import Link from 'next/link';

import { ThemeToggle } from '@/components/theme-toggle';

export function SiteHeader() {
  return (
    <header className="border-line bg-bg/85 sticky top-0 z-10 border-b backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="group flex items-center gap-3">
          <span
            aria-hidden
            className="border-linestrong group-hover:border-accent flex size-8 items-center justify-center border transition-colors"
          >
            <svg viewBox="0 0 16 16" className="size-4" fill="var(--accent)">
              <path d="M8 2.5 q4.2 5.6 0 9 q-4.2 -3.4 0 -9z" />
            </svg>
          </span>
          <span className="font-display text-lg font-medium tracking-tight">
            MultiFaucet
            <span className="text-inkmute ml-2 hidden font-mono text-[10px] tracking-[0.24em] uppercase sm:inline">
              Supply desk
            </span>
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <ConnectButton accountStatus="address" chainStatus="none" showBalance={false} />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
