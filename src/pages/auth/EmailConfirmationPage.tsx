import React, { useEffect, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import {
  IonContent,
  IonPage,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonSpinner,
  IonButton,
  IonIcon,
  IonText
} from '@ionic/react';
import { checkmarkCircle, alertCircle, home } from 'ionicons/icons';
import { supabase } from '../../services/supabase';
import { AuthService } from '../../services/auth.service';

const EmailConfirmationPage: React.FC = () => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const history = useHistory();
  const location = useLocation();

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      try {
        // Check both hash and search params for tokens
        const hashParams = new URLSearchParams(location.hash.substring(1));
        const searchParams = new URLSearchParams(location.search);
        
        // Try to get tokens from hash first, then search params
        let accessToken = hashParams.get('access_token') || searchParams.get('access_token');
        let refreshToken = hashParams.get('refresh_token') || searchParams.get('refresh_token');
        let type = hashParams.get('type') || searchParams.get('type');
        
        // Also check for token_hash and type from email confirmation
        const tokenHash = searchParams.get('token_hash') || hashParams.get('token_hash');
        const confirmationType = searchParams.get('type') || hashParams.get('type');

        console.log('URL params:', { accessToken, refreshToken, type, tokenHash, confirmationType });
        console.log('Full URL:', window.location.href);

        // Handle different confirmation flows
        if (tokenHash && (confirmationType === 'signup' || confirmationType === 'email')) {
          // This is the email confirmation flow using token_hash
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: 'email'
          });

          if (error) {
            console.error('Error verifying OTP:', error);
            setStatus('error');
            setMessage('Error al confirmar el email. El enlace puede haber expirado o ser inválido.');
          } else if (data.user) {
            // Email confirmed successfully, now complete the profile
            try {
              const profileResult = await AuthService.completeProfileAfterConfirmation(
                data.user.id,
                data.user.email || '',
                undefined, // dateOfBirth - will be set later
                undefined, // educationLevel - will be set later
                'es' // default language
              );

              if (profileResult.success) {
                setStatus('success');
                setMessage('¡Email confirmado exitosamente! Tu perfil ha sido creado. Ya puedes acceder a tu cuenta.');
              } else {
                setStatus('success');
                setMessage('¡Email confirmado exitosamente! Completa tu perfil al iniciar sesión.');
              }
            } catch (profileError) {
              console.warn('Error completing profile, but email was confirmed:', profileError);
              setStatus('success');
              setMessage('¡Email confirmado exitosamente! Completa tu perfil al iniciar sesión.');
            }
            
            // If we have a session, redirect to dashboard, otherwise to login
            if (data.session) {
              setTimeout(() => {
                history.push('/dashboard');
              }, 3000);
            } else {
              setTimeout(() => {
                history.push('/auth/login');
              }, 3000);
            }
          } else {
            setStatus('error');
            setMessage('Error al confirmar el email. No se pudo verificar la cuenta.');
          }
        } else if (accessToken && refreshToken) {
          // This is the session restoration flow
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });

          if (error) {
            console.error('Error setting session:', error);
            setStatus('error');
            setMessage('Error al confirmar el email. Por favor, intenta de nuevo.');
          } else if (data.user) {
            setStatus('success');
            setMessage('¡Email confirmado exitosamente! Ya puedes acceder a tu cuenta.');
            
            // Redirect to dashboard after 3 seconds
            setTimeout(() => {
              history.push('/dashboard');
            }, 3000);
          }
        } else {
          console.error('No valid tokens found in URL');
          setStatus('error');
          setMessage('Enlace de confirmación inválido o expirado. Por favor, solicita un nuevo enlace.');
        }
      } catch (error) {
        console.error('Error during email confirmation:', error);
        setStatus('error');
        setMessage('Error inesperado al confirmar el email.');
      }
    };

    handleEmailConfirmation();
  }, [location, history]);

  const handleGoHome = () => {
    history.push('/');
  };

  const handleGoToLogin = () => {
    history.push('/auth/login');
  };

  return (
    <IonPage>
      <IonContent className="ion-padding">
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh'
        }}>
          <IonCard style={{ maxWidth: '400px', width: '100%' }}>
            <IonCardHeader>
              <IonCardTitle style={{
                textAlign: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px'
              }}>
                {status === 'loading' && <IonSpinner />}
                {status === 'success' && <IonIcon icon={checkmarkCircle} color="success" />}
                {status === 'error' && <IonIcon icon={alertCircle} color="danger" />}
                
                {status === 'loading' && 'Confirmando Email...'}
                {status === 'success' && '¡Email Confirmado!'}
                {status === 'error' && 'Error de Confirmación'}
              </IonCardTitle>
            </IonCardHeader>
            
            <IonCardContent>
              <IonText>
                <p style={{ textAlign: 'center', marginBottom: '20px' }}>
                  {message}
                </p>
              </IonText>

              {status === 'success' && (
                <div style={{ textAlign: 'center' }}>
                  <IonText color="medium">
                    <p>Serás redirigido al dashboard en unos segundos...</p>
                  </IonText>
                </div>
              )}

              {status === 'error' && (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}>
                  <IonButton
                    expand="block"
                    onClick={handleGoToLogin}
                    color="primary"
                  >
                    Ir al Login
                  </IonButton>
                  
                  <IonButton
                    expand="block"
                    fill="outline"
                    onClick={handleGoHome}
                    color="medium"
                  >
                    <IonIcon icon={home} slot="start" />
                    Ir al Inicio
                  </IonButton>
                </div>
              )}
            </IonCardContent>
          </IonCard>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default EmailConfirmationPage;