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
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm`,
          data: {
            email: data.email,
            language: data.language
          }
        }
      });

      if (authError) {
        return { user: null, session: null, error: authError };
      }

      // When email confirmation is enabled, user is created but session is null
      // This is expected behavior - user needs to confirm email first
      if (!authData.user) {
        return {
          user: null,
          session: null,
          error: new Error('Failed to create user'),
        };
      }

      // Create user profile data (we'll store it even if email isn't confirmed yet)
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

      // Try to create the profile - this might fail if email confirmation is required
      // and the user doesn't exist in the profiles table yet
      try {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([profileData]);

        if (profileError && !profileError.message.includes('duplicate key')) {
          console.warn('Profile creation failed, will retry after email confirmation:', profileError);
        }
      } catch (profileError) {
        console.warn('Profile creation failed, will retry after email confirmation:', profileError);
      }

      // If email confirmation is required, return success without session
      if (!authData.session && authData.user && !authData.user.email_confirmed_at) {
        return {
          user: authData.user,
          session: null,
          error: null // This is not an error - user needs to confirm email
        };
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
    console.log('🔐 AuthService.signIn called with email:', data.email);
    
    try {
      const clientIP = await this.getClientIP();
      console.log('🌐 Client IP obtained:', clientIP);
      
      // Validate login attempt (check for rate limiting) - with timeout
      let isRateLimited = false;
      try {
        isRateLimited = !SecurityService.validateLoginAttempt(data.email, clientIP);
      } catch (securityError) {
        console.warn('⚠️ Security validation failed (non-blocking):', securityError);
        // Continue with login even if security check fails
      }

      if (isRateLimited) {
        const error = new Error('Demasiados intentos de login. Intenta de nuevo más tarde.');
        
        // Log security event but don't let it block the response
        try {
          await Promise.race([
            AuditService.logSecurityEvent('login_blocked', {
              email: data.email,
              reason: 'rate_limit_exceeded',
              ipAddress: clientIP
            }),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Audit timeout')), 2000))
          ]);
        } catch (auditError) {
          console.warn('⚠️ Audit logging failed (non-blocking):', auditError);
        }
        
        return { user: null, session: null, error };
      }

      console.log('🔐 Attempting Supabase authentication...');
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      console.log('🔐 Supabase auth result:', { 
        hasUser: !!authData.user, 
        hasSession: !!authData.session, 
        error: error?.message 
      });

      if (error) {
        console.error('❌ Supabase auth error:', error);
        
        // Record failed login attempt (non-blocking)
        try {
          SecurityService.recordFailedLogin(data.email, clientIP);
          
          await Promise.race([
            AuditService.logAuthEvent('login', undefined, {
              email: data.email,
              success: false,
              error: error.message,
              ipAddress: clientIP
            }),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Audit timeout')), 2000))
          ]);
        } catch (auditError) {
          console.warn('⚠️ Failed login audit failed (non-blocking):', auditError);
        }
        
        return { user: null, session: null, error };
      }

      // Record successful login (non-blocking)
      if (authData.user) {
        console.log('✅ Login successful, recording success...');
        
        try {
          SecurityService.recordSuccessfulLogin(authData.user.id, clientIP);
          
          // Initialize secure storage with user session
          if (authData.session?.access_token) {
            await SecureStorage.initialize(authData.session.access_token);
          }
          
          // Log success events with timeout
          await Promise.race([
            Promise.all([
              AuditService.logAuthEvent('login', authData.user.id, {
                email: data.email,
                success: true,
                ipAddress: clientIP
              }),
              this.logAuditEvent(authData.user.id, 'user_signed_in', {
                email: data.email,
              })
            ]),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Audit timeout')), 3000))
          ]);
        } catch (auditError) {
          console.warn('⚠️ Success audit logging failed (non-blocking):', auditError);
          // Don't let audit failures block successful login
        }
      }

      console.log('✅ AuthService.signIn completed successfully');
      return {
        user: authData.user,
        session: authData.session,
        error: null,
      };
    } catch (error) {
      console.error('❌ Unexpected error in AuthService.signIn:', error);
      
      // Record failed login attempt for unexpected errors (non-blocking)
      try {
        const clientIP = await this.getClientIP();
        SecurityService.recordFailedLogin(data.email, clientIP);
        
        await Promise.race([
          AuditService.logSecurityEvent('login_error', {
            email: data.email,
            error: (error as Error).message,
            ipAddress: clientIP
          }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Audit timeout')), 2000))
        ]);
      } catch (auditError) {
        console.warn('⚠️ Error audit logging failed (non-blocking):', auditError);
      }
      
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
        .maybeSingle();

      if (error) {
        console.error('Error fetching user profile:', error);
        
        // If profile doesn't exist, try to create it using the complete registration function
        if (error.code === 'PGRST116' || error.message.includes('No rows found')) {
          console.log('Profile not found, attempting to create it...');
          try {
            const { error: createError } = await this.completeProfileAfterConfirmation(
              session.user.id,
              session.user.email || '',
              undefined,
              undefined,
              'es'
            );
            
            if (!createError) {
              // Retry fetching the profile
              const { data: retryData, error: retryError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .maybeSingle();
                
              if (!retryError && retryData) {
                return this.mapProfileData(retryData);
              }
            }
          } catch (createError) {
            console.error('Failed to create profile:', createError);
          }
        }
        
        return null;
      }

      if (!data) {
        console.log('No profile data found for user');
        return null;
      }

      return this.mapProfileData(data);
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  }

  /**
   * Map database profile data to UserProfile type
   */
  private static mapProfileData(data: any): UserProfile {
    return {
      id: data.id,
      email: data.email,
      dateOfBirth: data.date_of_birth ? new Date(data.date_of_birth) : new Date(),
      educationLevel: data.education_level || 0,
      language: data.language || 'es',
      accessibilitySettings: data.accessibility_settings || {
        highContrast: false,
        fontSize: 'normal',
        voiceGuidance: false,
        keyboardNavigation: false,
        touchTargetSize: 'normal',
      },
      consentGiven: data.consent_given || false,
      consentDate: data.consent_date ? new Date(data.consent_date) : new Date(),
      createdAt: data.created_at ? new Date(data.created_at) : new Date(),
      updatedAt: data.updated_at ? new Date(data.updated_at) : new Date(),
    };
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
      // Add a small delay and unique identifier to prevent duplicate entries
      const uniqueMetadata = {
        ...metadata,
        timestamp: new Date().toISOString(),
        client_id: `${userId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      };

      const { error } = await supabase.from('audit_logs').insert([
        {
          user_id: userId,
          action,
          resource_type: 'user',
          resource_id: userId,
          metadata: uniqueMetadata,
          ip_address: null, // Will be handled by Supabase
          user_agent: navigator.userAgent,
        },
      ]);

      if (error) {
        console.warn('Audit log insert failed:', error);
        // Store in local storage as fallback
        this.storeAuditEventLocally(userId, action, uniqueMetadata);
      }
    } catch (error) {
      console.error('Failed to log audit event:', error);
      // Store in local storage as fallback
      this.storeAuditEventLocally(userId, action, metadata);
    }
  }

  /**
   * Store audit event locally as fallback
   */
  private static storeAuditEventLocally(
    userId: string,
    action: string,
    metadata: Record<string, any>
  ): void {
    try {
      const auditEvent = {
        user_id: userId,
        action,
        resource_type: 'user',
        resource_id: userId,
        metadata,
        timestamp: new Date().toISOString(),
        user_agent: navigator.userAgent,
      };

      const existingEvents = localStorage.getItem('pending_audit_events');
      const events = existingEvents ? JSON.parse(existingEvents) : [];
      events.push(auditEvent);

      // Keep only last 100 events in local storage
      if (events.length > 100) {
        events.splice(0, events.length - 100);
      }

      localStorage.setItem('pending_audit_events', JSON.stringify(events));
    } catch (error) {
      console.error('Failed to store audit event locally:', error);
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
   * Complete user profile after email confirmation using database function
   */
  static async completeProfileAfterConfirmation(
    userId: string, 
    email: string,
    dateOfBirth?: Date,
    educationLevel?: number,
    language: string = 'es'
  ): Promise<{ error: Error | null; success: boolean }> {
    try {
      const { data, error } = await supabase.rpc('complete_user_registration', {
        user_id: userId,
        user_email: email,
        date_of_birth: dateOfBirth?.toISOString().split('T')[0] || null,
        education_level: educationLevel || null,
        language_pref: language
      });

      if (error) {
        return { error, success: false };
      }

      return { 
        error: null, 
        success: data?.success || false 
      };
    } catch (error) {
      return { error: error as Error, success: false };
    }
  }

  /**
   * Check user confirmation status
   */
  static async checkConfirmationStatus(email: string): Promise<{
    exists: boolean;
    confirmed: boolean;
    profileExists: boolean;
    message: string;
    error: Error | null;
  }> {
    try {
      const { data, error } = await supabase.rpc('check_user_confirmation_status', {
        user_email: email
      });

      if (error) {
        return {
          exists: false,
          confirmed: false,
          profileExists: false,
          message: 'Error al verificar estado',
          error
        };
      }

      return {
        exists: data?.exists || false,
        confirmed: data?.confirmed || false,
        profileExists: data?.profile_exists || false,
        message: data?.message || 'Estado desconocido',
        error: null
      };
    } catch (error) {
      return {
        exists: false,
        confirmed: false,
        profileExists: false,
        message: 'Error inesperado',
        error: error as Error
      };
    }
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