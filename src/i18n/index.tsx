import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { EN } from './en';

/**
 * App translations. French is the source language: every UI string is written in French
 * and wrapped in t('…'). In English mode t() looks the French text up in the EN dictionary
 * (src/i18n/en/*.ts) and falls back to French when an entry is missing, so nothing ever
 * renders blank. Placeholders use {name}: t('Commande {n}', { n: '#123' }).
 */
export type Lang = 'fr' | 'en';

const STORAGE_KEY = 'lmx_lang';
let current: Lang = 'fr';

export function getLanguage(): Lang {
  return current;
}

export function t(fr: string, vars?: Record<string, string | number>): string {
  let out = current === 'en' ? (EN[fr] ?? fr) : fr;
  if (vars) {
    for (const k of Object.keys(vars)) out = out.split(`{${k}}`).join(String(vars[k]));
  }
  return out;
}

/** BCP-47 locale for dates (toLocaleDateString etc.). */
export function locale(): string {
  return current === 'en' ? 'en-GB' : 'fr-FR';
}

interface LanguageState {
  lang: Lang;
  setLang: (l: Lang) => Promise<void>;
}

const LanguageContext = createContext<LanguageState>({ lang: 'fr', setLang: async () => {} });

/**
 * Loads the saved language before the app renders, and remounts its children when the
 * language changes so every screen re-renders with the new strings.
 */
export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then(v => { current = v === 'en' ? 'en' : 'fr'; setLangState(current); })
      .catch(() => setLangState('fr'));
  }, []);

  const setLang = useCallback(async (l: Lang) => {
    current = l;
    try { await AsyncStorage.setItem(STORAGE_KEY, l); } catch {}
    setLangState(l);
  }, []);

  if (!lang) return null;
  return (
    <LanguageContext.Provider value={{ lang, setLang }}>
      <React.Fragment key={lang}>{children}</React.Fragment>
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
