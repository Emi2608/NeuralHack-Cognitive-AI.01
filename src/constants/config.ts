// App configuration constants
export const APP_CONFIG = {
  NAME: import.meta.env.VITE_APP_NAME || 'NeuralHack Cognitive AI',
  VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0',
  ENVIRONMENT: import.meta.env.VITE_APP_ENVIRONMENT || 'development',

  // Assessment configuration
  ASSESSMENT_TIMEOUT: 30 * 60 * 1000, // 30 minutes in milliseconds
  AUTO_SAVE_INTERVAL: 30 * 1000, // 30 seconds

  // Risk thresholds
  RISK_THRESHOLDS: {
    LOW: { min: 0, max: 5 },
    MODERATE: { min: 5, max: 40 },
    HIGH: { min: 40, max: 100 },
  },

  // Accessibility
  FONT_SIZES: {
    NORMAL: '16px',
    LARGE: '20px',
    EXTRA_LARGE: '24px',
  },

  // Supported languages
  LANGUAGES: ['es', 'en'] as const,
  DEFAULT_LANGUAGE: 'es' as const,
} as const;
