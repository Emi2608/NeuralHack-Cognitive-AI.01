import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translation files
import esCommon from './locales/es/common.json';

const resources = {
  es: {
    common: esCommon,
  },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'es', // Default language
    fallbackLng: 'es',
    defaultNS: 'common',
    interpolation: {
      escapeValue: false, // React already does escaping
    },
  });

export default i18n;