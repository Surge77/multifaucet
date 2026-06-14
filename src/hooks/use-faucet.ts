'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Hex } from 'viem';
import {
  useAccount,
  useReadContracts,
  useWaitForTransactionReceipt,
  useWriteContract,
} from 'wagmi';

import { tokenFaucetAbi } from '@/config/abi';
import { getChain } from '@/config/chains';
import { unlockTimestamp } from '@/lib/cooldown';
import type { ApiResponse } from '@/types';

export type ClaimStatus = 'idle' | 'requesting' | 'pending' | 'confirming' | 'success' | 'error';

interface ClaimVoucher {
  nonce: string;
  deadline: string;
  signature: Hex;
}

export interface FaucetData {
  /** True when the connected chain has a deployed faucet. */
  isAvailable: boolean;
  dripAmount: bigint | undefined;
  canClaim: boolean;
  /** Absolute time the next claim unlocks, or null when claimable now. */
  unlockAtMs: number | null;
  isLoading: boolean;
  /** Submit a claim using a Cloudflare Turnstile token. */
  claim: (turnstileToken: string) => void;
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

async function requestVoucher(
  address: string,
  chainId: number,
  turnstileToken: string,
): Promise<ClaimVoucher> {
  const res = await fetch('/api/faucet-voucher', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ address, chainId, turnstileToken }),
  });
  const json = (await res.json()) as ApiResponse<ClaimVoucher>;
  if (!json.success) throw new Error(json.error.message);
  return json.data;
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

  const [isRequesting, setIsRequesting] = useState(false);
  const [voucherError, setVoucherError] = useState<string | null>(null);

  // Refresh on-chain reads once the claim is mined. Depend on the stable
  // refetch fn (not the whole `reads` object) to avoid a refetch loop.
  const { refetch } = reads;
  useEffect(() => {
    if (receipt.isSuccess) refetch();
  }, [receipt.isSuccess, refetch]);

  const status: ClaimStatus =
    writeError || voucherError
      ? 'error'
      : receipt.isSuccess
        ? 'success'
        : receipt.isLoading
          ? 'confirming'
          : isPending
            ? 'pending'
            : isRequesting
              ? 'requesting'
              : 'idle';

  const claim = useCallback(
    async (turnstileToken: string) => {
      if (!faucet || !address || chainId === undefined) return;
      reset();
      setVoucherError(null);
      setIsRequesting(true);
      try {
        const voucher = await requestVoucher(address, chainId, turnstileToken);
        writeContract({
          address: faucet.faucet,
          abi: tokenFaucetAbi,
          functionName: 'claim',
          args: [BigInt(voucher.nonce), BigInt(voucher.deadline), voucher.signature],
        });
      } catch (error) {
        setVoucherError(error instanceof Error ? error.message : 'Could not get a claim voucher');
      } finally {
        setIsRequesting(false);
      }
    },
    [faucet, address, chainId, reset, writeContract],
  );

  return {
    isAvailable,
    dripAmount,
    canClaim,
    unlockAtMs,
    isLoading: reads.isLoading,
    claim,
    status,
    txHash,
    error: voucherError ?? (writeError ? describeError(writeError) : null),
  };
}
