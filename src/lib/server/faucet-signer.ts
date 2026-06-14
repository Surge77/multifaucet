import { type Address, type Hex, bytesToBigInt } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

import {
  CLAIM_VOUCHER_DOMAIN_NAME,
  CLAIM_VOUCHER_DOMAIN_VERSION,
  CLAIM_VOUCHER_TYPES,
} from '@/config/abi';
import { getChain } from '@/config/chains';

/** Voucher validity window: long enough to confirm in-wallet, short to limit replay surface. */
const VOUCHER_TTL_SECONDS = 600;

export interface ClaimVoucher {
  nonce: string;
  deadline: string;
  signature: Hex;
}

function randomNonce(): bigint {
  return bytesToBigInt(crypto.getRandomValues(new Uint8Array(32)));
}

/**
 * Sign an EIP-712 claim voucher authorizing `recipient` to claim on `chainId`.
 * Returns `null` when the signer key is unset or the chain has no faucet.
 */
export async function signClaimVoucher(
  recipient: Address,
  chainId: number,
): Promise<ClaimVoucher | null> {
  const privateKey = process.env.FAUCET_SIGNER_PRIVATE_KEY as Hex | undefined;
  const faucet = getChain(chainId)?.faucet?.faucet;
  if (!privateKey || !faucet) return null;

  const account = privateKeyToAccount(privateKey);
  const nonce = randomNonce();
  const deadline = BigInt(Math.floor(Date.now() / 1000) + VOUCHER_TTL_SECONDS);

  const signature = await account.signTypedData({
    domain: {
      name: CLAIM_VOUCHER_DOMAIN_NAME,
      version: CLAIM_VOUCHER_DOMAIN_VERSION,
      chainId,
      verifyingContract: faucet,
    },
    types: CLAIM_VOUCHER_TYPES,
    primaryType: 'Claim',
    message: { recipient, nonce, deadline },
  });

  return { nonce: nonce.toString(), deadline: deadline.toString(), signature };
}
