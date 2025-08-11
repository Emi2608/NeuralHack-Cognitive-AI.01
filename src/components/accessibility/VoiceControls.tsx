// VoiceControls Component - Controls for voice guidance settings
import React, { useState, useEffect } from 'react';
import {
  IonItem,
  IonLabel,
  IonRange,
  IonNote,
  IonButton,
  IonIcon,
  IonList,
  IonListHeader,
} from '@ionic/react';
import {
  volumeHighOutline,
  speedometerOutline,
  playOutline,
  stopOutline,
} from 'ionicons/icons';
import { useAccessibility } from '../../hooks/useAccessibility';

interface VoiceControlsProps {
  className?: string;
}

interface VoiceSettings {
  rate: number;
  pitch: number;
  volume: number;
}

export const VoiceControls: React.FC<VoiceControlsProps> = ({
  className = '',
}) => {
  const { settings, speak, stopSpeaking, isVoiceSupported } = useAccessibility();
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>({
    rate: 0.9,
    pitch: 1.0,
    volume: 0.8,
  });
  const [isTesting, setIsTesting] = useState(false);

  // Load voice settings from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('voice-settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setVoiceSettings(parsed);
      } catch (error) {
        console.warn('Failed to parse voice settings:', error);
      }
    }
  }, []);

  // Save voice settings to localStorage
  const saveVoiceSettings = (newSettings: VoiceSettings) => {
    setVoiceSettings(newSettings);
    localStorage.setItem('voice-settings', JSON.stringify(newSettings));
  };

  const handleRateChange = (value: number) => {
    const newSettings = { ...voiceSettings, rate: value };
    saveVoiceSettings(newSettings);
  };

  const handlePitchChange = (value: number) => {
    const newSettings = { ...voiceSettings, pitch: value };
    saveVoiceSettings(newSettings);
  };

  const handleVolumeChange = (value: number) => {
    const newSettings = { ...voiceSettings, volume: value };
    saveVoiceSettings(newSettings);
  };

  const handleTestVoice = () => {
    if (isTesting) {
      stopSpeaking();
      setIsTesting(false);
    } else {
      setIsTesting(true);
      const testText = `Esta es una prueba de la configuración de voz. 
        Velocidad al ${Math.round(voiceSettings.rate * 100)} por ciento, 
        tono al ${Math.round(voiceSettings.pitch * 100)} por ciento, 
        y volumen al ${Math.round(voiceSettings.volume * 100)} por ciento.`;
      
      speak(testText, voiceSettings);
      
      // Reset testing state after a delay
      setTimeout(() => {
        setIsTesting(false);
      }, 8000);
    }
  };

  if (!isVoiceSupported || !settings.voiceGuidance) {
    return null;
  }

  return (
    <div className={`voice-controls ${className}`}>
      <IonList>
        <IonListHeader>
          <IonIcon icon={volumeHighOutline} slot="start" />
          <IonLabel>Configuración de Voz</IonLabel>
        </IonListHeader>

        {/* Speech Rate */}
        <IonItem>
          <IonIcon icon={speedometerOutline} slot="start" />
          <IonLabel>
            <h3>Velocidad de Habla</h3>
            <IonNote>
              {Math.round(voiceSettings.rate * 100)}% - 
              {voiceSettings.rate < 0.7 ? ' Lenta' : 
               voiceSettings.rate > 1.2 ? ' Rápida' : ' Normal'}
            </IonNote>
          </IonLabel>
          <IonRange
            min={0.5}
            max={2.0}
            step={0.1}
            value={voiceSettings.rate}
            onIonInput={(e) => handleRateChange(e.detail.value as number)}
            aria-label="Velocidad de habla"
          />
        </IonItem>

        {/* Speech Pitch */}
        <IonItem>
          <IonLabel>
            <h3>Tono de Voz</h3>
            <IonNote>
              {Math.round(voiceSettings.pitch * 100)}% - 
              {voiceSettings.pitch < 0.8 ? ' Grave' : 
               voiceSettings.pitch > 1.2 ? ' Agudo' : ' Normal'}
            </IonNote>
          </IonLabel>
          <IonRange
            min={0.5}
            max={2.0}
            step={0.1}
            value={voiceSettings.pitch}
            onIonInput={(e) => handlePitchChange(e.detail.value as number)}
            aria-label="Tono de voz"
          />
        </IonItem>

        {/* Speech Volume */}
        <IonItem>
          <IonIcon icon={volumeHighOutline} slot="start" />
          <IonLabel>
            <h3>Volumen</h3>
            <IonNote>
              {Math.round(voiceSettings.volume * 100)}% - 
              {voiceSettings.volume < 0.4 ? ' Bajo' : 
               voiceSettings.volume > 0.8 ? ' Alto' : ' Medio'}
            </IonNote>
          </IonLabel>
          <IonRange
            min={0.1}
            max={1.0}
            step={0.1}
            value={voiceSettings.volume}
            onIonInput={(e) => handleVolumeChange(e.detail.value as number)}
            aria-label="Volumen de voz"
          />
        </IonItem>

        {/* Test Voice Button */}
        <IonItem>
          <IonLabel>
            <h3>Probar Configuración</h3>
            <IonNote>Escuche cómo suena la voz con la configuración actual</IonNote>
          </IonLabel>
          <IonButton
            fill={isTesting ? 'solid' : 'outline'}
            color={isTesting ? 'danger' : 'primary'}
            onClick={handleTestVoice}
            aria-label={isTesting ? 'Detener prueba de voz' : 'Probar configuración de voz'}
          >
            <IonIcon 
              icon={isTesting ? stopOutline : playOutline} 
              slot="start" 
            />
            {isTesting ? 'Detener' : 'Probar'}
          </IonButton>
        </IonItem>

        {/* Reset to Defaults */}
        <IonItem lines="none">
          <IonLabel>
            <IonNote>
              <strong>Consejo:</strong> Si la voz no suena bien, puede restablecer 
              la configuración predeterminada.
            </IonNote>
          </IonLabel>
          <IonButton
            fill="clear"
            size="small"
            onClick={() => saveVoiceSettings({ rate: 0.9, pitch: 1.0, volume: 0.8 })}
            aria-label="Restablecer configuración de voz a valores predeterminados"
          >
            Restablecer
          </IonButton>
        </IonItem>
      </IonList>
    </div>
  );
};