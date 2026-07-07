import type { Metadata } from 'next';
import { Archivo, Fraunces, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';
import { Providers } from '@/lib/providers';
import { WebVitals } from '@/components/web-vitals';

const fraunces = Fraunces({
  variable: '--font-fraunces',
  subsets: ['latin'],
  style: ['normal', 'italic'],
});

const archivo = Archivo({
  variable: '--font-archivo',
  subsets: ['latin'],
});

const plexMono = IBM_Plex_Mono({
  variable: '--font-plex-mono',
  subsets: ['latin'],
  weight: ['400', '500', '600'],
});

export const metadata: Metadata = {
  title: 'MultiFaucet — testnet faucet + multi-chain portfolio',
  description:
    'Claim testnet tokens from a custom on-chain faucet across Sepolia, Base, and Arbitrum, and view a read-only multi-chain portfolio with live USD values.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${fraunces.variable} ${archivo.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <a
          href="#main"
          className="bg-accent text-accentink sr-only z-50 px-4 py-2 font-mono text-sm tracking-wide uppercase focus:not-sr-only focus:absolute focus:top-4 focus:left-4"
        >
          Skip to content
        </a>
        <WebVitals />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
