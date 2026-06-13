import { apiError, apiSuccess } from '@/lib/api';
import { fetchPrices } from '@/lib/server/coingecko';
import { coingeckoIdsSchema } from '@/lib/validation';

export async function GET(request: Request) {
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
