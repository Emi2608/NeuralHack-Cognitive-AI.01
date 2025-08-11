import { supabase } from './supabase';
import type { UserProfile, AccessibilitySettings } from '../types/user';
import type { User, Session } from '@supabase/supabase-js';
import { SecurityService } from './security.service';
import { AuditService } from './audit.service';
import { SecureStorage } from '../utils/encryption/encryption.service';

export interface SignUpData {
  email: string;
  password: string;
  dateOfBirth: Date;
  educationLevel: number;
  language: 'es';
  consentGiven: boolean;
}

export interface SignInData {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User | null;
  session: Session | null;
  error: Error | null;
}

export class AuthService {
  /**
   * Sign up a new user with profile data
   */
  static async signUp(data: SignUpData): Promise<AuthResponse> {
    try {
      // First, create the auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
      });

      if (authError) {
        return { user: null, session: null, error: authError };
      }

      if (!authData.user) {
        return {
          user: null,
          session: null,
          error: new Error('Failed to create user'),
        };
      }

      // Create user profile
      const defaultAccessibilitySettings: AccessibilitySettings = {
        highContrast: false,
        fontSize: 'normal',
        voiceGuidance: false,
        keyboardNavigation: false,
        touchTargetSize: 'normal',
      };

      const profileData = {
        id: authData.user.id,
        email: data.email,
        date_of_birth: data.dateOfBirth.toISOString().split('T')[0],
        education_level: data.educationLevel,
        language: data.language,
        accessibility_settings: defaultAccessibilitySettings,
        consent_given: data.consentGiven,
        consent_date: new Date().toISOString(),
      };

      const { error: profileError } = await supabase
        .from('profiles')
        .insert([profileData]);

      if (profileError) {
        // If profile creation fails, we should clean up the auth user
        await supabase.auth.signOut();
        return { user: null, session: null, error: profileError };
      }

      // Log the registration for audit
      await this.logAuditEvent(authData.user.id, 'user_registered', {
        email: data.email,
        consent_given: data.consentGiven,
      });

