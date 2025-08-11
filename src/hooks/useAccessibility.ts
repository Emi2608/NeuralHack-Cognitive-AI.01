// useAccessibility Hook - React hook for accessibility features
import { useState, useEffect, useCallback } from 'react';
import { AccessibilitySettings } from '../types/assessment';
import { accessibilityService } from '../services/accessibility.service';

export const useAccessibility = () => {
  const [settings, setSettings] = useState<AccessibilitySettings>(
    accessibilityService.getSettings()
  );
  const [isVoiceSupported, setIsVoiceSupported] = useState<boolean>(false);

  useEffect(() => {
    // Check if speech synthesis is supported
    setIsVoiceSupported('speechSynthesis' in window);

    // Initialize from system preferences
    accessibilityService.initializeFromSystemPreferences();

    // Setup keyboard navigation
    accessibilityService.setupKeyboardNavigation();

    // Update settings when they change
    const updateSettings = () => {
      setSettings(accessibilityService.getSettings());
    };

    // Listen for settings changes (we'll implement this if needed)
    // For now, we'll just update when the hook is used
    updateSettings();

    return () => {
      // Cleanup if needed
    };
  }, []);

  const updateSettings = useCallback((newSettings: Partial<AccessibilitySettings>) => {
    accessibilityService.updateSettings(newSettings);
    setSettings(accessibilityService.getSettings());
  }, []);

  const toggleHighContrast = useCallback(() => {
    accessibilityService.toggleHighContrast();
    setSettings(accessibilityService.getSettings());
  }, []);

  const setFontSize = useCallback((size: 'normal' | 'large' | 'extra-large') => {
    accessibilityService.setFontSize(size);
    setSettings(accessibilityService.getSettings());
  }, []);

  const toggleVoiceGuidance = useCallback(() => {
    accessibilityService.toggleVoiceGuidance();
    setSettings(accessibilityService.getSettings());
  }, []);

  const setTouchTargetSize = useCallback((size: 'normal' | 'large') => {
    accessibilityService.setTouchTargetSize(size);
    setSettings(accessibilityService.getSettings());
  }, []);

  const speak = useCallback((text: string, options?: any) => {
    accessibilityService.speak(text, options);
  }, []);

  const stopSpeaking = useCallback(() => {
    accessibilityService.stopSpeaking();
  }, []);

  const announceElement = useCallback((element: HTMLElement) => {
    accessibilityService.announceElement(element);
  }, []);

  const prefersReducedMotion = useCallback(() => {
    return accessibilityService.prefersReducedMotion();
  }, []);

  const prefersHighContrast = useCallback(() => {
    return accessibilityService.prefersHighContrast();
  }, []);

  return {
    settings,
    isVoiceSupported,
    updateSettings,
    toggleHighContrast,
    setFontSize,
    toggleVoiceGuidance,
    setTouchTargetSize,
    speak,
    stopSpeaking,
    announceElement,
    prefersReducedMotion,
    prefersHighContrast,
  };
};