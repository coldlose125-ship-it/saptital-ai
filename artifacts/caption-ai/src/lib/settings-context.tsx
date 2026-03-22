import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Locale, TranslationKey, t as translate } from './i18n';

export type Theme = 'light' | 'dark';

interface SettingsContextValue {
  theme: Theme;
  locale: Locale;
  toggleTheme: () => void;
  toggleLocale: () => void;
  t: (key: TranslationKey) => string;
}

const THEME_KEY = 'sapital_theme';
const LOCALE_KEY = 'sapital_locale';

const SettingsContext = createContext<SettingsContextValue | null>(null);

function getInitialTheme(): Theme {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === 'dark' || stored === 'light') return stored;
  } catch {}
  return 'light';
}

function getInitialLocale(): Locale {
  try {
    const stored = localStorage.getItem(LOCALE_KEY);
    if (stored === 'ko' || stored === 'en') return stored;
  } catch {}
  return 'ko';
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const [locale, setLocale] = useState<Locale>(getInitialLocale);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try { localStorage.setItem(THEME_KEY, theme); } catch {}
  }, [theme]);

  useEffect(() => {
    try { localStorage.setItem(LOCALE_KEY, locale); } catch {}
  }, [locale]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  }, []);

  const toggleLocale = useCallback(() => {
    setLocale(prev => prev === 'ko' ? 'en' : 'ko');
  }, []);

  const t = useCallback((key: TranslationKey) => translate(key, locale), [locale]);

  return (
    <SettingsContext.Provider value={{ theme, locale, toggleTheme, toggleLocale, t }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
