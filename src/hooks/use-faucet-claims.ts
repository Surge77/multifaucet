'use client';

import { useQuery } from '@tanstack/react-query';
import { useAccount } from 'wagmi';

import { getChain } from '@/config/chains';
import type { ApiResponse, FaucetClaim } from '@/types';

async function fetchClaims(address: string, chainId: number): Promise<FaucetClaim[]> {
  const res = await fetch(`/api/faucet-claims?address=${address}&chainId=${chainId}`);
  const json = (await res.json()) as ApiResponse<FaucetClaim[]>;
  if (!json.success) throw new Error(json.error.message);
  return json.data;
}

export interface FaucetClaimsResult {
  claims: FaucetClaim[];
  isLoading: boolean;
}

/** Recent faucet claims for the connected address on the active chain. */
export function useFaucetClaims(): FaucetClaimsResult {
  const { address, chainId } = useAccount();
  const faucet = chainId !== undefined ? getChain(chainId)?.faucet : undefined;
  const enabled = Boolean(address && faucet);

  const query = useQuery({
    queryKey: ['faucet-claims', address, chainId] as const,
    queryFn: () => fetchClaims(address as string, chainId as number),
    enabled,
    staleTime: 30_000,
  });

  return { claims: query.data ?? [], isLoading: query.fetchStatus === 'fetching' };
}
