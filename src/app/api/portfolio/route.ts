import { apiError, apiSuccess } from '@/lib/api';
import { enforceRateLimit } from '@/lib/server/http';
import { logError } from '@/lib/server/logger';
import { getAllMainnetPortfolios, getChainPortfolio } from '@/lib/server/portfolio';
import { addressSchema, chainIdSchema } from '@/lib/validation';

const RATE_LIMIT = 30;

export async function GET(request: Request) {
  const limited = enforceRateLimit(request, 'portfolio', RATE_LIMIT);
  if (limited) return limited;

  const { searchParams } = new URL(request.url);
  const address = addressSchema.safeParse(searchParams.get('address') ?? '');
  if (!address.success) {
    return Response.json(apiError('INVALID_ADDRESS', 'Invalid EVM address'), { status: 400 });
  }

  // Omit `chainId` to fetch every mainnet in one request; pass it for one chain.
  const chainIdParam = searchParams.get('chainId');

  try {
    if (chainIdParam === null) {
      const data = await getAllMainnetPortfolios(address.data);
      return Response.json(apiSuccess(data));
    }
    const chainId = chainIdSchema.safeParse(chainIdParam);
    if (!chainId.success) {
      return Response.json(apiError('INVALID_CHAIN', 'Unsupported chain id'), { status: 400 });
    }
    const data = await getChainPortfolio(address.data, chainId.data);
    return Response.json(apiSuccess(data));
  } catch (error) {
    logError('api.portfolio', error);
    return Response.json(apiError('PORTFOLIO_ERROR', 'Failed to load balances'), { status: 502 });
  }
}
