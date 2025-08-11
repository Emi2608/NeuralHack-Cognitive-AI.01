import { useState, useEffect, useCallback, useRef } from 'react';
import { AuthService, type SignUpData, type SignInData } from '../services/service.factory';
import type { UserProfile, AuthState } from '../types/user';


export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    error: null,
  });

  // Add debounce mechanism to prevent rapid profile fetching
  const profileFetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastProfileFetchRef = useRef<number>(0);

  // Debounced profile fetching function
  const fetchUserProfileDebounced = useCallback(async (session: any) => {
    const now = Date.now();
    const timeSinceLastFetch = now - lastProfileFetchRef.current;
    
    // Don't fetch if we fetched recently (within 1 second)
    if (timeSinceLastFetch < 1000) {
      return null;
    }

    // Clear any pending timeout
    if (profileFetchTimeoutRef.current) {
      clearTimeout(profileFetchTimeoutRef.current);
    }

    return new Promise<UserProfile | null>((resolve) => {
      profileFetchTimeoutRef.current = setTimeout(async () => {
        try {
          lastProfileFetchRef.current = Date.now();
          const userProfile = await AuthService.getCurrentUserProfile();
          resolve(userProfile);
        } catch (error) {
          console.error('Error fetching user profile:', error);
          resolve(null);
        }
      }, 300); // 300ms debounce
    });
  }, []);

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const session = await AuthService.getCurrentSession();
        let userProfile: UserProfile | null = null;

        if (session?.user) {
          userProfile = await fetchUserProfileDebounced(session);
        }

        if (mounted) {
          setAuthState({
            user: userProfile,
            session,
            loading: false,
            error: null,
          });
        }
      } catch (error) {
        if (mounted) {
          setAuthState({
            user: null,
            session: null,
            loading: false,
            error: error instanceof Error ? error.message : 'Authentication error',
          });
        }
      }
    };

    initializeAuth();

    // Subscribe to auth changes
    const { data: { subscription } } = AuthService.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        console.log('Auth state changed:', event, session);

        if (event === 'SIGNED_IN' && session?.user) {
          try {
            const userProfile = await fetchUserProfileDebounced(session);
            setAuthState({
              user: userProfile,
              session,
              loading: false,
              error: null,
            });
          } catch (error) {
            console.error('Error loading user profile after sign in:', error);
            // Still set the session even if profile loading fails
            setAuthState({
              user: null,
              session,
              loading: false,
              error: 'Failed to load user profile',
            });
          }
        } else if (event === 'SIGNED_OUT') {
          setAuthState({
            user: null,
            session: null,
            loading: false,
            error: null,
          });
        } else if (event === 'TOKEN_REFRESHED' && session) {
          setAuthState(prev => ({
            ...prev,
            session,
            error: null,
          }));
        } else if (event === 'INITIAL_SESSION') {
          // Handle initial session load
          if (session?.user) {
            try {
              const userProfile = await fetchUserProfileDebounced(session);
              setAuthState({
                user: userProfile,
                session,
                loading: false,
                error: null,
              });
            } catch (error) {
              console.error('Error loading user profile on initial session:', error);
              setAuthState({
                user: null,
                session,
                loading: false,
                error: 'Failed to load user profile',
              });
            }
          } else {
            setAuthState({
              user: null,
              session: null,
              loading: false,
              error: null,
            });
          }
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
      
      // Clear any pending profile fetch timeout
      if (profileFetchTimeoutRef.current) {
        clearTimeout(profileFetchTimeoutRef.current);
      }
    };
  }, []);

  // Sign up function
  const signUp = useCallback(async (data: SignUpData) => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Validate data first
      const validationErrors = AuthService.validateSignUpData(data);
      if (validationErrors.length > 0) {
        throw new Error(validationErrors.join(', '));
      }

      const { user, session, error } = await AuthService.signUp(data);

      if (error) {
        throw error;
      }

      if (user) {
        // If session is null but user exists, it means email confirmation is required
        if (!session && !user.email_confirmed_at) {
          setAuthState(prev => ({
            ...prev,
            loading: false,
            error: null,
          }));
          return { 
            success: true, 
            error: null, 
            requiresEmailConfirmation: true,
            message: 'Se ha enviado un email de confirmación. Por favor, revisa tu bandeja de entrada.'
          };
        }

        // If we have both user and session, get the profile
        if (session) {
          const userProfile = await AuthService.getCurrentUserProfile();
          setAuthState({
            user: userProfile,
            session,
            loading: false,
            error: null,
          });
        } else {
          setAuthState(prev => ({
            ...prev,
            loading: false,
            error: null,
          }));
        }
        
        return { success: true, error: null };
      } else {
        throw new Error('No se pudo crear la cuenta de usuario');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign up failed';
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      return { success: false, error: errorMessage };
    }
  }, []);

  // Sign in function
  const signIn = useCallback(async (data: SignInData) => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const { user, session, error } = await AuthService.signIn(data);

      if (error) {
        throw error;
      }

      if (user && session) {
        const userProfile = await AuthService.getCurrentUserProfile();
        setAuthState({
          user: userProfile,
          session,
          loading: false,
          error: null,
        });
        return { success: true, error: null };
      } else {
        throw new Error('Failed to sign in');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign in failed';
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      return { success: false, error: errorMessage };
    }
  }, []);

  // Sign out function
  const signOut = useCallback(async () => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const { error } = await AuthService.signOut();

      if (error) {
        throw error;
      }

      setAuthState({
        user: null,
        session: null,
        loading: false,
        error: null,
      });

      return { success: true, error: null };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign out failed';
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      return { success: false, error: errorMessage };
    }
  }, []);

  // Update profile function
  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    if (!authState.user) {
      return { success: false, error: 'No authenticated user' };
    }

    setAuthState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const { error } = await AuthService.updateUserProfile(updates);

      if (error) {
        throw error;
      }

      // Refresh user profile
      const updatedProfile = await AuthService.getCurrentUserProfile();
      setAuthState(prev => ({
        ...prev,
        user: updatedProfile,
        loading: false,
        error: null,
      }));

      return { success: true, error: null };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Profile update failed';
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      return { success: false, error: errorMessage };
    }
  }, [authState.user]);

  // Reset password function
  const resetPassword = useCallback(async (email: string) => {
    try {
      const { error } = await AuthService.resetPassword(email);

      if (error) {
        throw error;
      }

      return { success: true, error: null };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Password reset failed';
      return { success: false, error: errorMessage };
    }
  }, []);

  // Update password function
  const updatePassword = useCallback(async (newPassword: string) => {
    try {
      const { error } = await AuthService.updatePassword(newPassword);

      if (error) {
        throw error;
      }

      return { success: true, error: null };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Password update failed';
      return { success: false, error: errorMessage };
    }
  }, []);

  // Clear error function
  const clearError = useCallback(() => {
    setAuthState(prev => ({ ...prev, error: null }));
  }, []);

  // Check if user is authenticated
  const isAuthenticated = authState.user !== null && authState.session !== null;

  // Check if user has given consent
  const hasConsent = authState.user?.consentGiven === true;

  // Get user's accessibility settings
  const accessibilitySettings = authState.user?.accessibilitySettings;

  return {
    // State
    user: authState.user,
    session: authState.session,
    loading: authState.loading,
    error: authState.error,
    isAuthenticated,
    hasConsent,
    accessibilitySettings,

    // Actions
    signUp,
    signIn,
    signOut,
    updateProfile,
    resetPassword,
    updatePassword,
    clearError,
  };
};