import { apiError, apiSuccess } from '@/lib/api';
import { clientIp, enforceRateLimit } from '@/lib/server/http';
import { signClaimVoucher } from '@/lib/server/faucet-signer';
import { logError } from '@/lib/server/logger';
import { verifyTurnstile } from '@/lib/server/turnstile';
import { faucetVoucherSchema } from '@/lib/validation';

const RATE_LIMIT = 10;

export async function POST(request: Request) {
  const limited = await enforceRateLimit(request, 'faucet-voucher', RATE_LIMIT);
  if (limited) return limited;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(apiError('INVALID_BODY', 'Malformed JSON'), { status: 400 });
  }

  const parsed = faucetVoucherSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      apiError('INVALID_REQUEST', parsed.error.issues[0]?.message ?? 'Invalid request'),
      { status: 400 },
    );
  }
  const { address, chainId, turnstileToken } = parsed.data;

  const isHuman = await verifyTurnstile(turnstileToken, clientIp(request));
  if (!isHuman) {
    return Response.json(apiError('CAPTCHA_FAILED', 'Captcha verification failed'), {
      status: 403,
    });
  }

  try {
    const voucher = await signClaimVoucher(address, chainId);
    if (!voucher) {
      return Response.json(apiError('FAUCET_UNAVAILABLE', 'Faucet not available on this chain'), {
        status: 503,
      });
    }
    return Response.json(apiSuccess(voucher));
  } catch (error) {
    logError('api.faucet-voucher', error);
    return Response.json(apiError('VOUCHER_ERROR', 'Failed to issue voucher'), { status: 500 });
  }
}
