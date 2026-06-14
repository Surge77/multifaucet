/**
 * Fixed-window in-memory rate limiter.
 *
 * Best-effort by design: state lives in a single serverless instance, so limits
 * are per-instance, not global. It is a first abuse barrier in front of the
 * metered upstreams (Alchemy / CoinGecko), not a hard quota. A distributed
 * limiter would need an external store, which the locked stack does not include.
 */
interface Window {
  count: number;
  resetAt: number;
}

export interface RateLimitResult {
  ok: boolean;
  /** Seconds until the window resets. 0 when the request is allowed. */
  retryAfterSec: number;
}

/** Stop the bucket map from growing without bound under many distinct keys. */
const MAX_BUCKETS = 10_000;

const buckets = new Map<string, Window>();

function sweep(now: number): void {
  for (const [key, window] of buckets) {
    if (window.resetAt <= now) buckets.delete(key);
  }
}

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
  now: number = Date.now(),
): RateLimitResult {
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    if (buckets.size >= MAX_BUCKETS) sweep(now);
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfterSec: 0 };
  }

  if (existing.count >= limit) {
    return { ok: false, retryAfterSec: Math.ceil((existing.resetAt - now) / 1000) };
  }

  existing.count += 1;
  return { ok: true, retryAfterSec: 0 };
}

/** Test-only: drop all window state so cases stay isolated. */
export function resetRateLimits(): void {
  buckets.clear();
}
