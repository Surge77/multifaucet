import { apiError, apiSuccess } from '@/lib/api';
import { getTransfers } from '@/lib/server/transfers';
import { addressSchema, chainIdSchema } from '@/lib/validation';

export async function GET(request: Request) {
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
    const data = await getTransfers(address.data, chainId.data);
    return Response.json(apiSuccess(data));
  } catch {
    return Response.json(apiError('TRANSFERS_ERROR', 'Failed to load transfers'), { status: 502 });
  }
}
