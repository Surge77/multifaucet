import { type Address, decodeEventLog, encodeEventTopics } from 'viem';

import { tokenFaucetAbi } from '@/config/abi';
import { getChain } from '@/config/chains';
import type { FaucetClaim } from '@/types';

import { logError } from './logger';
import { alchemyRpcUrl } from './rpc';
import { recentFromBlock, rpcCall } from './transfers';

const MAX_CLAIMS = 25;

interface RpcLog {
  data: `0x${string}`;
  topics: [`0x${string}`, ...`0x${string}`[]];
  transactionHash: `0x${string}`;
  blockNumber: `0x${string}`;
}

function toClaim(log: RpcLog): FaucetClaim | null {
  try {
    const { args } = decodeEventLog({
      abi: tokenFaucetAbi,
      eventName: 'Claimed',
      data: log.data,
      topics: log.topics,
    });
    return {
      txHash: log.transactionHash,
      amount: (args.amount as bigint).toString(),
      timestamp: Number(args.timestamp as bigint),
      blockNumber: Number(BigInt(log.blockNumber)),
    };
  } catch {
    return null;
  }
}

/**
 * Recent faucet `Claimed` events for `address` on `chainId`, newest first.
 * Returns `[]` when no faucet is deployed or no Alchemy key is configured.
 */
export async function getFaucetClaims(address: Address, chainId: number): Promise<FaucetClaim[]> {
  const url = alchemyRpcUrl(chainId);
  const faucet = getChain(chainId)?.faucet?.faucet;
  if (!url || !faucet) return [];

  try {
    const topics = encodeEventTopics({
      abi: tokenFaucetAbi,
      eventName: 'Claimed',
      args: { to: address },
    });
    const fromBlock = await recentFromBlock(url, chainId);
    const logs = await rpcCall<RpcLog[]>(url, 'eth_getLogs', [
      { address: faucet, topics, fromBlock, toBlock: 'latest' },
    ]);
    if (!logs) return [];

    return logs
      .map(toClaim)
      .filter((claim): claim is FaucetClaim => claim !== null)
      .sort((a, b) => b.blockNumber - a.blockNumber)
      .slice(0, MAX_CLAIMS);
  } catch (error) {
    logError('faucet-claims.fetch', error, { chainId });
    return [];
  }
}
