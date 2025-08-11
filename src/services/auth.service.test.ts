import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from './auth.service';
import { supabase } from './supabase';

// Mock Supabase
vi.mock('./supabase', () => ({
  supabase: {
    auth: {
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(),
      resetPasswordForEmail: vi.fn()
    },
    from: vi.fn(() => ({
      insert: vi.fn(),
      select: vi.fn(),
      update: vi.fn(),
      eq: vi.fn()
    }))
  }
}));

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
    vi.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        user_metadata: {}
      };

      vi.mocked(supabase.auth.signUp).mockResolvedValue({
        data: { user: mockUser, session: null },
        error: null
      });

      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockResolvedValue({ data: null, error: null }),
        select: vi.fn(),
        update: vi.fn(),
        eq: vi.fn()
      } as any);

      const userData = {
        email: 'test@example.com',
        password: 'password123',
        age: 45,
        education: 16,
        language: 'es'
      };

      const result = await authService.register(userData);

      expect(result.success).toBe(true);
      expect(result.user).toEqual(mockUser);
      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            age: userData.age,
            education: userData.education,
            language: userData.language
          }
        }
      });
    });

    it('should handle registration errors', async () => {
      const error = new Error('Email already registered');
      vi.mocked(supabase.auth.signUp).mockResolvedValue({
        data: { user: null, session: null },
        error
      });

      const userData = {
        email: 'test@example.com',
        password: 'password123',
        age: 45,
        education: 16,
        language: 'es'
      };

      const result = await authService.register(userData);

      expect(result.success).toBe(false);
      expect(result.error).toBe(error.message);
    });
  });

  describe('login', () => {
    it('should login user successfully', async () => {
      const mockSession = {
        user: { id: 'user-123', email: 'test@example.com' },
        access_token: 'token-123'
      };

      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: { user: mockSession.user, session: mockSession },
        error: null
      });

      const result = await authService.login('test@example.com', 'password123');

      expect(result.success).toBe(true);
      expect(result.user).toEqual(mockSession.user);
      expect(result.session).toEqual(mockSession);
    });

    it('should handle login errors', async () => {
      const error = new Error('Invalid credentials');
      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: { user: null, session: null },
        error
      });

      const result = await authService.login('test@example.com', 'wrongpassword');

      expect(result.success).toBe(false);
      expect(result.error).toBe(error.message);
    });
  });

  describe('logout', () => {
    it('should logout user successfully', async () => {
      vi.mocked(supabase.auth.signOut).mockResolvedValue({ error: null });

      const result = await authService.logout();

      expect(result.success).toBe(true);
      expect(supabase.auth.signOut).toHaveBeenCalled();
    });

    it('should handle logout errors', async () => {
      const error = new Error('Logout failed');
      vi.mocked(supabase.auth.signOut).mockResolvedValue({ error });

      const result = await authService.logout();

      expect(result.success).toBe(false);
      expect(result.error).toBe(error.message);
    });
  });

  describe('getCurrentSession', () => {
    it('should return current session', async () => {
      const mockSession = {
        user: { id: 'user-123', email: 'test@example.com' },
        access_token: 'token-123'
      };

      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: mockSession },
        error: null
      });

      const result = await authService.getCurrentSession();

      expect(result).toEqual(mockSession);
    });

    it('should return null when no session', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null
      });

      const result = await authService.getCurrentSession();

      expect(result).toBeNull();
    });
  });

  describe('resetPassword', () => {
    it('should send password reset email', async () => {
      vi.mocked(supabase.auth.resetPasswordForEmail).mockResolvedValue({
        data: {},
        error: null
      });

      const result = await authService.resetPassword('test@example.com');

      expect(result.success).toBe(true);
      expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith('test@example.com');
    });

    it('should handle password reset errors', async () => {
      const error = new Error('Email not found');
      vi.mocked(supabase.auth.resetPasswordForEmail).mockResolvedValue({
        data: {},
        error
      });

      const result = await authService.resetPassword('test@example.com');

      expect(result.success).toBe(false);
      expect(result.error).toBe(error.message);
    });
  });

  describe('updateProfile', () => {
    it('should update user profile', async () => {
      const mockChain = {
        eq: vi.fn().mockResolvedValue({ data: null, error: null })
      };

      vi.mocked(supabase.from).mockReturnValue({
        update: vi.fn().mockReturnValue(mockChain),
        insert: vi.fn(),
        select: vi.fn(),
        eq: vi.fn()
      } as any);

      const profileData = {
        age: 46,
        education: 18,
        language: 'en'
      };

      const result = await authService.updateProfile('user-123', profileData);

      expect(result.success).toBe(true);
    });
  });
});