import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

import { logError } from './logger';

/**
 * Rate limiter with two backends:
 *
 * - **Upstash Redis** (distributed) when `UPSTASH_REDIS_REST_URL/TOKEN` are set
 *   — a global quota shared across all serverless instances.
 * - **In-memory fixed-window** otherwise (local dev, tests) and as a fail-open
 *   fallback if Redis is unreachable, so an outage never takes down the API.
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

function upstashConfigured(): boolean {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

// One Ratelimit per distinct request budget; the window is otherwise constant.
const limiters = new Map<number, Ratelimit>();

function getLimiter(limit: number, windowMs: number): Ratelimit {
  let limiter = limiters.get(limit);
  if (!limiter) {
    limiter = new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(limit, `${Math.round(windowMs / 1000)} s`),
      prefix: 'mf-rl',
    });
    limiters.set(limit, limiter);
  }
  return limiter;
}

/**
 * Distributed rate-limit check, falling back to the in-memory limiter when
 * Upstash is not configured or unreachable.
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  if (!upstashConfigured()) return rateLimit(key, limit, windowMs);

  try {
    const { success, reset } = await getLimiter(limit, windowMs).limit(key);
    if (success) return { ok: true, retryAfterSec: 0 };
    return { ok: false, retryAfterSec: Math.max(0, Math.ceil((reset - Date.now()) / 1000)) };
  } catch (error) {
    logError('ratelimit.upstash', error);
    return rateLimit(key, limit, windowMs);
  }
}
