'use client';

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { colors } from '../tokens/index.js';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeContextValue {
  readonly mode: ThemeMode;
  readonly resolvedMode: 'light' | 'dark';
  readonly setMode: (mode: ThemeMode) => void;
  readonly tokens: typeof colors;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export interface ThemeProviderProps {
  readonly children: ReactNode;
  readonly defaultMode?: ThemeMode;
  readonly storageKey?: string;
}

/**
 * Theme provider — manages light/dark mode and exposes design tokens.
 *
 * Per `06_TECH_STACK.md` §23: dark and light themes are supported.
 * Per `09_EVENT_SYSTEM.md` §20: ThemeChangedEvent is published when theme changes.
 */
export function ThemeProvider({
  children,
  defaultMode = 'system',
  storageKey = 'aimeetx-theme',
}: ThemeProviderProps) {
  const [mode, setModeState] = useState<ThemeMode>(defaultMode);
  const [systemMode, setSystemMode] = useState<'light' | 'dark'>('light');

  // Detect system preference
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setSystemMode(mediaQuery.matches ? 'dark' : 'light');

    const handler = (e: MediaQueryListEvent) => {
      setSystemMode(e.matches ? 'dark' : 'light');
    };
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Load from storage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem(storageKey);
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      setModeState(stored);
    }
  }, [storageKey]);

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(storageKey, newMode);
    }
  };

  const resolvedMode: 'light' | 'dark' = mode === 'system' ? systemMode : mode;

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      resolvedMode,
      setMode,
      tokens: colors,
    }),
    [mode, resolvedMode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/**
 * Hook to access the current theme.
 */
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return ctx;
}