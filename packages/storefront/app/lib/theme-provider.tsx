/**
 * ThemeProvider — manages light / dark / high-contrast / system-auto theme mode.
 *
 * Sets `theme-light` | `theme-dark` | `theme-hc` class on <html> so the CSS
 * custom properties in tailwind.css take effect. Respects system
 * `prefers-color-scheme` when mode is `system`.
 *
 * Persists choice to localStorage under `regenai:theme`.
 *
 * Server-side: reads the cookie (Remix loaders set it) to prevent flash of
 * unstyled theme. For now, Phase 1 only reads from localStorage client-side
 * — SSR theme-injection arrives in D2.3 when we wire Remix loaders.
 */

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type {ThemeMode} from '~/lib/tokens';

type ThemeContextValue = {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  effective: 'light' | 'dark' | 'hc';
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = 'regenai:theme';

function getSystemMode(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

function resolveEffective(mode: ThemeMode): 'light' | 'dark' | 'hc' {
  if (mode === 'system') return getSystemMode();
  return mode;
}

function applyTheme(effective: 'light' | 'dark' | 'hc') {
  if (typeof document === 'undefined') return;
  const html = document.documentElement;
  html.classList.remove('theme-light', 'theme-dark', 'theme-hc');
  html.classList.add(`theme-${effective}`);
}

export function ThemeProvider({
  children,
  initialMode = 'system',
}: {
  children: ReactNode;
  initialMode?: ThemeMode;
}) {
  const [mode, setModeState] = useState<ThemeMode>(initialMode);
  const [effective, setEffective] = useState<'light' | 'dark' | 'hc'>(() =>
    resolveEffective(initialMode),
  );

  // Hydrate from localStorage on mount.
  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
    if (stored && ['light', 'dark', 'hc', 'system'].includes(stored)) {
      setModeState(stored);
    }
  }, []);

  // Apply + track system changes.
  useEffect(() => {
    const next = resolveEffective(mode);
    setEffective(next);
    applyTheme(next);

    if (mode !== 'system') return;

    // Live-respond to system preference changes.
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      const sys = resolveEffective('system');
      setEffective(sys);
      applyTheme(sys);
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [mode]);

  const setMode = (next: ThemeMode) => {
    setModeState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // localStorage disabled — in-memory only for this session.
    }
  };

  const value = useMemo(
    () => ({mode, setMode, effective}),
    [mode, effective],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a <ThemeProvider>');
  }
  return ctx;
}
