import { logError, logWarn } from './logger';

const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const REQUEST_TIMEOUT_MS = 5_000;

/**
 * Verify a Cloudflare Turnstile token server-side. When `TURNSTILE_SECRET_KEY`
 * is unset, captcha is skipped in non-production (local dev) but refused in
 * production, so a misconfigured deploy fails closed rather than open.
 */
export async function verifyTurnstile(token: string, ip?: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') return false;
    logWarn('turnstile', 'TURNSTILE_SECRET_KEY unset; skipping captcha (non-production only)');
    return true;
  }

  try {
    const body = new URLSearchParams({ secret, response: token });
    if (ip) body.set('remoteip', ip);
    const res = await fetch(VERIFY_URL, {
      method: 'POST',
      body,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch (error) {
    logError('turnstile.verify', error);
    return false;
  }
}
