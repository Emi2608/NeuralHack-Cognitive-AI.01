import React, { useState } from 'react';
import {
  IonButton,
  IonInput,
  IonItem,
  IonLabel,
  IonText,
  IonSpinner,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonCheckbox,
} from '@ionic/react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import type { SignInData } from '../../services/auth.service';

interface LoginFormProps {
  onSuccess?: () => void;
  onForgotPassword?: () => void;
  onSignUp?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSuccess,
  onForgotPassword,
  onSignUp,
}) => {
  const { t } = useTranslation();
  const { signIn, loading, error } = useAuth();

  const [formData, setFormData] = useState<SignInData>({
    email: '',
    password: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const handleInputChange = (field: keyof SignInData, value: string) => {
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
      errors.push('El correo electrónico es requerido');
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.push('Ingresa un correo electrónico válido');
    }

    if (!formData.password) {
      errors.push('La contraseña es requerida');
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const result = await signIn(formData);

    if (result.success) {
      onSuccess?.();
    }
  };

  return (
    <IonCard>
      <IonCardHeader>
        <IonCardTitle>Iniciar Sesión</IonCardTitle>
      </IonCardHeader>
      
      <IonCardContent>
        <form onSubmit={handleSubmit}>
          {/* Email */}
          <IonItem>
            <IonLabel position="stacked">Correo Electrónico *</IonLabel>
            <IonInput
              type="email"
              value={formData.email}
              onIonInput={(e) => handleInputChange('email', e.detail.value!)}
              required
              clearInput
              placeholder="tu.email@ejemplo.com"
              autocomplete="email"
            />
          </IonItem>

          {/* Password */}
          <IonItem>
            <IonLabel position="stacked">Contraseña *</IonLabel>
            <IonInput
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onIonInput={(e) => handleInputChange('password', e.detail.value!)}
              required
              clearInput
              placeholder="Ingresa tu contraseña"
              autocomplete="current-password"
            />
          </IonItem>

          {/* Show Password Toggle */}
          <IonItem>
            <IonCheckbox
              checked={showPassword}
              onIonChange={(e) => setShowPassword(e.detail.checked)}
            />
            <IonLabel className="ion-margin-start">
              Mostrar contraseña
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

          {/* API Error */}
          {error && (
            <IonText color="danger">
              <p className="ion-margin-top">{error}</p>
            </IonText>
          )}

          {/* Sign In Button */}
          <IonButton
            expand="block"
            type="submit"
            disabled={loading}
            className="ion-margin-top"
          >
            {loading ? <IonSpinner name="crescent" /> : 'Iniciar Sesión'}
          </IonButton>

          {/* Forgot Password Link */}
          {onForgotPassword && (
            <IonButton
              fill="clear"
              expand="block"
              onClick={onForgotPassword}
              disabled={loading}
              className="ion-margin-top"
            >
              ¿Olvidaste tu contraseña?
            </IonButton>
          )}

          {/* Sign Up Link */}
          {onSignUp && (
            <div className="ion-text-center ion-margin-top">
              <IonText>
                <p>
                  ¿No tienes cuenta?{' '}
                  <IonButton
                    fill="clear"
                    size="small"
                    onClick={onSignUp}
                    disabled={loading}
                  >
                    Regístrate
                  </IonButton>
                </p>
              </IonText>
            </div>
          )}
        </form>
      </IonCardContent>
    </IonCard>
  );
};