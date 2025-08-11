import React, { useState, useEffect } from 'react';
import {
  IonButton,
  IonInput,
  IonItem,
  IonLabel,
  IonDatetime,
  IonSelect,
  IonSelectOption,
  IonText,
  IonSpinner,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonToggle,
  IonList,
} from '@ionic/react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import type { UserProfile, AccessibilitySettings } from '../../types/user';

interface ProfileSettingsFormProps {
  onSave?: () => void;
  onCancel?: () => void;
}

export const ProfileSettingsForm: React.FC<ProfileSettingsFormProps> = ({
  onSave,
  onCancel,
}) => {
  const { t } = useTranslation();
  const { user, updateProfile, loading, error } = useAuth();

  const [formData, setFormData] = useState<Partial<UserProfile>>({
    dateOfBirth: user?.dateOfBirth || new Date(),
    educationLevel: user?.educationLevel || 0,
    language: user?.language || 'es',
    accessibilitySettings: user?.accessibilitySettings || {
      highContrast: false,
      fontSize: 'normal',
      voiceGuidance: false,
      keyboardNavigation: false,
      touchTargetSize: 'normal',
    },
  });

  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        dateOfBirth: user.dateOfBirth,
        educationLevel: user.educationLevel,
        language: user.language,
        accessibilitySettings: user.accessibilitySettings,
      });
    }
  }, [user]);

  const handleInputChange = (field: keyof UserProfile, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    setHasChanges(true);
  };

  const handleAccessibilityChange = (
    setting: keyof AccessibilitySettings,
    value: any
  ) => {
    setFormData(prev => ({
      ...prev,
      accessibilitySettings: {
        ...prev.accessibilitySettings!,
        [setting]: value,
      },
    }));
    setHasChanges(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!hasChanges) {
      onSave?.();
      return;
    }

    const result = await updateProfile(formData);

    if (result.success) {
      setHasChanges(false);
      onSave?.();
    }
  };

  const educationOptions = Array.from({ length: 31 }, (_, i) => ({
    value: i,
    label: i === 0 ? t('auth.noFormalEducation') : `${i} ${t('auth.years')}`,
  }));

  const fontSizeOptions = [
    { value: 'normal', label: t('accessibility.fontSize.normal') },
    { value: 'large', label: t('accessibility.fontSize.large') },
    { value: 'extra-large', label: t('accessibility.fontSize.extraLarge') },
  ];

  const touchTargetOptions = [
    { value: 'normal', label: t('accessibility.touchTarget.normal') },
    { value: 'large', label: t('accessibility.touchTarget.large') },
  ];

  return (
    <form onSubmit={handleSubmit}>
      {/* Personal Information */}
      <IonCard>
        <IonCardHeader>
          <IonCardTitle>{t('profile.personalInfo')}</IonCardTitle>
        </IonCardHeader>
        
        <IonCardContent>
          {/* Email (Read-only) */}
          <IonItem>
            <IonLabel position="stacked">{t('auth.email')}</IonLabel>
            <IonInput
              value={user?.email}
              readonly
              disabled
            />
          </IonItem>

          {/* Date of Birth */}
          <IonItem>
            <IonLabel position="stacked">{t('auth.dateOfBirth')}</IonLabel>
            <IonDatetime
              value={formData.dateOfBirth?.toISOString()}
              onIonChange={(e) =>
                handleInputChange('dateOfBirth', new Date(e.detail.value as string))
              }
              presentation="date"
              max={new Date().toISOString()}
              min="1900-01-01"
            />
          </IonItem>

          {/* Education Level */}
          <IonItem>
            <IonLabel position="stacked">{t('auth.educationLevel')}</IonLabel>
            <IonSelect
              value={formData.educationLevel}
              onIonChange={(e) =>
                handleInputChange('educationLevel', e.detail.value)
              }
            >
              {educationOptions.map((option) => (
                <IonSelectOption key={option.value} value={option.value}>
                  {option.label}
                </IonSelectOption>
              ))}
            </IonSelect>
          </IonItem>
        </IonCardContent>
      </IonCard>

      {/* Accessibility Settings */}
      <IonCard>
        <IonCardHeader>
          <IonCardTitle>{t('accessibility.title')}</IonCardTitle>
        </IonCardHeader>
        
        <IonCardContent>
          <IonList>
            {/* High Contrast */}
            <IonItem>
              <IonLabel>
                <h3>{t('accessibility.highContrast.title')}</h3>
                <p>{t('accessibility.highContrast.description')}</p>
              </IonLabel>
              <IonToggle
                checked={formData.accessibilitySettings?.highContrast}
                onIonChange={(e) =>
                  handleAccessibilityChange('highContrast', e.detail.checked)
                }
              />
            </IonItem>

            {/* Font Size */}
            <IonItem>
              <IonLabel position="stacked">
                <h3>{t('accessibility.fontSize.title')}</h3>
                <p>{t('accessibility.fontSize.description')}</p>
              </IonLabel>
              <IonSelect
                value={formData.accessibilitySettings?.fontSize}
                onIonChange={(e) =>
                  handleAccessibilityChange('fontSize', e.detail.value)
                }
              >
                {fontSizeOptions.map((option) => (
                  <IonSelectOption key={option.value} value={option.value}>
                    {option.label}
                  </IonSelectOption>
                ))}
              </IonSelect>
            </IonItem>

            {/* Voice Guidance */}
            <IonItem>
              <IonLabel>
                <h3>{t('accessibility.voiceGuidance.title')}</h3>
                <p>{t('accessibility.voiceGuidance.description')}</p>
              </IonLabel>
              <IonToggle
                checked={formData.accessibilitySettings?.voiceGuidance}
                onIonChange={(e) =>
                  handleAccessibilityChange('voiceGuidance', e.detail.checked)
                }
              />
            </IonItem>

            {/* Keyboard Navigation */}
            <IonItem>
              <IonLabel>
                <h3>{t('accessibility.keyboardNavigation.title')}</h3>
                <p>{t('accessibility.keyboardNavigation.description')}</p>
              </IonLabel>
              <IonToggle
                checked={formData.accessibilitySettings?.keyboardNavigation}
                onIonChange={(e) =>
                  handleAccessibilityChange('keyboardNavigation', e.detail.checked)
                }
              />
            </IonItem>

            {/* Touch Target Size */}
            <IonItem>
              <IonLabel position="stacked">
                <h3>{t('accessibility.touchTarget.title')}</h3>
                <p>{t('accessibility.touchTarget.description')}</p>
              </IonLabel>
              <IonSelect
                value={formData.accessibilitySettings?.touchTargetSize}
                onIonChange={(e) =>
                  handleAccessibilityChange('touchTargetSize', e.detail.value)
                }
              >
                {touchTargetOptions.map((option) => (
                  <IonSelectOption key={option.value} value={option.value}>
                    {option.label}
                  </IonSelectOption>
                ))}
              </IonSelect>
            </IonItem>
          </IonList>
        </IonCardContent>
      </IonCard>

      {/* Account Information */}
      <IonCard>
        <IonCardHeader>
          <IonCardTitle>{t('profile.accountInfo')}</IonCardTitle>
        </IonCardHeader>
        
        <IonCardContent>
          <IonText color="medium">
            <p>
              {t('profile.memberSince')}: {user?.createdAt?.toLocaleDateString('es-MX')}
            </p>
            <p>
              {t('profile.lastUpdated')}: {user?.updatedAt?.toLocaleDateString('es-MX')}
            </p>
            <p>
              {t('profile.consentGiven')}: {user?.consentGiven ? t('common.yes') : t('common.no')}
            </p>
          </IonText>
        </IonCardContent>
      </IonCard>

      {/* Error Display */}
      {error && (
        <IonText color="danger">
          <p className="ion-margin">{error}</p>
        </IonText>
      )}

      {/* Action Buttons */}
      <div className="ion-margin">
        <IonButton
          expand="block"
          type="submit"
          disabled={loading || !hasChanges}
          className="ion-margin-bottom"
        >
          {loading ? <IonSpinner name="crescent" /> : t('common.save')}
        </IonButton>

        {onCancel && (
          <IonButton
            expand="block"
            fill="outline"
            onClick={onCancel}
            disabled={loading}
          >
            {t('common.cancel')}
          </IonButton>
        )}
      </div>
    </form>
  );
};