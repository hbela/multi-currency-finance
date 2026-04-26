import { useEffect, useReducer } from 'react';
import i18n from 'i18next';

// Subscribes to i18next's languageChanged event and returns the current language.
// Use this in any component whose render output depends on i18n.language but
// doesn't otherwise consume `t(...)` (e.g. money formatters).
export const useLanguage = (): string => {
  const [, forceRender] = useReducer((c: number) => c + 1, 0);
  useEffect(() => {
    if (__DEV__) console.log('[useLanguage] subscribing, instance=', (i18n as unknown as { __id?: number }).__id);
    const handler = (l: string) => {
      if (__DEV__) console.log('[useLanguage] event fired, newLang=', l);
      forceRender();
    };
    i18n.on('languageChanged', handler);
    return () => { i18n.off('languageChanged', handler); };
  }, []);
  return i18n.language;
};
