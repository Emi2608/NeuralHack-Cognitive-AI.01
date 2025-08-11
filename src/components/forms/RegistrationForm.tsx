import React, { useState } from 'react';
import {
  IonButton,
  IonInput,
  IonItem,
  IonLabel,
  IonDatetime,
  IonSelect,
  IonSelectOption,
  IonCheckbox,
  IonText,
  IonSpinner,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
} from '@ionic/react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import type { SignUpData } from '../../services/auth.service';

interface RegistrationFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const RegistrationForm: React.FC<RegistrationFormProps> = ({
  onSuccess,
  onCancel,
}) => {
  const { t } = useTranslation();
  const { signUp, loading, error } = useAuth();

  const [formData, setFormData] = useState<SignUpData>({
    email: '',
    password: '',
    dateOfBirth: new Date(),
    educationLevel: 0,
    language: 'es',
    consentGiven: false,
  });

  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [showPassword, setShowPassword] = useState(false);

  const handleInputChange = (field: keyof SignUpData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    // Clear validation errors when user starts typing
    if (validationErrors.length > 0) {
      setValidationErrors([]);
    }
  };

  const validateForm = (): boolean => {
    const errors: string[] = [];

    if (!formData.email) {
      errors.push(t('auth.emailRequired'));
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.push(t('auth.emailInvalid'));
    }

    if (!formData.password) {
      errors.push(t('auth.passwordRequired'));
    } else if (formData.password.length < 8) {
      errors.push(t('auth.passwordTooShort'));
    }

    if (formData.password !== confirmPassword) {
      errors.push(t('auth.passwordsDoNotMatch'));
    }

    if (!formData.dateOfBirth) {
      errors.push(t('auth.dateOfBirthRequired'));
    } else {
      const age = calculateAge(formData.dateOfBirth);
      if (age < 18) {
        errors.push(t('auth.mustBeAdult'));
      }
      if (age > 120) {
        errors.push(t('auth.invalidAge'));
      }
    }

    if (formData.educationLevel < 0 || formData.educationLevel > 30) {
      errors.push(t('auth.invalidEducationLevel'));
    }

    if (!formData.consentGiven) {
      errors.push(t('auth.consentRequired'));
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const calculateAge = (dateOfBirth: Date): number => {
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
  };

  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const result = await signUp(formData);

    if (result.success) {
      if ((result as any).requiresEmailConfirmation) {
        setSuccessMessage((result as any).message || 'Se ha enviado un email de confirmación. Por favor, revisa tu bandeja de entrada.');
        // Don't call onSuccess immediately - wait for user to see the message
        setTimeout(() => {
          onSuccess?.();
        }, 5000);
      } else {
        onSuccess?.();
      }
    }
  };

  const educationOptions = Array.from({ length: 31 }, (_, i) => ({
    value: i,
    label: i === 0 ? t('auth.noFormalEducation') : `${i} ${t('auth.years')}`,
  }));

  return (
    <IonCard>
      <IonCardHeader>
        <IonCardTitle>{t('auth.createAccount')}</IonCardTitle>
      </IonCardHeader>
      
      <IonCardContent>
        <form onSubmit={handleSubmit}>
          {/* Email */}
          <IonItem>
            <IonLabel position="stacked">{t('auth.email')} *</IonLabel>
            <IonInput
              type="email"
              value={formData.email}
              onIonInput={(e) => handleInputChange('email', e.detail.value!)}
              required
              clearInput
              placeholder={t('auth.emailPlaceholder')}
            />
          </IonItem>

          {/* Password */}
          <IonItem>
            <IonLabel position="stacked">{t('auth.password')} *</IonLabel>
            <IonInput
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onIonInput={(e) => handleInputChange('password', e.detail.value!)}
              required
              clearInput
              placeholder={t('auth.passwordPlaceholder')}
            />
          </IonItem>

          {/* Confirm Password */}
          <IonItem>
            <IonLabel position="stacked">{t('auth.confirmPassword')} *</IonLabel>
            <IonInput
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onIonInput={(e) => setConfirmPassword(e.detail.value!)}
              required
              clearInput
              placeholder={t('auth.confirmPasswordPlaceholder')}
            />
          </IonItem>

          {/* Show Password Toggle */}
          <IonItem>
            <IonCheckbox
              checked={showPassword}
              onIonChange={(e) => setShowPassword(e.detail.checked)}
            />
            <IonLabel className="ion-margin-start">
              {t('auth.showPassword')}
            </IonLabel>
          </IonItem>

          {/* Date of Birth */}
          <IonItem>
            <IonLabel position="stacked">{t('auth.dateOfBirth')} *</IonLabel>
            <IonDatetime
              value={formData.dateOfBirth.toISOString()}
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
            <IonLabel position="stacked">{t('auth.educationLevel')} *</IonLabel>
            <IonSelect
              value={formData.educationLevel}
              onIonChange={(e) =>
                handleInputChange('educationLevel', e.detail.value)
              }
              placeholder={t('auth.selectEducationLevel')}
            >
              {educationOptions.map((option) => (
                <IonSelectOption key={option.value} value={option.value}>
                  {option.label}
                </IonSelectOption>
              ))}
            </IonSelect>
          </IonItem>

          {/* Consent */}
          <IonItem>
            <IonCheckbox
              checked={formData.consentGiven}
              onIonChange={(e) => handleInputChange('consentGiven', e.detail.checked)}
            />
            <IonLabel className="ion-margin-start ion-text-wrap">
              {t('auth.consentText')} *
            </IonLabel>
          </IonItem>

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <div className="ion-margin-top">
              {validationErrors.map((error, index) => (
                <IonText key={index} color="danger">
                  <p className="ion-margin-bottom">{error}</p>
                </IonText>
              ))}
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <IonText color="success">
              <p className="ion-margin-top">{successMessage}</p>
            </IonText>
          )}

          {/* API Error */}
          {error && !successMessage && (
            <IonText color="danger">
              <p className="ion-margin-top">{error}</p>
            </IonText>
          )}

          {/* Buttons */}
          <div className="ion-margin-top">
            <IonButton
              expand="block"
              type="submit"
              disabled={loading}
              className="ion-margin-bottom"
            >
              {loading ? <IonSpinner name="crescent" /> : t('auth.createAccount')}
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
      </IonCardContent>
    </IonCard>
  );
};