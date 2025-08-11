import React, { useState } from 'react';
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonCheckbox,
  IonItem,
  IonLabel,
  IonText,
  IonList,
  IonSpinner,
} from '@ionic/react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';

interface ConsentFormProps {
  onConsent?: () => void;
  onDecline?: () => void;
}

interface ConsentItem {
  id: string;
  required: boolean;
  checked: boolean;
}

export const ConsentForm: React.FC<ConsentFormProps> = ({
  onConsent,
  onDecline,
}) => {
  const { t } = useTranslation();
  const { updateProfile, loading } = useAuth();

  const [consentItems, setConsentItems] = useState<ConsentItem[]>([
    {
      id: 'dataCollection',
      required: true,
      checked: false,
    },
    {
      id: 'dataProcessing',
      required: true,
      checked: false,
    },
    {
      id: 'dataStorage',
      required: true,
      checked: false,
    },
    {
      id: 'medicalPurpose',
      required: true,
      checked: false,
    },
    {
      id: 'researchParticipation',
      required: false,
      checked: false,
    },
    {
      id: 'marketingCommunications',
      required: false,
      checked: false,
    },
  ]);

  const handleConsentChange = (id: string, checked: boolean) => {
    setConsentItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, checked } : item
      )
    );
  };

  const allRequiredConsentsGiven = consentItems
    .filter(item => item.required)
    .every(item => item.checked);

  const handleAccept = async () => {
    if (!allRequiredConsentsGiven) {
      return;
    }

    // Update user profile with consent
    const result = await updateProfile({
      consentGiven: true,
      consentDate: new Date(),
    });

    if (result.success) {
      onConsent?.();
    }
  };

  const handleDecline = () => {
    onDecline?.();
  };

  return (
    <IonCard>
      <IonCardHeader>
        <IonCardTitle>{t('consent.title')}</IonCardTitle>
      </IonCardHeader>
      
      <IonCardContent>
        <IonText>
          <p>{t('consent.introduction')}</p>
        </IonText>

        <IonList>
          {/* Data Collection Consent */}
          <IonItem>
            <IonCheckbox
              checked={consentItems.find(item => item.id === 'dataCollection')?.checked}
              onIonChange={(e) => handleConsentChange('dataCollection', e.detail.checked)}
            />
            <IonLabel className="ion-margin-start ion-text-wrap">
              <h3>{t('consent.dataCollection.title')} *</h3>
              <p>{t('consent.dataCollection.description')}</p>
            </IonLabel>
          </IonItem>

          {/* Data Processing Consent */}
          <IonItem>
            <IonCheckbox
              checked={consentItems.find(item => item.id === 'dataProcessing')?.checked}
              onIonChange={(e) => handleConsentChange('dataProcessing', e.detail.checked)}
            />
            <IonLabel className="ion-margin-start ion-text-wrap">
              <h3>{t('consent.dataProcessing.title')} *</h3>
              <p>{t('consent.dataProcessing.description')}</p>
            </IonLabel>
          </IonItem>

          {/* Data Storage Consent */}
          <IonItem>
            <IonCheckbox
              checked={consentItems.find(item => item.id === 'dataStorage')?.checked}
              onIonChange={(e) => handleConsentChange('dataStorage', e.detail.checked)}
            />
            <IonLabel className="ion-margin-start ion-text-wrap">
              <h3>{t('consent.dataStorage.title')} *</h3>
              <p>{t('consent.dataStorage.description')}</p>
            </IonLabel>
          </IonItem>

          {/* Medical Purpose Consent */}
          <IonItem>
            <IonCheckbox
              checked={consentItems.find(item => item.id === 'medicalPurpose')?.checked}
              onIonChange={(e) => handleConsentChange('medicalPurpose', e.detail.checked)}
            />
            <IonLabel className="ion-margin-start ion-text-wrap">
              <h3>{t('consent.medicalPurpose.title')} *</h3>
              <p>{t('consent.medicalPurpose.description')}</p>
            </IonLabel>
          </IonItem>

          {/* Research Participation (Optional) */}
          <IonItem>
            <IonCheckbox
              checked={consentItems.find(item => item.id === 'researchParticipation')?.checked}
              onIonChange={(e) => handleConsentChange('researchParticipation', e.detail.checked)}
            />
            <IonLabel className="ion-margin-start ion-text-wrap">
              <h3>{t('consent.researchParticipation.title')}</h3>
              <p>{t('consent.researchParticipation.description')}</p>
              <IonText color="medium">
                <small>{t('consent.optional')}</small>
              </IonText>
            </IonLabel>
          </IonItem>

          {/* Marketing Communications (Optional) */}
          <IonItem>
            <IonCheckbox
              checked={consentItems.find(item => item.id === 'marketingCommunications')?.checked}
              onIonChange={(e) => handleConsentChange('marketingCommunications', e.detail.checked)}
            />
            <IonLabel className="ion-margin-start ion-text-wrap">
              <h3>{t('consent.marketingCommunications.title')}</h3>
              <p>{t('consent.marketingCommunications.description')}</p>
              <IonText color="medium">
                <small>{t('consent.optional')}</small>
              </IonText>
            </IonLabel>
          </IonItem>
        </IonList>

        <IonText color="medium">
          <p className="ion-margin-top">
            <small>
              * {t('consent.requiredFields')}
            </small>
          </p>
        </IonText>

        <IonText>
          <p className="ion-margin-top">
            {t('consent.rightsNotice')}
          </p>
        </IonText>

        {/* Action Buttons */}
        <div className="ion-margin-top">
          <IonButton
            expand="block"
            onClick={handleAccept}
            disabled={!allRequiredConsentsGiven || loading}
            className="ion-margin-bottom"
          >
            {loading ? <IonSpinner name="crescent" /> : t('consent.accept')}
          </IonButton>

          <IonButton
            expand="block"
            fill="outline"
            color="medium"
            onClick={handleDecline}
            disabled={loading}
          >
            {t('consent.decline')}
          </IonButton>
        </div>

        <IonText color="medium">
          <p className="ion-text-center ion-margin-top">
            <small>
              {t('consent.lastUpdated')}: {new Date().toLocaleDateString('es-MX')}
            </small>
          </p>
        </IonText>
      </IonCardContent>
    </IonCard>
  );
};