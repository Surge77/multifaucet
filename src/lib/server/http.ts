import { apiError } from '@/lib/api';

import { rateLimit } from './rate-limit';

const WINDOW_MS = 60_000;

/** Best-effort client IP from proxy headers; falls back to a shared bucket. */
function clientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]!.trim();
  return request.headers.get('x-real-ip')?.trim() || 'unknown';
}

/**
 * Enforce a per-IP, per-route rate limit. Returns a 429 `Response` when the
 * caller is over budget, or `null` to let the handler proceed.
 */
export function enforceRateLimit(request: Request, route: string, limit: number): Response | null {
  const result = rateLimit(`${route}:${clientIp(request)}`, limit, WINDOW_MS);
  if (result.ok) return null;
  return Response.json(apiError('RATE_LIMITED', 'Too many requests; slow down'), {
    status: 429,
    headers: { 'retry-after': String(result.retryAfterSec) },
  });
}
