import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserProfile, AccessibilitySettings } from '../types/user';
import type { Session } from '@supabase/supabase-js';

interface AuthStore {
  // State
  user: UserProfile | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  setUser: (user: UserProfile | null) => void;
  setSession: (session: Session | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setInitialized: (initialized: boolean) => void;
  updateAccessibilitySettings: (settings: Partial<AccessibilitySettings>) => void;
  clearAuth: () => void;
  reset: () => void;

  // Computed
  isAuthenticated: () => boolean;
  hasConsent: () => boolean;
  getUserAge: () => number | null;
  needsEducationAdjustment: () => boolean;
}

const initialState = {
  user: null,
  session: null,
  loading: false,
  error: null,
  isInitialized: false,
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Actions
      setUser: (user) => set({ user }),
      
      setSession: (session) => set({ session }),
      
      setLoading: (loading) => set({ loading }),
      
      setError: (error) => set({ error }),
      
      setInitialized: (initialized) => set({ isInitialized: initialized }),

      updateAccessibilitySettings: (settings) => {
        const { user } = get();
        if (user) {
          set({
            user: {
              ...user,
              accessibilitySettings: {
                ...user.accessibilitySettings,
                ...settings,
              },
            },
          });
        }
      },

      clearAuth: () => set({
        user: null,
        session: null,
        error: null,
      }),

      reset: () => set(initialState),

      // Computed getters
      isAuthenticated: () => {
        const { user, session } = get();
        return user !== null && session !== null;
      },

      hasConsent: () => {
        const { user } = get();
        return user?.consentGiven === true;
      },

      getUserAge: () => {
        const { user } = get();
        if (!user?.dateOfBirth) return null;

        const today = new Date();
        const birthDate = new Date(user.dateOfBirth);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();

        if (
          monthDiff < 0 ||
          (monthDiff === 0 && today.getDate() < birthDate.getDate())
        ) {
          age--;
        }

        return age;
      },

      needsEducationAdjustment: () => {
        const { user } = get();
        // MoCA adjustment for users with ≤12 years of education
        return (user?.educationLevel || 0) <= 12;
      },
    }),
    {
      name: 'neuralhack-auth-storage',
      partialize: (state) => ({
        // Only persist non-sensitive data
        user: state.user ? {
          ...state.user,
          // Don't persist sensitive data in localStorage
          email: undefined,
        } : null,
        isInitialized: state.isInitialized,
      }),
    }
  )
);