'use client';

import { useCallback, useMemo, useSyncExternalStore } from 'react';

function subscribe(callback: () => void): () => void {
  window.addEventListener('storage', callback);
  return () => window.removeEventListener('storage', callback);
}

function readRaw(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

/**
 * SSR-safe persisted state via `useSyncExternalStore` (avoids set-state-in-effect
 * and hydration mismatches). `initial` must be a stable reference. Writes also
 * dispatch a `storage` event so the same tab re-reads immediately.
 */
export function useLocalStorage<T>(key: string, initial: T): [T, (value: T) => void] {
  const raw = useSyncExternalStore(
    subscribe,
    () => readRaw(key),
    () => null,
  );

  const value = useMemo(() => {
    if (raw === null) return initial;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return initial;
    }
  }, [raw, initial]);

  const setValue = useCallback(
    (next: T) => {
      try {
        window.localStorage.setItem(key, JSON.stringify(next));
        window.dispatchEvent(new StorageEvent('storage', { key }));
      } catch {
        // storage unavailable (private mode / quota) — state simply won't persist
      }
    },
    [key],
  );

  return [value, setValue];
}
