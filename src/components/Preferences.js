'use client';

// ============================================================
// Remembers the user's LANGUAGE and THEME (dark / light)
//
// Both are saved in small cookies so the server shows the right
// language and colours on the very first load (no flicker).
//
// Any component can use:
//   const { t, lang, setLang, theme, setTheme } = usePreferences();
//   t('signIn')  → "Sign In" in the chosen language
// ============================================================

import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { LANGUAGE_COOKIE, translate } from '@/lib/i18n';

export const THEME_COOKIE = 'vdou_theme';

const ONE_YEAR = 60 * 60 * 24 * 365;

const PreferencesContext = createContext(null);

function saveCookie(name, value) {
  document.cookie = `${name}=${value}; path=/; max-age=${ONE_YEAR}; samesite=lax`;
}

export function PreferencesProvider({ initialLang, initialTheme, children }) {
  const [lang, setLangState] = useState(initialLang);
  const [theme, setThemeState] = useState(initialTheme);

  // ----- Change language -----
  const setLang = useCallback((code) => {
    setLangState(code);
    saveCookie(LANGUAGE_COOKIE, code);
    document.documentElement.lang = code;
  }, []);

  // ----- Change theme -----
  const setTheme = useCallback((value) => {
    setThemeState(value);
    saveCookie(THEME_COOKIE, value);
    document.documentElement.dataset.theme = value;
  }, []);

  // ----- Translate a word -----
  const t = useCallback((key, values) => translate(lang, key, values), [lang]);

  const value = useMemo(
    () => ({ lang, setLang, theme, setTheme, t }),
    [lang, setLang, theme, setTheme, t]
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences() {
  return useContext(PreferencesContext);
}
