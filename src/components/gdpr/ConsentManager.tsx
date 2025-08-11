/**
 * ConsentManager - Manages user consents for GDPR compliance
 */

import React, { useState, useEffect } from 'react';
import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonItem,
  IonLabel,
  IonToggle,
  IonButton,
  IonList,
  IonText,
  IonSpinner,
  IonAlert,
  IonIcon
} from '@ionic/react';
import { informationCircle, checkmarkCircle, closeCircle } from 'ionicons/icons';
import { useTranslation } from 'react-i18next';
import { GDPRService, ConsentRecord } from '../../services/gdpr.service';
import { useAuth } from '../../hooks/useAuth';
import './ConsentManager.css';

interface ConsentManagerProps {
  onConsentChange?: (consentType: string, granted: boolean) => void;
}

interface ConsentOption {
  type: ConsentRecord['consentType'];
  titleKey: string;
  descriptionKey: string;
  required: boolean;
  granted: boolean;
}

export const ConsentManager: React.FC<ConsentManagerProps> = ({
  onConsentChange
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [consents, setConsents] = useState<ConsentOption[]>([
    {
      type: 'data_processing',
      titleKey: 'gdpr.consent.dataProcessing.title',
      descriptionKey: 'gdpr.consent.dataProcessing.description',
      required: true,
      granted: false
    },
    {
      type: 'analytics',
      titleKey: 'gdpr.consent.analytics.title',
      descriptionKey: 'gdpr.consent.analytics.description',
      required: false,
      granted: false
    },
    {
      type: 'research',
      titleKey: 'gdpr.consent.research.title',
      descriptionKey: 'gdpr.consent.research.description',
      required: false,
      granted: false
    }
  ]);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  useEffect(() => {
    if (user) {
      loadUserConsents();
    }
  }, [user]);

  const loadUserConsents = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const userConsents = await GDPRService.getUserConsents(user.id);
      
      // Update consent states based on user's current consents
      setConsents(prevConsents => 
        prevConsents.map(consent => {
          const userConsent = userConsents
            .filter(uc => uc.consentType === consent.type)
            .sort((a, b) => (b.grantedAt || b.withdrawnAt || new Date()).getTime() - 
                           (a.grantedAt || a.withdrawnAt || new Date()).getTime())[0];
          
          return {
            ...consent,
            granted: userConsent ? userConsent.granted : false
          };
        })
      );
    } catch (error) {
      console.error('Failed to load user consents:', error);
      setAlertMessage(t('gdpr.errors.loadFailed'));
      setShowAlert(true);
    } finally {
      setLoading(false);
    }
  };

  const handleConsentChange = async (
    consentType: ConsentRecord['consentType'],
    granted: boolean
  ) => {
    if (!user) return;

    try {
      setSaving(true);
      
      await GDPRService.recordConsent(user.id, consentType, granted);
      
      // Update local state
      setConsents(prevConsents =>
        prevConsents.map(consent =>
          consent.type === consentType
            ? { ...consent, granted }
            : consent
        )
      );

      // Notify parent component
      onConsentChange?.(consentType, granted);

      setAlertMessage(
        granted 
          ? t('gdpr.consent.granted') 
          : t('gdpr.consent.withdrawn')
      );
      setShowAlert(true);
    } catch (error) {
      console.error('Failed to update consent:', error);
      setAlertMessage(t('gdpr.errors.updateFailed'));
      setShowAlert(true);
      
      // Revert the change
      await loadUserConsents();
    } finally {
      setSaving(false);
    }
  };

  const getConsentIcon = (granted: boolean, required: boolean) => {
    if (granted) {
      return <IonIcon icon={checkmarkCircle} color="success" />;
    } else if (required) {
      return <IonIcon icon={closeCircle} color="danger" />;
    } else {
      return <IonIcon icon={informationCircle} color="medium" />;
    }
  };

  const canUseApp = () => {
    return consents.find(c => c.type === 'data_processing')?.granted || false;
  };

  if (loading) {
    return (
      <IonCard>
        <IonCardContent className="ion-text-center">
          <IonSpinner />
          <IonText>
            <p>{t('gdpr.loading')}</p>
          </IonText>
        </IonCardContent>
      </IonCard>
    );
  }

  return (
    <div className="consent-manager">
      <IonCard>
        <IonCardHeader>
          <IonCardTitle>{t('gdpr.consent.title')}</IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          <IonText>
            <p>{t('gdpr.consent.description')}</p>
          </IonText>
          
          <IonList>
            {consents.map((consent) => (
              <IonItem key={consent.type}>
                <div className="consent-item">
                  <div className="consent-header">
                    {getConsentIcon(consent.granted, consent.required)}
                    <IonLabel>
                      <h3>{t(consent.titleKey)}</h3>
                      {consent.required && (
                        <IonText color="danger">
                          <small>{t('gdpr.consent.required')}</small>
                        </IonText>
                      )}
                    </IonLabel>
                    <IonToggle
                      checked={consent.granted}
                      disabled={saving}
                      onIonChange={(e) => 
                        handleConsentChange(consent.type, e.detail.checked)
                      }
                    />
                  </div>
                  <div className="consent-description">
                    <IonText color="medium">
                      <p>{t(consent.descriptionKey)}</p>
                    </IonText>
                  </div>
                </div>
              </IonItem>
            ))}
          </IonList>

          {!canUseApp() && (
            <IonCard color="warning">
              <IonCardContent>
                <IonText>
                  <p>{t('gdpr.consent.dataProcessingRequired')}</p>
                </IonText>
              </IonCardContent>
            </IonCard>
          )}

          <div className="consent-actions">
            <IonButton
              fill="outline"
              size="small"
              onClick={() => window.open('/privacy-policy', '_blank')}
            >
              {t('gdpr.privacyPolicy')}
            </IonButton>
            <IonButton
              fill="outline"
              size="small"
              onClick={() => window.open('/terms-of-service', '_blank')}
            >
              {t('gdpr.termsOfService')}
            </IonButton>
          </div>
        </IonCardContent>
      </IonCard>

      <IonAlert
        isOpen={showAlert}
        onDidDismiss={() => setShowAlert(false)}
        header={t('gdpr.consent.updated')}
        message={alertMessage}
        buttons={[t('common.ok')]}
      />
    </div>
  );
};