// User-related types
export interface UserProfile {
  id: string;
  email: string;
  dateOfBirth: Date;
  educationLevel: number; // years of education
  language: 'es' | 'en';
  accessibilitySettings: AccessibilitySettings;
  consentGiven: boolean;
  consentDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AccessibilitySettings {
  highContrast: boolean;
  fontSize: 'normal' | 'large' | 'extra-large';
  voiceGuidance: boolean;
  keyboardNavigation: boolean;
  touchTargetSize: 'normal' | 'large';
}

export interface AuthState {
  user: UserProfile | null;
  session: any | null;
  loading: boolean;
  error: string | null;
}
