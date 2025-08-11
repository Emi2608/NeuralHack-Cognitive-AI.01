import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translation files
import esCommon from './es/common.json';
import enCommon from './en/common.json';

// Translation resources
const resources = {
  es: {
    common: esCommon,
  },
  en: {
    common: enCommon,
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: 'es', // Default language
  fallbackLng: 'es',
  defaultNS: 'common',

  interpolation: {
    escapeValue: false, // React already escapes values
  },

  // Development options
  debug: process.env.NODE_ENV === 'development',

  // React options
  react: {
    useSuspense: false,
  },
});

export default i18n;
