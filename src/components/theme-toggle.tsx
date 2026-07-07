'use client';

import { useTheme } from 'next-themes';

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  // Icons swap via the `dark` class next-themes sets on <html> before paint, so
  // there's no hydration mismatch and no need to read the theme during render.
  return (
    <button
      type="button"
      aria-label="Toggle color theme"
      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
      className="border-line text-ink hover:border-linestrong hover:bg-surface2 inline-flex size-9 items-center justify-center border transition-colors"
    >
      {/* moon — shown in light mode (click to go dark) */}
      <svg
        aria-hidden
        viewBox="0 0 20 20"
        className="inline size-4 dark:hidden"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path d="M16 12.5 A7 7 0 0 1 7.5 4 A7.5 7.5 0 1 0 16 12.5z" />
      </svg>
      {/* sun — shown in dark mode (click to go light) */}
      <svg
        aria-hidden
        viewBox="0 0 20 20"
        className="hidden size-4 dark:inline"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <circle cx="10" cy="10" r="4" />
        <path d="M10 1.5v2.5M10 16v2.5M1.5 10H4M16 10h2.5M3.8 3.8l1.8 1.8M14.4 14.4l1.8 1.8M16.2 3.8l-1.8 1.8M5.6 14.4l-1.8 1.8" />
      </svg>
    </button>
  );
}