      return {
        user: authData.user,
        session: authData.session,
        error: null,
      };
    } catch (error) {
      return {
        user: null,
        session: null,
        error: error as Error,
      };
    }
  }

  /**
   * Sign in an existing user
   */
  static async signIn(data: SignInData): Promise<AuthResponse> {
    const clientIP = await this.getClientIP();
    
    // Validate login attempt (check for rate limiting)
    if (!SecurityService.validateLoginAttempt(data.email, clientIP)) {
      const error = new Error('Too many failed login attempts. Please try again later.');
      
      await AuditService.logSecurityEvent('login_blocked', {
        email: data.email,
        reason: 'rate_limit_exceeded',
        ipAddress: clientIP
      });
      
      return { user: null, session: null, error };
    }

    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        // Record failed login attempt
        SecurityService.recordFailedLogin(data.email, clientIP);
        
        await AuditService.logAuthEvent('login', undefined, {
          email: data.email,
          success: false,
          error: error.message,
          ipAddress: clientIP
        });
        
        return { user: null, session: null, error };
      }

      // Record successful login
      if (authData.user) {
        SecurityService.recordSuccessfulLogin(authData.user.id, clientIP);
        
        // Initialize secure storage with user session
        if (authData.session?.access_token) {
          await SecureStorage.initialize(authData.session.access_token);
        }
        
        await AuditService.logAuthEvent('login', authData.user.id, {
          email: data.email,
          success: true,
          ipAddress: clientIP
        });

        // Log the sign in for audit (legacy)
        await this.logAuditEvent(authData.user.id, 'user_signed_in', {
          email: data.email,
        });
      }

      return {
        user: authData.user,
        session: authData.session,
        error: null,
      };
    } catch (error) {
      // Record failed login attempt for unexpected errors
      SecurityService.recordFailedLogin(data.email, clientIP);
      
      await AuditService.logSecurityEvent('login_error', {
        email: data.email,
        error: (error as Error).message,
        ipAddress: clientIP
      });
      
      return {
        user: null,
        session: null,
        error: error as Error,
      };
    }
  }

  /**
   * Sign out the current user
   */
  static async signOut(): Promise<{ error: Error | null }> {
    try {
      // Get current user for audit logging
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id;
      
      const { error } = await supabase.auth.signOut();

      if (error) {
        return { error };
      }

      // Clear security state and secure storage
      SecurityService.clearSecurityState();
      SecureStorage.clear();

      // Log successful logout
      if (userId) {
        await AuditService.logAuthEvent('logout', userId, {
          success: true,
          timestamp: new Date().toISOString()
        });
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  }

  /**
   * Get the current session
   */
  static async getCurrentSession(): Promise<Session | null> {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      return session;
    } catch (error) {
      console.error('Error getting current session:', error);
      return null;
    }
  }

  /**
   * Get the current user profile
   */
  static async getCurrentUserProfile(): Promise<UserProfile | null> {
    try {
      const session = await this.getCurrentSession();
      if (!session?.user) {
        return null;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }

      return {
        id: data.id,
        email: data.email,
        dateOfBirth: new Date(data.date_of_birth),
        educationLevel: data.education_level,
        language: data.language,
        accessibilitySettings: data.accessibility_settings,
        consentGiven: data.consent_given,
        consentDate: new Date(data.consent_date),
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  }

  /**
   * Update user profile
   */
  static async updateUserProfile(
    updates: Partial<UserProfile>
  ): Promise<{ error: Error | null }> {
    try {
      const session = await this.getCurrentSession();
      if (!session?.user) {
        return { error: new Error('No authenticated user') };
      }

      const updateData: any = {};

      if (updates.dateOfBirth) {
        updateData.date_of_birth = updates.dateOfBirth
          .toISOString()
          .split('T')[0];
      }
      if (updates.educationLevel !== undefined) {
        updateData.education_level = updates.educationLevel;
      }
      if (updates.language) {
        updateData.language = updates.language;
      }
      if (updates.accessibilitySettings) {
        updateData.accessibility_settings = updates.accessibilitySettings;
      }

      updateData.updated_at = new Date().toISOString();

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', session.user.id);

      if (error) {
        return { error };
      }

      // Log the profile update for audit
      await this.logAuditEvent(session.user.id, 'profile_updated', {
        updated_fields: Object.keys(updateData),
      });

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  }

  /**
   * Reset password
   */
  static async resetPassword(email: string): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        return { error };
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  }

  /**
   * Update password
   */
  static async updatePassword(
    newPassword: string
  ): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        return { error };
      }

      // Log password change for audit
      const session = await this.getCurrentSession();
      if (session?.user) {
        await this.logAuditEvent(session.user.id, 'password_changed', {});
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  }

  /**
   * Subscribe to auth state changes
   */
  static onAuthStateChange(
    callback: (event: string, session: Session | null) => void
  ) {
    return supabase.auth.onAuthStateChange(callback);
  }

  /**
   * Log audit events for compliance
   */
  private static async logAuditEvent(
    userId: string,
    action: string,
    metadata: Record<string, any>
  ): Promise<void> {
    try {
      await supabase.from('audit_logs').insert([
        {
          user_id: userId,
          action,
          resource_type: 'user',
          resource_id: userId,
          metadata,
          ip_address: null, // Will be handled by Supabase
          user_agent: navigator.userAgent,
        },
      ]);
    } catch (error) {
      console.error('Failed to log audit event:', error);
      // Don't throw error as audit logging shouldn't break the main flow
    }
  }

  /**
   * Validate user data
   */
  static validateSignUpData(data: SignUpData): string[] {
    const errors: string[] = [];

    if (!data.email || !data.email.includes('@')) {
      errors.push('Email válido es requerido');
    }

    if (!data.password || data.password.length < 8) {
      errors.push('La contraseña debe tener al menos 8 caracteres');
    }

    if (!data.dateOfBirth) {
      errors.push('Fecha de nacimiento es requerida');
    } else {
      const age = this.calculateAge(data.dateOfBirth);
      if (age < 18) {
        errors.push('Debes ser mayor de 18 años para usar esta aplicación');
      }
      if (age > 120) {
        errors.push('Por favor verifica tu fecha de nacimiento');
      }
    }

    if (data.educationLevel < 0 || data.educationLevel > 30) {
      errors.push('Años de educación debe estar entre 0 y 30');
    }

    if (!data.consentGiven) {
      errors.push('Debes aceptar los términos y condiciones');
    }

    return errors;
  }

  /**
   * Calculate age from date of birth
   */
  private static calculateAge(dateOfBirth: Date): number {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age;
  }

  /**
   * Get client IP address (best effort)
   */
  private static async getClientIP(): Promise<string | undefined> {
    try {
      // In a real application, you might use a service to get the real IP
      // For now, we'll return undefined and let the server handle it
      return undefined;
    } catch (error) {
      return undefined;
    }
  }
}