'use client';

import { useQueries } from '@tanstack/react-query';
import type { Address } from 'viem';

import { MAINNET_CHAINS } from '@/config/chains';
import type { ApiResponse, ChainPortfolio } from '@/types';

async function fetchPortfolio(address: string, chainId: number): Promise<ChainPortfolio> {
  const res = await fetch(`/api/portfolio?address=${address}&chainId=${chainId}`);
  const json = (await res.json()) as ApiResponse<ChainPortfolio>;
  if (!json.success) throw new Error(json.error.message);
  return json.data;
}

export interface PortfolioResult {
  perChain: ChainPortfolio[];
  totalUsd: number;
  isLoading: boolean;
  isError: boolean;
}

/** Read-only portfolio across all mainnets for `address`, fetched in parallel. */
export function usePortfolio(address: Address | undefined): PortfolioResult {
  const queries = useQueries({
    queries: MAINNET_CHAINS.map((chain) => ({
      queryKey: ['portfolio', address, chain.id] as const,
      queryFn: () => fetchPortfolio(address as string, chain.id),
      enabled: Boolean(address),
      staleTime: 30_000,
    })),
  });

  const perChain = queries.flatMap((q) => (q.data ? [q.data] : []));
  return {
    perChain,
    totalUsd: perChain.reduce((acc, chain) => acc + chain.totalUsd, 0),
    isLoading: queries.some((q) => q.fetchStatus === 'fetching'),
    isError: queries.length > 0 && queries.every((q) => q.isError),
  };
}
