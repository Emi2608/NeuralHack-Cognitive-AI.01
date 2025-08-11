// AccessibilityPanel Component - Settings panel for accessibility features
import React from 'react';
import {
  IonItem,
  IonLabel,
  IonToggle,
  IonSelect,
  IonSelectOption,
  IonList,
  IonListHeader,
  IonNote,
  IonIcon,
  IonButton,
} from '@ionic/react';
import {
  contrastOutline,
  textOutline,
  volumeHighOutline,
  fingerPrintOutline,
  accessibilityOutline,
} from 'ionicons/icons';
import { useAccessibility } from '../../hooks/useAccessibility';
import { VoiceControls } from './VoiceControls';

interface AccessibilityPanelProps {
  className?: string;
}

export const AccessibilityPanel: React.FC<AccessibilityPanelProps> = ({
  className = '',
}) => {
  const {
    settings,
    isVoiceSupported,
    toggleHighContrast,
    setFontSize,
    toggleVoiceGuidance,
    setTouchTargetSize,
    speak,
    stopSpeaking,
  } = useAccessibility();

  const handleTestVoice = () => {
    speak('Esta es una prueba de la guía de voz. La función está funcionando correctamente.');
  };

  return (
    <div className={`accessibility-panel ${className}`}>
      <IonList>
        <IonListHeader>
          <IonIcon icon={accessibilityOutline} slot="start" />
          <IonLabel>Configuración de Accesibilidad</IonLabel>
        </IonListHeader>

        {/* High Contrast Mode */}
        <IonItem>
          <IonIcon icon={contrastOutline} slot="start" />
          <IonLabel>
            <h3>Alto Contraste</h3>
            <IonNote className="setting-description">
              Mejora la visibilidad con colores de alto contraste
            </IonNote>
          </IonLabel>
          <IonToggle
            checked={settings.highContrast}
            onIonChange={toggleHighContrast}
            aria-label="Activar modo de alto contraste"
          />
        </IonItem>

        {/* Font Size */}
        <IonItem>
          <IonIcon icon={textOutline} slot="start" />
          <IonLabel>
            <h3>Tamaño de Fuente</h3>
            <IonNote className="setting-description">
              Ajusta el tamaño del texto para mejor legibilidad
            </IonNote>
          </IonLabel>
          <IonSelect
            value={settings.fontSize}
            onIonChange={(e: any) => setFontSize(e.detail.value)}
            interface="popover"
            aria-label="Seleccionar tamaño de fuente"
          >
            <IonSelectOption value="normal">Normal</IonSelectOption>
            <IonSelectOption value="large">Grande</IonSelectOption>
            <IonSelectOption value="extra-large">Extra Grande</IonSelectOption>
          </IonSelect>
        </IonItem>

        {/* Voice Guidance */}
        <IonItem>
          <IonIcon icon={volumeHighOutline} slot="start" />
          <IonLabel>
            <h3>Guía de Voz</h3>
            <IonNote className="setting-description">
              {isVoiceSupported
                ? 'Lee en voz alta las instrucciones y elementos de la interfaz'
                : 'No disponible en este dispositivo'}
            </IonNote>
          </IonLabel>
          <IonToggle
            checked={settings.voiceGuidance}
            disabled={!isVoiceSupported}
            onIonChange={toggleVoiceGuidance}
            aria-label="Activar guía de voz"
          />
        </IonItem>

        {/* Voice Test Button */}
        {isVoiceSupported && settings.voiceGuidance && (
          <IonItem>
            <IonLabel slot="start">
              <IonNote>Probar la guía de voz</IonNote>
            </IonLabel>
            <IonButton
              fill="outline"
              size="small"
              onClick={handleTestVoice}
              aria-label="Probar guía de voz"
            >
              Probar Voz
            </IonButton>
            <IonButton
              fill="outline"
              size="small"
              color="medium"
              onClick={stopSpeaking}
              aria-label="Detener voz"
            >
              Detener
            </IonButton>
          </IonItem>
        )}

        {/* Touch Target Size */}
        <IonItem>
          <IonIcon icon={fingerPrintOutline} slot="start" />
          <IonLabel>
            <h3>Tamaño de Botones</h3>
            <IonNote className="setting-description">
              Botones más grandes para facilitar la interacción táctil
            </IonNote>
          </IonLabel>
          <IonSelect
            value={settings.touchTargetSize}
            onIonChange={(e: any) => setTouchTargetSize(e.detail.value)}
            interface="popover"
            aria-label="Seleccionar tamaño de botones"
          >
            <IonSelectOption value="normal">Normal</IonSelectOption>
            <IonSelectOption value="large">Grande</IonSelectOption>
          </IonSelect>
        </IonItem>

        {/* Keyboard Navigation Info */}
        <IonItem>
          <IonLabel>
            <h3>Navegación por Teclado</h3>
            <IonNote className="setting-description">
              Siempre activa. Use Tab para navegar, Enter/Espacio para activar, Escape para cerrar
            </IonNote>
          </IonLabel>
        </IonItem>

        {/* System Preferences Info */}
        <IonItem lines="none">
          <IonLabel>
            <IonNote className="setting-description">
              <strong>Nota:</strong> Algunas configuraciones se ajustan automáticamente 
              según las preferencias de accesibilidad de su sistema operativo.
            </IonNote>
          </IonLabel>
        </IonItem>
      </IonList>

      {/* Voice Controls - Only show if voice guidance is enabled */}
      {settings.voiceGuidance && <VoiceControls />}
    </div>
  );
};