'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import Link from 'next/link';

import { ThemeToggle } from '@/components/theme-toggle';

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-10 border-b border-black/10 bg-white/70 backdrop-blur dark:border-white/10 dark:bg-neutral-950/70">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span aria-hidden className="text-xl">
            🚰
          </span>
          <span>MultiFaucet</span>
        </Link>
        <div className="flex items-center gap-3">
          <ConnectButton accountStatus="address" chainStatus="none" showBalance={false} />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
