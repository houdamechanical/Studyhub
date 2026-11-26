"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { DEFAULT_LOCALE, dirFor, isLocale, LOCALE_COOKIE, LOCALES, type Locale } from "./config";
import { DICTIONARIES, type Dictionary } from "./dictionaries";

type I18nValue = { locale: Locale; dict: Dictionary; setLocale: (l: Locale) => void };

const I18nContext = createContext<I18nValue | null>(null);

/** Saved choice, else the browser language, else the default. */
function detectLocale(): Locale {
  try {
    const saved = localStorage.getItem(LOCALE_COOKIE);
    if (isLocale(saved)) return saved;
  } catch {}
  for (const lang of navigator.languages ?? [navigator.language]) {
    const code = lang.slice(0, 2).toLowerCase();
    if ((LOCALES as readonly string[]).includes(code)) return code as Locale;
  }
  return DEFAULT_LOCALE;
}

/**
 * Runs before the page is painted (inlined in <head>) so Arabic starts out
 * right-to-left without a flash. Keep in sync with detectLocale().
 */
export const LOCALE_BOOT_SCRIPT = `(function(){try{var l=localStorage.getItem(${JSON.stringify(LOCALE_COOKIE)});
if(!l){var n=(navigator.languages||[navigator.language]);for(var i=0;i<n.length;i++){var c=(n[i]||"").slice(0,2).toLowerCase();if(${JSON.stringify(LOCALES)}.indexOf(c)>=0){l=c;break}}}
if(${JSON.stringify(LOCALES)}.indexOf(l)<0)l=${JSON.stringify(DEFAULT_LOCALE)};
document.documentElement.lang=l;document.documentElement.dir=l==="ar"?"rtl":"ltr";}catch(e){}})();`;

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    setLocaleState(detectLocale());
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = dirFor(locale);
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    try {
      localStorage.setItem(LOCALE_COOKIE, next);
    } catch {}
    setLocaleState(next);
  }, []);

  return (
    <I18nContext.Provider value={{ locale, dict: DICTIONARIES[locale], setLocale }}>{children}</I18nContext.Provider>
  );
}

export function useI18n() {
  const value = useContext(I18nContext);
  if (!value) throw new Error("useI18n must be used inside <I18nProvider>");
  return value;
}

/** Set the browser tab title from a client page. */
export function useTitle(title: string | undefined) {
  useEffect(() => {
    if (title) document.title = `${title} · Study Hub`;
  }, [title]);
}
