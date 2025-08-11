// Accessibility Service - Manages accessibility features
import type { AccessibilitySettings } from '../types/assessment';

export class AccessibilityService {
  private static instance: AccessibilityService;
  private settings: AccessibilitySettings;
  private speechSynthesis: SpeechSynthesis | null = null;

  private constructor() {
    this.settings = this.loadSettings();
    this.speechSynthesis = window.speechSynthesis || null;
    this.applySettings();
  }

  public static getInstance(): AccessibilityService {
    if (!AccessibilityService.instance) {
      AccessibilityService.instance = new AccessibilityService();
    }
    return AccessibilityService.instance;
  }

  // Load settings from localStorage
  private loadSettings(): AccessibilitySettings {
    const saved = localStorage.getItem('accessibility-settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (error) {
        console.warn('Failed to parse accessibility settings:', error);
      }
    }

    // Default settings
    return {
      highContrast: false,
      fontSize: 'normal',
      voiceGuidance: false,
      keyboardNavigation: true,
      touchTargetSize: 'normal',
    };
  }

  // Save settings to localStorage
  private saveSettings(): void {
    localStorage.setItem('accessibility-settings', JSON.stringify(this.settings));
  }

  // Apply current settings to the DOM
  private applySettings(): void {
    const root = document.documentElement;

    // High contrast mode
    if (this.settings.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    // Font size
    root.classList.remove('font-normal', 'font-large', 'font-extra-large');
    root.classList.add(`font-${this.settings.fontSize.replace('_', '-')}`);

    // Touch target size
    if (this.settings.touchTargetSize === 'large') {
      root.classList.add('large-touch-targets');
    } else {
      root.classList.remove('large-touch-targets');
    }

    // Keyboard navigation
    if (this.settings.keyboardNavigation) {
      root.classList.add('keyboard-navigation');
    } else {
      root.classList.remove('keyboard-navigation');
    }
  }

  // Get current settings
  public getSettings(): AccessibilitySettings {
    return { ...this.settings };
  }

  // Update settings
  public updateSettings(newSettings: Partial<AccessibilitySettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    this.saveSettings();
    this.applySettings();
    
    // Announce changes if voice guidance is enabled
    if (this.settings.voiceGuidance) {
      this.announceSettingsChange(newSettings);
    }
  }

  // Toggle high contrast mode
  public toggleHighContrast(): void {
    this.updateSettings({ highContrast: !this.settings.highContrast });
  }

  // Set font size
  public setFontSize(size: 'normal' | 'large' | 'extra-large'): void {
    this.updateSettings({ fontSize: size });
  }

  // Toggle voice guidance
  public toggleVoiceGuidance(): void {
    const newValue = !this.settings.voiceGuidance;
    this.updateSettings({ voiceGuidance: newValue });
    
    if (newValue && this.speechSynthesis) {
      this.speak('Guía de voz activada');
    }
  }

  // Set touch target size
  public setTouchTargetSize(size: 'normal' | 'large'): void {
    this.updateSettings({ touchTargetSize: size });
  }

  // Speak text using Web Speech API
  public speak(text: string, options: SpeechSynthesisUtteranceOptions = {}): void {
    if (!this.settings.voiceGuidance || !this.speechSynthesis) {
      return;
    }

    // Cancel any ongoing speech
    this.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES';
    utterance.rate = options.rate || 0.9;
    utterance.pitch = options.pitch || 1;
    utterance.volume = options.volume || 0.8;

    // Find Spanish voice if available
    const voices = this.speechSynthesis.getVoices();
    const spanishVoice = voices.find(voice => 
      voice.lang.startsWith('es') || voice.name.toLowerCase().includes('spanish')
    );
    
    if (spanishVoice) {
      utterance.voice = spanishVoice;
    }

    this.speechSynthesis.speak(utterance);
  }

  // Stop current speech
  public stopSpeaking(): void {
    if (this.speechSynthesis) {
      this.speechSynthesis.cancel();
    }
  }

  // Announce element focus for screen readers
  public announceElement(element: HTMLElement): void {
    if (!this.settings.voiceGuidance) return;

    const text = this.getElementDescription(element);
    if (text) {
      this.speak(text);
    }
  }

  // Get accessible description of an element
  private getElementDescription(element: HTMLElement): string {
    // Check for aria-label first
    if (element.getAttribute('aria-label')) {
      return element.getAttribute('aria-label')!;
    }

    // Check for aria-labelledby
    const labelledBy = element.getAttribute('aria-labelledby');
    if (labelledBy) {
      const labelElement = document.getElementById(labelledBy);
      if (labelElement) {
        return labelElement.textContent || '';
      }
    }

    // Check for associated label
    if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
      const id = element.getAttribute('id');
      if (id) {
        const label = document.querySelector(`label[for="${id}"]`);
        if (label) {
          return label.textContent || '';
        }
      }
    }

    // Fall back to text content or placeholder
    return element.textContent || 
           element.getAttribute('placeholder') || 
           element.getAttribute('title') || 
           '';
  }

  // Announce settings changes
  private announceSettingsChange(changes: Partial<AccessibilitySettings>): void {
    const announcements: string[] = [];

    if (changes.highContrast !== undefined) {
      announcements.push(
        changes.highContrast ? 'Alto contraste activado' : 'Alto contraste desactivado'
      );
    }

    if (changes.fontSize) {
      const sizeNames = {
        normal: 'normal',
        large: 'grande',
        'extra-large': 'extra grande'
      };
      announcements.push(`Tamaño de fuente cambiado a ${sizeNames[changes.fontSize]}`);
    }

    if (changes.touchTargetSize) {
      announcements.push(
        changes.touchTargetSize === 'large' 
          ? 'Botones grandes activados' 
          : 'Botones de tamaño normal'
      );
    }

    if (announcements.length > 0) {
      this.speak(announcements.join('. '));
    }
  }

  // Setup keyboard navigation handlers
  public setupKeyboardNavigation(): void {
    document.addEventListener('keydown', this.handleKeyboardNavigation.bind(this));
  }

  // Handle keyboard navigation
  private handleKeyboardNavigation(event: KeyboardEvent): void {
    if (!this.settings.keyboardNavigation) return;

    // Skip if user is typing in an input
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
      return;
    }

    switch (event.key) {
      case 'Tab':
        // Enhanced tab navigation - announce focused element
        setTimeout(() => {
          const focused = document.activeElement as HTMLElement;
          if (focused && this.settings.voiceGuidance) {
            this.announceElement(focused);
          }
        }, 100);
        break;

      case 'Escape':
        // Close modals or return to previous screen
        const modal = document.querySelector('ion-modal[is-open="true"]');
        if (modal) {
          (modal as any).dismiss();
        }
        break;

      case 'Enter':
      case ' ':
        // Activate focused element if it's not naturally interactive
        const focused = document.activeElement as HTMLElement;
        if (focused && focused.getAttribute('role') === 'button') {
          event.preventDefault();
          focused.click();
        }
        break;
    }
  }

  // Check if user prefers reduced motion
  public prefersReducedMotion(): boolean {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  // Check if user prefers high contrast
  public prefersHighContrast(): boolean {
    return window.matchMedia('(prefers-contrast: high)').matches;
  }

  // Initialize accessibility features based on system preferences
  public initializeFromSystemPreferences(): void {
    const updates: Partial<AccessibilitySettings> = {};

    if (this.prefersHighContrast()) {
      updates.highContrast = true;
    }

    // Check for large text preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      // Users who prefer reduced motion might also prefer larger text
      updates.fontSize = 'large';
    }

    if (Object.keys(updates).length > 0) {
      this.updateSettings(updates);
    }
  }
}

// Speech synthesis options interface
interface SpeechSynthesisUtteranceOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
}

// Export singleton instance
export const accessibilityService = AccessibilityService.getInstance();