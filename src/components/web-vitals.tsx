'use client';

import { useReportWebVitals } from 'next/web-vitals';

/**
 * Reports Core Web Vitals to an analytics beacon when
 * `NEXT_PUBLIC_VITALS_URL` is configured. No-op otherwise — the app stays
 * stateless and ships no third-party analytics by default.
 */
export function WebVitals() {
  useReportWebVitals((metric) => {
    const url = process.env.NEXT_PUBLIC_VITALS_URL;
    if (!url || typeof navigator === 'undefined' || !navigator.sendBeacon) return;
    const body = JSON.stringify({
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      id: metric.id,
    });
    navigator.sendBeacon(url, body);
  });

  return null;
}
