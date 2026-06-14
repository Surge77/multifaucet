'use client';

import { useQuery } from '@tanstack/react-query';
import type { Address } from 'viem';

import type { ApiResponse, ChainPortfolio } from '@/types';

async function fetchPortfolio(address: string): Promise<ChainPortfolio[]> {
  const res = await fetch(`/api/portfolio?address=${address}`);
  const json = (await res.json()) as ApiResponse<ChainPortfolio[]>;
  if (!json.success) throw new Error(json.error.message);
  return json.data;
}

export interface PortfolioResult {
  perChain: ChainPortfolio[];
  totalUsd: number;
  isLoading: boolean;
  isError: boolean;
}

/** Read-only portfolio across all mainnets for `address`, in a single request. */
export function usePortfolio(address: Address | undefined): PortfolioResult {
  const query = useQuery({
    queryKey: ['portfolio', address] as const,
    queryFn: () => fetchPortfolio(address as string),
    enabled: Boolean(address),
    staleTime: 30_000,
  });

  const perChain = query.data ?? [];
  return {
    perChain,
    totalUsd: perChain.reduce((acc, chain) => acc + chain.totalUsd, 0),
    isLoading: query.fetchStatus === 'fetching',
    isError: query.isError,
  };
}
