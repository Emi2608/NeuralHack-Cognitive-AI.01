import React from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonText,
  IonButton,
} from '@ionic/react';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import { ConsentForm } from '../../components/forms/ConsentForm';
import { useAuth } from '../../hooks/useAuth';
import { ROUTES } from '../../constants/routes';

export const ConsentPage: React.FC = () => {
  const { t } = useTranslation();
  const history = useHistory();
  const { signOut, user } = useAuth();

  const handleConsentGiven = () => {
    // Redirect to dashboard after consent is given
    history.push(ROUTES.DASHBOARD);
  };

  const handleConsentDeclined = async () => {
    // If user declines consent, sign them out and redirect to login
    await signOut();
    history.push(ROUTES.LOGIN);
  };

  // If user already has consent, redirect to dashboard
  React.useEffect(() => {
    if (user?.consentGiven) {
      history.push(ROUTES.DASHBOARD);
    }
  }, [user, history]);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{t('consent.title')}</IonTitle>
          <IonButton
            slot="end"
            fill="clear"
            onClick={() => signOut()}
          >
            {t('auth.signOut')}
          </IonButton>
        </IonToolbar>
      </IonHeader>
      
      <IonContent className="ion-padding">
        {/* Welcome Message */}
        <div className="ion-text-center ion-margin-bottom">
          <IonText>
            <h2>{t('consent.welcome')}</h2>
            <p>{t('consent.welcomeMessage')}</p>
          </IonText>
        </div>

        {/* Consent Form */}
        <ConsentForm
          onConsent={handleConsentGiven}
          onDecline={handleConsentDeclined}
        />

        {/* Additional Information */}
        <div className="ion-margin-top">
          <IonText color="medium">
            <h3>{t('consent.additionalInfo.title')}</h3>
            <ul>
              <li>{t('consent.additionalInfo.dataEncryption')}</li>
              <li>{t('consent.additionalInfo.gdprCompliance')}</li>
              <li>{t('consent.additionalInfo.medicalDevice')}</li>
              <li>{t('consent.additionalInfo.clinicalValidation')}</li>
            </ul>
          </IonText>
        </div>

        {/* Contact Information */}
        <div className="ion-margin-top">
          <IonText color="medium">
            <h3>{t('consent.contact.title')}</h3>
            <p>
              {t('consent.contact.email')}: support@neuralhack.com<br />
              {t('consent.contact.privacy')}: privacy@neuralhack.com
            </p>
          </IonText>
        </div>
      </IonContent>
    </IonPage>
  );
};