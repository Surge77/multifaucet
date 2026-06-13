'use client';

import { useEffect, useState } from 'react';

import { secondsUntil } from '@/lib/cooldown';

/**
 * Live seconds-remaining countdown to `targetTimestampMs`. Ticks every second
 * while the target is in the future, then settles at 0.
 */
export function useCountdown(targetTimestampMs: number | null): number {
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    if (targetTimestampMs === null || targetTimestampMs <= Date.now()) return;
    const id = setInterval(() => setNowMs(Date.now()), 1_000);
    return () => clearInterval(id);
  }, [targetTimestampMs]);

  if (targetTimestampMs === null) return 0;
  return secondsUntil(targetTimestampMs, nowMs);
}
