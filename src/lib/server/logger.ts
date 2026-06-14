/**
 * Minimal structured server logger. Emits one JSON line per event to stderr,
 * which Vercel captures as a runtime log. Kept dependency-free on purpose — the
 * locked stack forbids adding an APM/logging library without approval.
 *
 * Never pass secrets or request bodies as `meta`; addresses are public on-chain
 * data and safe to include for debugging.
 */
type LogMeta = Record<string, string | number | boolean | null | undefined>;

function emit(level: 'error' | 'warn', scope: string, message: string, meta?: LogMeta): void {
  const line = JSON.stringify({ level, scope, message, at: new Date().toISOString(), ...meta });
  console[level](line);
}

export function logError(scope: string, error: unknown, meta?: LogMeta): void {
  const message = error instanceof Error ? error.message : String(error);
  emit('error', scope, message, meta);
}

export function logWarn(scope: string, message: string, meta?: LogMeta): void {
  emit('warn', scope, message, meta);
}
