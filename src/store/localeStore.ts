import { create } from 'zustand';
import i18n from '../i18n';

export type SupportedLang = 'en' | 'hu' | 'de' | 'fr';

const LANG_META: Record<SupportedLang, { locale: string; currency: string }> = {
  en: { locale: 'en-GB', currency: 'USD' },
  hu: { locale: 'hu-HU', currency: 'HUF' },
  de: { locale: 'de-DE', currency: 'EUR' },
  fr: { locale: 'fr-FR', currency: 'EUR' },
};

const normalizeLang = (raw: string): SupportedLang => {
  const code = raw.split('-')[0].toLowerCase() as SupportedLang;
  return code in LANG_META ? code : 'en';
};

interface LocaleState {
  lang: SupportedLang;
  locale: string;
  currency: string;
  // Called internally whenever i18n.language changes.
  _sync: () => void;
}

export const useLocaleStore = create<LocaleState>((set) => {
  const derive = () => {
    const lang = normalizeLang(i18n.language ?? 'en');
    return { lang, ...LANG_META[lang] };
  };

  // Keep the store in sync with i18next language changes.
  i18n.on('languageChanged', () => set(derive()));

  return {
    ...derive(),
    _sync: () => set(derive()),
  };
});
