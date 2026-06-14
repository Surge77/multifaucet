/** Minimal ABI for the on-chain interactions the app performs against TokenFaucet. */
export const tokenFaucetAbi = [
  {
    type: 'function',
    name: 'claim',
    inputs: [
      { name: 'nonce', type: 'uint256' },
      { name: 'deadline', type: 'uint256' },
      { name: 'signature', type: 'bytes' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'dripAmount',
    inputs: [],
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'timeUntilNextClaim',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'canClaim',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'paused',
    inputs: [],
    outputs: [{ type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'event',
    name: 'Claimed',
    inputs: [
      { name: 'to', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
      { name: 'timestamp', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'error',
    name: 'CooldownActive',
    inputs: [{ name: 'secondsRemaining', type: 'uint256' }],
  },
  { type: 'error', name: 'FaucetEmpty', inputs: [] },
  { type: 'error', name: 'InvalidSignature', inputs: [] },
  { type: 'error', name: 'VoucherExpired', inputs: [] },
  { type: 'error', name: 'NonceAlreadyUsed', inputs: [] },
] as const;

/** EIP-712 typed-data definition shared by the signer (server) and chain. */
export const CLAIM_VOUCHER_TYPES = {
  Claim: [
    { name: 'recipient', type: 'address' },
    { name: 'nonce', type: 'uint256' },
    { name: 'deadline', type: 'uint256' },
  ],
} as const;

export const CLAIM_VOUCHER_DOMAIN_NAME = 'TokenFaucet';
export const CLAIM_VOUCHER_DOMAIN_VERSION = '1';
