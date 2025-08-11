/**
 * DataDeletionPanel - Allows users to request data deletion (GDPR Right to be Forgotten)
 */

import React, { useState } from 'react';
import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonButton,
  IonItem,
  IonLabel,
  IonCheckbox,
  IonTextarea,
  IonText,
  IonAlert,
  IonIcon,
  IonList,
  IonSpinner
} from '@ionic/react';
import { trashOutline, warningOutline, shieldCheckmarkOutline } from 'ionicons/icons';
import { useTranslation } from 'react-i18next';
import { GDPRService } from '../../services/gdpr.service';
import { useAuth } from '../../hooks/useAuth';
import './DataDeletionPanel.css';

export const DataDeletionPanel: React.FC = () => {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const [selectedDataTypes, setSelectedDataTypes] = useState<string[]>([]);
  const [reason, setReason] = useState('');
  const [showConfirmAlert, setShowConfirmAlert] = useState(false);
  const [showResultAlert, setShowResultAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');

  const dataTypes = [
    {
      id: 'profile',
      titleKey: 'gdpr.deletion.dataTypes.profile',
      descriptionKey: 'gdpr.deletion.dataTypes.profileDesc',
      critical: true
    },
    {
      id: 'assessments',
      titleKey: 'gdpr.deletion.dataTypes.assessments',
      descriptionKey: 'gdpr.deletion.dataTypes.assessmentsDesc',
      critical: false
    },
    {
      id: 'audit_logs',
      titleKey: 'gdpr.deletion.dataTypes.auditLogs',
      descriptionKey: 'gdpr.deletion.dataTypes.auditLogsDesc',
      critical: false
    }
  ];

  const handleDataTypeChange = (dataTypeId: string, checked: boolean) => {
    if (checked) {
      setSelectedDataTypes(prev => [...prev, dataTypeId]);
    } else {
      setSelectedDataTypes(prev => prev.filter(id => id !== dataTypeId));
    }
  };

  const handleDeleteAll = () => {
    setSelectedDataTypes(['all']);
    setShowConfirmAlert(true);
  };

  const handleDeleteSelected = () => {
    if (selectedDataTypes.length === 0) {
      setAlertMessage(t('gdpr.deletion.selectDataTypes'));
      setShowResultAlert(true);
      return;
    }
    setShowConfirmAlert(true);
  };

  const confirmDeletion = async () => {
    if (!user) return;

    // Verify confirmation text
    const expectedText = t('gdpr.deletion.confirmationText');
    if (confirmationText.toLowerCase() !== expectedText.toLowerCase()) {
      setAlertMessage(t('gdpr.deletion.confirmationMismatch'));
      setShowResultAlert(true);
      return;
    }

    try {
      setDeleting(true);
      setShowConfirmAlert(false);

      const deletionRequest = await GDPRService.deleteUserData(
        user.id,
        reason || undefined,
        selectedDataTypes
      );

      if (deletionRequest.status === 'completed') {
        setAlertMessage(t('gdpr.deletion.success'));
        
        // If profile was deleted, sign out the user
        if (selectedDataTypes.includes('all') || selectedDataTypes.includes('profile')) {
          setTimeout(() => {
            signOut();
          }, 3000);
        }
      } else {
        setAlertMessage(t('gdpr.deletion.pending'));
      }
      
      setShowResultAlert(true);
    } catch (error) {
      console.error('Failed to delete data:', error);
      setAlertMessage(t('gdpr.deletion.error'));
      setShowResultAlert(true);
    } finally {
      setDeleting(false);
      setConfirmationText('');
    }
  };

  const isProfileDeletion = () => {
    return selectedDataTypes.includes('all') || selectedDataTypes.includes('profile');
  };

  return (
    <div className="data-deletion-panel">
      <IonCard className="warning-card">
        <IonCardHeader>
          <IonCardTitle>
            <IonIcon icon={warningOutline} color="warning" />
            {t('gdpr.deletion.title')}
          </IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          <IonText color="warning">
            <p><strong>{t('gdpr.deletion.warning')}</strong></p>
            <p>{t('gdpr.deletion.warningText')}</p>
          </IonText>
        </IonCardContent>
      </IonCard>

      <IonCard>
        <IonCardHeader>
          <IonCardTitle>{t('gdpr.deletion.selectData')}</IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          <IonList>
            {dataTypes.map((dataType) => (
              <IonItem key={dataType.id}>
                <IonCheckbox
                  checked={selectedDataTypes.includes(dataType.id)}
                  onIonChange={(e) => handleDataTypeChange(dataType.id, e.detail.checked)}
                  disabled={deleting}
                />
                <IonLabel className="ion-margin-start">
                  <h3>
                    {t(dataType.titleKey)}
                    {dataType.critical && (
                      <IonIcon icon={warningOutline} color="warning" className="critical-icon" />
                    )}
                  </h3>
                  <IonText color="medium">
                    <p>{t(dataType.descriptionKey)}</p>
                  </IonText>
                </IonLabel>
              </IonItem>
            ))}
          </IonList>

          <IonItem>
            <IonLabel position="stacked">{t('gdpr.deletion.reason')}</IonLabel>
            <IonTextarea
              value={reason}
              onIonInput={(e) => setReason(e.detail.value!)}
              placeholder={t('gdpr.deletion.reasonPlaceholder')}
              rows={3}
              disabled={deleting}
            />
          </IonItem>
        </IonCardContent>
      </IonCard>

      <IonCard className="info-card">
        <IonCardContent>
          <IonText color="medium">
            <h4>{t('gdpr.deletion.whatHappens')}</h4>
            <ul>
              <li>{t('gdpr.deletion.consequences.dataRemoved')}</li>
              <li>{t('gdpr.deletion.consequences.accountClosed')}</li>
              <li>{t('gdpr.deletion.consequences.auditKept')}</li>
              <li>{t('gdpr.deletion.consequences.irreversible')}</li>
            </ul>
          </IonText>
        </IonCardContent>
      </IonCard>

      <div className="deletion-actions">
        <IonButton
          expand="block"
          color="danger"
          fill="outline"
          onClick={handleDeleteSelected}
          disabled={deleting || selectedDataTypes.length === 0}
        >
          <IonIcon icon={trashOutline} slot="start" />
          {t('gdpr.deletion.deleteSelected')}
        </IonButton>

        <IonButton
          expand="block"
          color="danger"
          onClick={handleDeleteAll}
          disabled={deleting}
        >
          {deleting ? (
            <>
              <IonSpinner slot="start" />
              {t('gdpr.deletion.deleting')}
            </>
          ) : (
            <>
              <IonIcon icon={trashOutline} slot="start" />
              {t('gdpr.deletion.deleteAll')}
            </>
          )}
        </IonButton>
      </div>

      {/* Confirmation Alert */}
      <IonAlert
        isOpen={showConfirmAlert}
        onDidDismiss={() => {
          setShowConfirmAlert(false);
          setConfirmationText('');
        }}
        header={t('gdpr.deletion.confirmTitle')}
        message={
          isProfileDeletion() 
            ? t('gdpr.deletion.confirmMessageFull')
            : t('gdpr.deletion.confirmMessagePartial')
        }
        inputs={[
          {
            name: 'confirmation',
            type: 'text',
            placeholder: t('gdpr.deletion.confirmationText'),
            value: confirmationText,
            handler: (input) => setConfirmationText(input.value)
          }
        ]}
        buttons={[
          {
            text: t('common.cancel'),
            role: 'cancel',
            handler: () => setConfirmationText('')
          },
          {
            text: t('gdpr.deletion.confirmDelete'),
            role: 'destructive',
            handler: confirmDeletion
          }
        ]}
      />

      {/* Result Alert */}
      <IonAlert
        isOpen={showResultAlert}
        onDidDismiss={() => setShowResultAlert(false)}
        header={t('gdpr.deletion.title')}
        message={alertMessage}
        buttons={[t('common.ok')]}
      />
    </div>
  );
};