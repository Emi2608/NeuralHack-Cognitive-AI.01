// Application configuration
export const APP_CONFIG = {
  // Production mode - override DEV_MODE to false for production
  DEV_MODE: false,
  
  // API Configuration
  API: {
    BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
    TIMEOUT: 10000
  },
  
  // Supabase Configuration (only used when DEV_MODE is false)
  SUPABASE: {
    URL: import.meta.env.VITE_SUPABASE_URL || '',
    ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY || ''
  },
  
  // App Information
  APP: {
    NAME: import.meta.env.VITE_APP_NAME || 'NeuralHack Cognitive AI',
    VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0',
    DESCRIPTION: 'Evaluación cognitiva temprana para enfermedades neurodegenerativas'
  },
  
  // Feature Flags - Production settings
  FEATURES: {
    OFFLINE_MODE: true,
    VOICE_GUIDANCE: true,
    ACCESSIBILITY: true,
    ANALYTICS: true,
    AUDIT_LOGGING: true
  },
  
  // Storage Configuration - Production settings
  STORAGE: {
    PREFIX: 'neuralhack_',
    ENCRYPTION_ENABLED: true
  },
  
  // Assessment Configuration
  ASSESSMENT: {
    AUTO_SAVE_INTERVAL: parseInt(import.meta.env.VITE_AUTO_SAVE_INTERVAL || '30000'),
    SESSION_TIMEOUT: parseInt(import.meta.env.VITE_SESSION_TIMEOUT || '1800000'),
    MAX_RESPONSE_TIME: parseInt(import.meta.env.VITE_MAX_RESPONSE_TIME || '300000'),
    AVAILABLE_LANGUAGES: ['es', 'en']
  },
  
  // UI Configuration
  UI: {
    DEFAULT_LANGUAGE: import.meta.env.VITE_DEFAULT_LANGUAGE || 'es',
    THEME: import.meta.env.VITE_THEME || 'light',
    ANIMATION_DURATION: parseInt(import.meta.env.VITE_ANIMATION_DURATION || '300'),
    TOAST_DURATION: parseInt(import.meta.env.VITE_TOAST_DURATION || '4000')
  },
  
  // Development Configuration - Disabled for production
  DEV: {
    MOCK_DATA: false,
    SKIP_AUTH: false,
    CONSOLE_LOGGING: false,
    DEBUG_MODE: false
  }
};

// Environment-specific overrides
if (import.meta.env.PROD) {
  APP_CONFIG.DEV_MODE = false;
  APP_CONFIG.FEATURES.ANALYTICS = true;
  APP_CONFIG.FEATURES.AUDIT_LOGGING = true;
  APP_CONFIG.STORAGE.ENCRYPTION_ENABLED = true;
  APP_CONFIG.DEV.MOCK_DATA = false;
  APP_CONFIG.DEV.CONSOLE_LOGGING = false;
  APP_CONFIG.DEV.DEBUG_MODE = false;
}

export default APP_CONFIG;