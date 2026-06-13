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
      className="inline-flex size-9 items-center justify-center rounded-lg border border-black/10 text-lg transition-colors hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
    >
      <span aria-hidden className="inline dark:hidden">
        🌙
      </span>
      <span aria-hidden className="hidden dark:inline">
        ☀️
      </span>
    </button>
  );
}
