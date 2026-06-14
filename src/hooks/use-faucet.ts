'use client';

import { useEffect, useMemo } from 'react';
import {
  useAccount,
  useReadContracts,
  useWaitForTransactionReceipt,
  useWriteContract,
} from 'wagmi';

import { tokenFaucetAbi } from '@/config/abi';
import { getChain } from '@/config/chains';
import { unlockTimestamp } from '@/lib/cooldown';

export type ClaimStatus = 'idle' | 'pending' | 'confirming' | 'success' | 'error';

export interface FaucetData {
  /** True when the connected chain has a deployed faucet. */
  isAvailable: boolean;
  dripAmount: bigint | undefined;
  canClaim: boolean;
  /** Absolute time the next claim unlocks, or null when claimable now. */
  unlockAtMs: number | null;
  isLoading: boolean;
  claim: () => void;
  status: ClaimStatus;
  txHash: `0x${string}` | undefined;
  error: string | null;
}

function describeError(error: unknown): string {
  if (error && typeof error === 'object' && 'shortMessage' in error) {
    return String((error as { shortMessage: unknown }).shortMessage);
  }
  return 'Transaction failed';
}

export function useFaucet(): FaucetData {
  const { address, chainId } = useAccount();
  const faucet = chainId !== undefined ? getChain(chainId)?.faucet : undefined;
  const isAvailable = Boolean(faucet);
  const enabled = Boolean(faucet && address);

  const reads = useReadContracts({
    query: { enabled, refetchInterval: 30_000 },
    contracts: faucet
      ? [
          { address: faucet.faucet, abi: tokenFaucetAbi, functionName: 'dripAmount' },
          {
            address: faucet.faucet,
            abi: tokenFaucetAbi,
            functionName: 'timeUntilNextClaim',
            args: [address ?? '0x0000000000000000000000000000000000000000'],
          },
          {
            address: faucet.faucet,
            abi: tokenFaucetAbi,
            functionName: 'canClaim',
            args: [address ?? '0x0000000000000000000000000000000000000000'],
          },
        ]
      : [],
  });

  const dripAmount = reads.data?.[0]?.result as bigint | undefined;
  const secondsRemaining = reads.data?.[1]?.result as bigint | undefined;
  const canClaim = (reads.data?.[2]?.result as boolean | undefined) ?? false;

  const unlockAtMs = useMemo(() => {
    if (secondsRemaining === undefined || secondsRemaining === 0n || !reads.dataUpdatedAt) {
      return null;
    }
    return unlockTimestamp(Number(secondsRemaining), reads.dataUpdatedAt);
  }, [secondsRemaining, reads.dataUpdatedAt]);

  const { writeContract, data: txHash, isPending, error: writeError, reset } = useWriteContract();
  const receipt = useWaitForTransactionReceipt({ hash: txHash });

  // Refresh on-chain reads once the claim is mined. Depend on the stable
  // refetch fn (not the whole `reads` object) to avoid a refetch loop.
  const { refetch } = reads;
  useEffect(() => {
    if (receipt.isSuccess) refetch();
  }, [receipt.isSuccess, refetch]);

  const status: ClaimStatus = writeError
    ? 'error'
    : receipt.isSuccess
      ? 'success'
      : receipt.isLoading
        ? 'confirming'
        : isPending
          ? 'pending'
          : 'idle';

  function claim() {
    if (!faucet) return;
    reset();
    writeContract({ address: faucet.faucet, abi: tokenFaucetAbi, functionName: 'claim' });
  }

  return {
    isAvailable,
    dripAmount,
    canClaim,
    unlockAtMs,
    isLoading: reads.isLoading,
    claim,
    status,
    txHash,
    error: writeError ? describeError(writeError) : null,
  };
}
