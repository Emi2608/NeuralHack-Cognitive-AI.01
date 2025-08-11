// VoiceGuidance Component - Enhanced voice guidance for assessments
import React, { useEffect, useRef } from 'react';
import { useAccessibility } from '../../hooks/useAccessibility';

interface VoiceGuidanceProps {
  children: React.ReactNode;
  announceOnMount?: string;
  announceOnFocus?: boolean;
  className?: string;
}

export const VoiceGuidance: React.FC<VoiceGuidanceProps> = ({
  children,
  announceOnMount,
  announceOnFocus = false,
  className = '',
}) => {
  const { speak, settings, announceElement } = useAccessibility();
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (announceOnMount && settings.voiceGuidance) {
      // Delay announcement to ensure page is ready
      const timer = setTimeout(() => {
        speak(announceOnMount);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [announceOnMount, speak, settings.voiceGuidance]);

  const handleFocus = () => {
    if (announceOnFocus && elementRef.current && settings.voiceGuidance) {
      announceElement(elementRef.current);
    }
  };

  return (
    <div
      ref={elementRef}
      className={`voice-guidance ${className} ${settings.voiceGuidance ? 'voice-guidance-active' : ''}`}
      onFocus={handleFocus}
      tabIndex={announceOnFocus ? 0 : undefined}
    >
      {children}
    </div>
  );
};

// Hook for voice announcements in components
export const useVoiceAnnouncement = () => {
  const { speak, settings } = useAccessibility();

  const announce = (text: string, delay: number = 0) => {
    if (!settings.voiceGuidance) return;

    if (delay > 0) {
      setTimeout(() => speak(text), delay);
    } else {
      speak(text);
    }
  };

  const announceNavigation = (pageName: string) => {
    announce(`Navegando a ${pageName}`, 300);
  };

  const announceError = (errorMessage: string) => {
    announce(`Error: ${errorMessage}`, 100);
  };

  const announceSuccess = (successMessage: string) => {
    announce(`Éxito: ${successMessage}`, 100);
  };

  const announceProgress = (current: number, total: number, context: string = '') => {
    const progressText = context 
      ? `${context}: ${current} de ${total}` 
      : `Progreso: ${current} de ${total}`;
    announce(progressText);
  };

  const announceFormValidation = (fieldName: string, errorMessage: string) => {
    announce(`Error en ${fieldName}: ${errorMessage}`, 100);
  };

  return {
    announce,
    announceNavigation,
    announceError,
    announceSuccess,
    announceProgress,
    announceFormValidation,
    isVoiceEnabled: settings.voiceGuidance,
  };
};