import React, { useState } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonText,
  IonButton,
  IonModal,
  IonInput,
  IonItem,
  IonLabel,
  IonSpinner,
} from '@ionic/react';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import { LoginForm } from '../../components/forms/LoginForm';
import { RegistrationForm } from '../../components/forms/RegistrationForm';
import { useAuth } from '../../hooks/useAuth';
import { ROUTES } from '../../constants/routes';
import './LoginPage.css';

export const LoginPage: React.FC = () => {
  const { t } = useTranslation();
  const history = useHistory();
  const { resetPassword, loading } = useAuth();

  const [showRegistration, setShowRegistration] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetMessage, setResetMessage] = useState('');

  const handleLoginSuccess = () => {
    // Redirect to dashboard after successful login
    history.push(ROUTES.DASHBOARD);
  };

  const handleRegistrationSuccess = () => {
    setShowRegistration(false);
    // After registration, user might need to verify email or give consent
    history.push(ROUTES.CONSENT);
  };

  const handleForgotPassword = async () => {
    if (!resetEmail) {
      setResetMessage('Por favor ingresa tu email para restablecer la contraseña');
      return;
    }

    const result = await resetPassword(resetEmail);
    
    if (result.success) {
      setResetMessage('Se ha enviado un email para restablecer tu contraseña');
      setResetEmail('');
      setTimeout(() => {
        setShowForgotPassword(false);
        setResetMessage('');
      }, 3000);
    } else {
      setResetMessage(result.error || 'Error al enviar el email de restablecimiento');
    }
  };

  return (
    <IonPage>
      <IonContent className="login-page">
        <div className="login-container">
          {/* Header Section */}
          <div className="login-header">
            <div className="app-logo">
              <div className="logo-icon">🧠</div>
            </div>
            <h1 className="app-title">NeuralHack Cognitive AI</h1>
            <p className="app-subtitle">Evaluación cognitiva temprana para enfermedades neurodegenerativas</p>
          </div>

          {/* Login Form Container */}
          <div className="login-form-container">
            <LoginForm
              onSuccess={handleLoginSuccess}
              onForgotPassword={() => setShowForgotPassword(true)}
              onSignUp={() => setShowRegistration(true)}
            />
          </div>

          {/* Footer */}
          <div className="login-footer">
            <p>© 2024 NeuralHack Cognitive AI</p>
            <p>Tecnología para el cuidado de la salud cognitiva</p>
          </div>
        </div>

        {/* Registration Modal */}
        <IonModal isOpen={showRegistration} onDidDismiss={() => setShowRegistration(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>{t('auth.createAccount')}</IonTitle>
              <IonButton
                slot="end"
                fill="clear"
                onClick={() => setShowRegistration(false)}
              >
                {t('common.close')}
              </IonButton>
            </IonToolbar>
          </IonHeader>
          
          <IonContent className="ion-padding">
            <RegistrationForm
              onSuccess={handleRegistrationSuccess}
              onCancel={() => setShowRegistration(false)}
            />
          </IonContent>
        </IonModal>

        {/* Forgot Password Modal */}
        <IonModal isOpen={showForgotPassword} onDidDismiss={() => setShowForgotPassword(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>{t('auth.resetPassword')}</IonTitle>
              <IonButton
                slot="end"
                fill="clear"
                onClick={() => setShowForgotPassword(false)}
              >
                {t('common.close')}
              </IonButton>
            </IonToolbar>
          </IonHeader>
          
          <IonContent className="ion-padding">
            <IonText>
              <p>{t('auth.resetPasswordInstructions')}</p>
            </IonText>

            <IonItem>
              <IonLabel position="stacked">{t('auth.email')}</IonLabel>
              <IonInput
                type="email"
                value={resetEmail}
                onIonInput={(e) => setResetEmail(e.detail.value!)}
                placeholder={t('auth.emailPlaceholder')}
              />
            </IonItem>

            {resetMessage && (
              <IonText color={resetMessage.includes(t('auth.resetEmailSent')) ? 'success' : 'danger'}>
                <p className="ion-margin-top">{resetMessage}</p>
              </IonText>
            )}

            <IonButton
              expand="block"
              onClick={handleForgotPassword}
              disabled={loading || !resetEmail}
              className="ion-margin-top"
            >
              {loading ? <IonSpinner name="crescent" /> : t('auth.sendResetEmail')}
            </IonButton>
          </IonContent>
        </IonModal>
      </IonContent>
    </IonPage>
  );
};