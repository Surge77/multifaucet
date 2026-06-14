import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { http } from 'wagmi';
import {
  arbitrum,
  arbitrumSepolia,
  base,
  baseSepolia,
  mainnet,
  optimism,
  polygon,
  sepolia,
} from 'viem/chains';

// WalletConnect Cloud project id. Required for the WalletConnect connector;
// injected/Coinbase wallets still work without it during local dev.
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? '';

// Client-side transports use each chain's default public RPC (no API key in the
// browser). Heavy portfolio reads go through the server proxy in /api/* instead.
export const wagmiConfig = getDefaultConfig({
  appName: 'MultiFaucet',
  projectId,
  ssr: true,
  chains: [mainnet, base, arbitrum, optimism, polygon, sepolia, baseSepolia, arbitrumSepolia],
  transports: {
    [mainnet.id]: http(),
    [base.id]: http(),
    [arbitrum.id]: http(),
    [optimism.id]: http(),
    [polygon.id]: http(),
    [sepolia.id]: http(),
    [baseSepolia.id]: http(),
    [arbitrumSepolia.id]: http(),
  },
});
