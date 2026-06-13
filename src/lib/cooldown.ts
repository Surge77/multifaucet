/** Whole seconds remaining until `targetMs`, clamped to 0. */
export function secondsUntil(targetMs: number, nowMs: number): number {
  if (targetMs <= nowMs) return 0;
  return Math.ceil((targetMs - nowMs) / 1000);
}

/** Convert an on-chain "seconds remaining" reading into an absolute unlock time. */
export function unlockTimestamp(secondsRemaining: number, nowMs: number): number {
  return nowMs + secondsRemaining * 1000;
}
