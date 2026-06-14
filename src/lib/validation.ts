import { getAddress, isAddress } from 'viem';
import { z } from 'zod';

import { isSupportedChain } from '@/config/chains';

/** A checksummed EVM address. Rejects malformed input before it reaches an RPC. */
export const addressSchema = z
  .string()
  .refine((value) => isAddress(value), { message: 'Invalid EVM address' })
  .transform((value) => getAddress(value));

/** A supported chain id parsed from a query string. */
export const chainIdSchema = z.coerce
  .number()
  .int()
  .refine((id) => isSupportedChain(id), { message: 'Unsupported chain id' });

/** Comma-separated CoinGecko ids → a deduped, non-empty list of slugs. */
export const coingeckoIdsSchema = z
  .string()
  .transform((value) =>
    Array.from(
      new Set(
        value
          .split(',')
          .map((s) => s.trim().toLowerCase())
          .filter(Boolean),
      ),
    ),
  )
  .refine((ids) => ids.length > 0 && ids.length <= 50, {
    message: 'Provide between 1 and 50 ids',
  })
  .refine((ids) => ids.every((id) => /^[a-z0-9-]+$/.test(id)), {
    message: 'Ids may only contain lowercase letters, digits, and hyphens',
  });

/** POST body for a faucet claim voucher request. */
export const faucetVoucherSchema = z.object({
  address: addressSchema,
  chainId: chainIdSchema,
  turnstileToken: z.string().min(1).max(2048),
});
