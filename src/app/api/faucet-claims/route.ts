import { apiError, apiSuccess } from '@/lib/api';
import { getFaucetClaims } from '@/lib/server/faucet-claims';
import { enforceRateLimit } from '@/lib/server/http';
import { logError } from '@/lib/server/logger';
import { addressSchema, chainIdSchema } from '@/lib/validation';

const RATE_LIMIT = 30;

export async function GET(request: Request) {
  const limited = await enforceRateLimit(request, 'faucet-claims', RATE_LIMIT);
  if (limited) return limited;

  const { searchParams } = new URL(request.url);
  const address = addressSchema.safeParse(searchParams.get('address') ?? '');
  if (!address.success) {
    return Response.json(apiError('INVALID_ADDRESS', 'Invalid EVM address'), { status: 400 });
  }
  const chainId = chainIdSchema.safeParse(searchParams.get('chainId') ?? '');
  if (!chainId.success) {
    return Response.json(apiError('INVALID_CHAIN', 'Unsupported chain id'), { status: 400 });
  }

  try {
    const data = await getFaucetClaims(address.data, chainId.data);
    return Response.json(apiSuccess(data));
  } catch (error) {
    logError('api.faucet-claims', error);
    return Response.json(apiError('CLAIMS_ERROR', 'Failed to load claim history'), { status: 502 });
  }
}
