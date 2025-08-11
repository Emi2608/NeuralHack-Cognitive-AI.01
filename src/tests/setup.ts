import '@testing-library/jest-dom';
import { vi } from 'vitest';
import React from 'react';

// Mock Ionic components
vi.mock('@ionic/react', () => ({
  IonApp: ({ children }: any) => children,
  IonButton: ({ children, ...props }: any) => React.createElement('button', props, children),
  IonCard: ({ children }: any) => React.createElement('div', { className: 'ion-card' }, children),
  IonCardContent: ({ children }: any) => React.createElement('div', { className: 'ion-card-content' }, children),
  IonCardHeader: ({ children }: any) => React.createElement('div', { className: 'ion-card-header' }, children),
  IonCardTitle: ({ children }: any) => React.createElement('h2', { className: 'ion-card-title' }, children),
  IonContent: ({ children }: any) => React.createElement('div', { className: 'ion-content' }, children),
  IonHeader: ({ children }: any) => React.createElement('header', { className: 'ion-header' }, children),
  IonIcon: ({ icon, ...props }: any) => React.createElement('i', { ...props, 'data-icon': icon }),
  IonInput: (props: any) => React.createElement('input', props),
  IonItem: ({ children }: any) => React.createElement('div', { className: 'ion-item' }, children),
  IonLabel: ({ children }: any) => React.createElement('label', { className: 'ion-label' }, children),
  IonList: ({ children }: any) => React.createElement('div', { className: 'ion-list' }, children),
  IonPage: ({ children }: any) => React.createElement('div', { className: 'ion-page' }, children),
  IonTitle: ({ children }: any) => React.createElement('h1', { className: 'ion-title' }, children),
  IonToolbar: ({ children }: any) => React.createElement('div', { className: 'ion-toolbar' }, children),
  IonCheckbox: (props: any) => React.createElement('input', { type: 'checkbox', ...props }),
  IonSpinner: () => React.createElement('div', { className: 'ion-spinner' }, 'Loading...'),
  IonToast: () => React.createElement('div', { className: 'ion-toast' }),
  IonProgressBar: (props: any) => React.createElement('progress', props),
  IonBadge: ({ children }: any) => React.createElement('span', { className: 'ion-badge' }, children),
  setupIonicReact: vi.fn(),
}));

// Mock React Router
vi.mock('react-router-dom', () => ({
  BrowserRouter: ({ children }: any) => children,
  Route: ({ children }: any) => children,
  Switch: ({ children }: any) => children,
  useHistory: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    goBack: vi.fn(),
  }),
  useLocation: () => ({
    pathname: '/',
    search: '',
    hash: '',
    state: null,
  }),
  useParams: () => ({}),
}));

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      changeLanguage: vi.fn(),
      language: 'es',
    },
  }),
  Trans: ({ children }: any) => children,
}));

// Mock Supabase
vi.mock('../services/supabase', () => ({
  supabase: {
    auth: {
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(),
      resetPasswordForEmail: vi.fn(),
    },
    from: vi.fn(() => ({
      insert: vi.fn(),
      select: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      eq: vi.fn(),
      order: vi.fn(),
      limit: vi.fn(),
    })),
  },
}));

// Mock Chart.js
vi.mock('react-chartjs-2', () => ({
  Line: () => React.createElement('div', { 'data-testid': 'line-chart' }),
  Bar: () => React.createElement('div', { 'data-testid': 'bar-chart' }),
  Doughnut: () => React.createElement('div', { 'data-testid': 'doughnut-chart' }),
}));

// Mock file-saver
vi.mock('file-saver', () => ({
  saveAs: vi.fn(),
}));

// Mock jsPDF
vi.mock('jspdf', () => ({
  jsPDF: vi.fn().mockImplementation(() => ({
    text: vi.fn(),
    save: vi.fn(),
  })),
}));

// Mock crypto-js
vi.mock('crypto-js', () => ({
  AES: {
    encrypt: vi.fn().mockReturnValue({ toString: vi.fn().mockReturnValue('encrypted') }),
    decrypt: vi.fn().mockReturnValue({ toString: vi.fn().mockReturnValue('decrypted') }),
  },
  enc: {
    Utf8: {
      stringify: vi.fn().mockReturnValue('decrypted'),
    },
  },
  SHA256: vi.fn().mockReturnValue({ toString: vi.fn().mockReturnValue('hashed') }),
  lib: {
    WordArray: {
      random: vi.fn().mockReturnValue({ toString: vi.fn().mockReturnValue('random') }),
    },
  },
}));

// Mock Web APIs
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

Object.defineProperty(navigator, 'serviceWorker', {
  writable: true,
  value: {
    register: vi.fn().mockResolvedValue({}),
    ready: Promise.resolve({}),
  },
});

Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true,
});

Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
});

Object.defineProperty(window, 'indexedDB', {
  value: {
    open: vi.fn(),
    deleteDatabase: vi.fn(),
  },
});

// Mock canvas
HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
  fillRect: vi.fn(),
  clearRect: vi.fn(),
  getImageData: vi.fn().mockReturnValue({
    data: new Uint8ClampedArray(4),
  }),
  putImageData: vi.fn(),
  createImageData: vi.fn().mockReturnValue({}),
  setTransform: vi.fn(),
  drawImage: vi.fn(),
  save: vi.fn(),
  fillText: vi.fn(),
  restore: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  closePath: vi.fn(),
  stroke: vi.fn(),
  translate: vi.fn(),
  scale: vi.fn(),
  rotate: vi.fn(),
  arc: vi.fn(),
  fill: vi.fn(),
  measureText: vi.fn().mockReturnValue({ width: 0 }),
  transform: vi.fn(),
  rect: vi.fn(),
  clip: vi.fn(),
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Suppress console warnings in tests
const originalConsoleWarn = console.warn;
console.warn = (...args: any[]) => {
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('React Router') ||
     args[0].includes('Warning:') ||
     args[0].includes('validateDOMNesting'))
  ) {
    return;
  }
  originalConsoleWarn.apply(console, args);
};

// Global test timeout
vi.setConfig({ testTimeout: 10000 });