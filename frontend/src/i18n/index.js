import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';
import sr from './locales/sr.json';
import de from './locales/de.json';
import fr from './locales/fr.json';

if (typeof window !== 'undefined' && window.localStorage.getItem('i18nextLng') === 'bs') {
  window.localStorage.setItem('i18nextLng', 'sr');
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      sr: { translation: sr },
      de: { translation: de },
      fr: { translation: fr },
    },
    supportedLngs: ['en', 'sr', 'de', 'fr'],
    fallbackLng: 'en',
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
