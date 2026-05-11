import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import en from './en.json';
import fr from './fr.json';
import es from './es.json';

const translations = { en, fr, es };
const SUPPORTED_LANGS = ['en', 'fr', 'es'];
const DEFAULT_LANG = 'en';

const I18nContext = createContext({
  lang: DEFAULT_LANG,
  setLang: () => {},
  t: (key) => key,
  supportedLangs: SUPPORTED_LANGS,
});

/**
 * Resolve a dot-separated key from a nested object.
 * e.g. resolve('sidebar.dashboard', translations.en) => 'Dashboard'
 */
function resolve(key, obj) {
  return key.split('.').reduce((acc, part) => {
    if (acc && typeof acc === 'object' && part in acc) return acc[part];
    return undefined;
  }, obj);
}

/**
 * I18nProvider — wraps the app to provide language context.
 * Default language: English.
 * Falls back to English if a key is missing in the current language.
 */
export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    try {
      const stored = localStorage.getItem('mgh-lang');
      if (stored && SUPPORTED_LANGS.includes(stored)) return stored;
    } catch {}
    return DEFAULT_LANG;
  });

  const setLang = useCallback((newLang) => {
    if (SUPPORTED_LANGS.includes(newLang)) {
      setLangState(newLang);
      try { localStorage.setItem('mgh-lang', newLang); } catch {}
    }
  }, []);

  /**
   * t(key, params?) — translate a dot-separated key.
   * Supports interpolation: t('experienceForm.stepOf', { current: 1, total: 7 })
   * Falls back: current lang -> English -> key itself
   */
  const t = useCallback((key, params) => {
    let value = resolve(key, translations[lang]);
    if (value === undefined && lang !== DEFAULT_LANG) {
      value = resolve(key, translations[DEFAULT_LANG]);
    }
    if (value === undefined) return key;
    if (typeof value !== 'string') return value;

    // Interpolation: replace {param} with params[param]
    if (params && typeof params === 'object') {
      return value.replace(/\{(\w+)\}/g, (_, k) => {
        return k in params ? String(params[k]) : `{${k}}`;
      });
    }
    return value;
  }, [lang]);

  const ctx = useMemo(() => ({
    lang,
    setLang,
    t,
    supportedLangs: SUPPORTED_LANGS,
  }), [lang, setLang, t]);

  return (
    <I18nContext.Provider value={ctx}>
      {children}
    </I18nContext.Provider>
  );
}

/**
 * useTranslation() — returns { t, lang, setLang, supportedLangs }
 */
export function useTranslation() {
  return useContext(I18nContext);
}

export { I18nContext, SUPPORTED_LANGS, DEFAULT_LANG };
