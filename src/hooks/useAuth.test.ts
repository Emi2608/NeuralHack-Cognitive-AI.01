import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAuth } from './useAuth';
import { AuthService } from '../services/auth.service';

// Mock AuthService
vi.mock('../services/auth.service', () => ({
  AuthService: vi.fn().mockImplementation(() => ({
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    getCurrentSession: vi.fn(),
    resetPassword: vi.fn(),
    updateProfile: vi.fn(),
    onAuthStateChange: vi.fn()
  }))
}));

describe('useAuth', () => {
  let mockAuthService: any;

  beforeEach(() => {
    mockAuthService = new AuthService();
    vi.clearAllMocks();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useAuth());

    expect(result.current.user).toBeNull();
    expect(result.current.session).toBeNull();
    expect(result.current.isLoading).toBe(true);
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('should handle successful login', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' };
    const mockSession = { user: mockUser, access_token: 'token-123' };

    mockAuthService.login.mockResolvedValue({
      success: true,
      user: mockUser,
      session: mockSession
    });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      const loginResult = await result.current.login('test@example.com', 'password123');
      expect(loginResult.success).toBe(true);
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.session).toEqual(mockSession);
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.isLoading).toBe(false);
  });

  it('should handle login failure', async () => {
    mockAuthService.login.mockResolvedValue({
      success: false,
      error: 'Invalid credentials'
    });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      const loginResult = await result.current.login('test@example.com', 'wrongpassword');
      expect(loginResult.success).toBe(false);
      expect(loginResult.error).toBe('Invalid credentials');
    });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('should handle successful registration', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' };

    mockAuthService.register.mockResolvedValue({
      success: true,
      user: mockUser
    });

    const { result } = renderHook(() => useAuth());

    const userData = {
      email: 'test@example.com',
      password: 'password123',
      age: 45,
      education: 16,
      language: 'es'
    };

    await act(async () => {
      const registerResult = await result.current.register(userData);
      expect(registerResult.success).toBe(true);
    });

    expect(result.current.user).toEqual(mockUser);
  });

  it('should handle registration failure', async () => {
    mockAuthService.register.mockResolvedValue({
      success: false,
      error: 'Email already exists'
    });

    const { result } = renderHook(() => useAuth());

    const userData = {
      email: 'existing@example.com',
      password: 'password123',
      age: 45,
      education: 16,
      language: 'es'
    };

    await act(async () => {
      const registerResult = await result.current.register(userData);
      expect(registerResult.success).toBe(false);
      expect(registerResult.error).toBe('Email already exists');
    });

    expect(result.current.user).toBeNull();
  });

  it('should handle logout', async () => {
    // First set up authenticated state
    const mockUser = { id: 'user-123', email: 'test@example.com' };
    const mockSession = { user: mockUser, access_token: 'token-123' };

    mockAuthService.login.mockResolvedValue({
      success: true,
      user: mockUser,
      session: mockSession
    });

    mockAuthService.logout.mockResolvedValue({
      success: true
    });

    const { result } = renderHook(() => useAuth());

    // Login first
    await act(async () => {
      await result.current.login('test@example.com', 'password123');
    });

    expect(result.current.isAuthenticated).toBe(true);

    // Then logout
    await act(async () => {
      const logoutResult = await result.current.logout();
      expect(logoutResult.success).toBe(true);
    });

    expect(result.current.user).toBeNull();
    expect(result.current.session).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('should handle password reset', async () => {
    mockAuthService.resetPassword.mockResolvedValue({
      success: true
    });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      const resetResult = await result.current.resetPassword('test@example.com');
      expect(resetResult.success).toBe(true);
    });

    expect(mockAuthService.resetPassword).toHaveBeenCalledWith('test@example.com');
  });

  it('should handle profile update', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' };
    
    // Set up authenticated state
    mockAuthService.login.mockResolvedValue({
      success: true,
      user: mockUser,
      session: { user: mockUser, access_token: 'token-123' }
    });

    mockAuthService.updateProfile.mockResolvedValue({
      success: true
    });

    const { result } = renderHook(() => useAuth());

    // Login first
    await act(async () => {
      await result.current.login('test@example.com', 'password123');
    });

    const profileData = {
      age: 46,
      education: 18,
      language: 'en'
    };

    await act(async () => {
      const updateResult = await result.current.updateProfile(profileData);
      expect(updateResult.success).toBe(true);
    });

    expect(mockAuthService.updateProfile).toHaveBeenCalledWith('user-123', profileData);
  });

  it('should handle session restoration on mount', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' };
    const mockSession = { user: mockUser, access_token: 'token-123' };

    mockAuthService.getCurrentSession.mockResolvedValue(mockSession);

    const { result } = renderHook(() => useAuth());

    // Wait for session restoration
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.session).toEqual(mockSession);
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.isLoading).toBe(false);
  });

  it('should handle no existing session on mount', async () => {
    mockAuthService.getCurrentSession.mockResolvedValue(null);

    const { result } = renderHook(() => useAuth());

    // Wait for session check
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.user).toBeNull();
    expect(result.current.session).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });

  it('should handle auth state changes', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' };
    const mockSession = { user: mockUser, access_token: 'token-123' };

    let authStateCallback: any;
    mockAuthService.onAuthStateChange.mockImplementation((callback: any) => {
      authStateCallback = callback;
      return { unsubscribe: vi.fn() };
    });

    const { result } = renderHook(() => useAuth());

    // Simulate auth state change
    await act(async () => {
      authStateCallback('SIGNED_IN', mockSession);
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.session).toEqual(mockSession);
    expect(result.current.isAuthenticated).toBe(true);

    // Simulate sign out
    await act(async () => {
      authStateCallback('SIGNED_OUT', null);
    });

    expect(result.current.user).toBeNull();
    expect(result.current.session).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('should cleanup auth listener on unmount', () => {
    const mockUnsubscribe = vi.fn();
    mockAuthService.onAuthStateChange.mockReturnValue({
      unsubscribe: mockUnsubscribe
    });

    const { unmount } = renderHook(() => useAuth());

    unmount();

    expect(mockUnsubscribe).toHaveBeenCalled();
  });
});