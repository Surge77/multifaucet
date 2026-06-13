import { apiSuccess } from '@/lib/api';

export async function GET() {
  return Response.json(
    apiSuccess({
      alchemy: Boolean(process.env.ALCHEMY_API_KEY),
      coingecko: Boolean(process.env.COINGECKO_API_KEY),
      walletconnect: Boolean(process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID),
    }),
  );
}
