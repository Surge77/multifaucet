import { Dashboard } from '@/components/dashboard';
import { SiteHeader } from '@/components/site-header';

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <section className="mx-auto max-w-5xl px-4 pt-12 pb-2 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-balance sm:text-5xl">
            Fund testnets. Watch mainnets.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-pretty text-neutral-600 dark:text-neutral-300">
            Claim testnet tokens from a custom on-chain faucet across Sepolia, Base, and Arbitrum —
            then view a read-only, multi-chain portfolio with live USD values. No keys in the
            browser, no custody.
          </p>
        </section>
        <Dashboard />
      </main>
      <footer className="border-t border-black/10 py-6 text-center text-sm text-neutral-500 dark:border-white/10">
        <a
          href="https://github.com/Surge77/multifaucet"
          className="hover:underline"
          target="_blank"
          rel="noreferrer"
        >
          Source on GitHub
        </a>
      </footer>
    </>
  );
}
