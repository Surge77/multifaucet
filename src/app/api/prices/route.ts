import { apiError, apiSuccess } from '@/lib/api';
import { enforceRateLimit } from '@/lib/server/http';
import { fetchPrices } from '@/lib/server/prices';
import { coingeckoIdsSchema } from '@/lib/validation';

const RATE_LIMIT = 60;

export async function GET(request: Request) {
  const limited = enforceRateLimit(request, 'prices', RATE_LIMIT);
  if (limited) return limited;

  const { searchParams } = new URL(request.url);
  const parsed = coingeckoIdsSchema.safeParse(searchParams.get('ids') ?? '');
  if (!parsed.success) {
    return Response.json(
      apiError('INVALID_IDS', parsed.error.issues[0]?.message ?? 'Invalid ids'),
      {
        status: 400,
      },
    );
  }

  const prices = await fetchPrices(parsed.data);
  return Response.json(apiSuccess(prices));
}
