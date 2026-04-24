import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

import en from './locales/en';
import hu from './locales/hu';
import de from './locales/de';
import fr from './locales/fr';
import { setFormatLocale } from '../utils/format';

let deviceLang = 'en';
try {
  deviceLang = Localization.getLocales()[0]?.languageCode ?? 'en';
} catch {
  // native module not yet available (old dev-client build); fall back to English
}
const supportedLangs = ['en', 'hu', 'de', 'fr'];
const lng = supportedLangs.includes(deviceLang) ? deviceLang : 'en';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    hu: { translation: hu },
    de: { translation: de },
    fr: { translation: fr },
  },
  lng,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

setFormatLocale(lng);
i18n.on('languageChanged', setFormatLocale);

export default i18n;
