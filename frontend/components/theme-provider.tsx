'use client';

import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export type AtlasTheme = 'light' | 'dark';

const STORAGE_KEY = 'atlas-theme';

function applyThemeClass(t: AtlasTheme) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.classList.remove('light', 'dark');
  root.classList.add(t);
}

const ThemeContext = createContext<{
  theme: AtlasTheme;
  setTheme: (t: AtlasTheme) => void;
} | null>(null);

export function useAtlasTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useAtlasTheme must be used within ThemeProvider');
  return ctx;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<AtlasTheme>('dark');

  useLayoutEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const t =
        raw === 'light' || raw === 'dark'
          ? raw
          : document.documentElement.classList.contains('light')
            ? 'light'
            : 'dark';
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate theme from localStorage / html class
      setThemeState(t);
      applyThemeClass(t);
    } catch {
      applyThemeClass('dark');
    }
  }, []);

  const setTheme = useCallback((t: AtlasTheme) => {
    try {
      localStorage.setItem(STORAGE_KEY, t);
    } catch {
      /* ignore */
    }
    setThemeState(t);
    applyThemeClass(t);
  }, []);

  const value = useMemo(() => ({ theme, setTheme }), [theme, setTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
