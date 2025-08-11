import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translations
import esCommon from '../locales/es/common.json';

const resources = {
  es: {
    translation: esCommon
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'es', // Default language
    fallbackLng: 'es',
    
    interpolation: {
      escapeValue: false // React already does escaping
    },
    
    react: {
      useSuspense: false
    }
  });

export default i18n;