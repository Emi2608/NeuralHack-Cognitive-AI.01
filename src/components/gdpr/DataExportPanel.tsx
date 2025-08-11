/**
 * DataExportPanel - Allows users to export their data (GDPR Right to Access)
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
  IonSelect,
  IonSelectOption,
  IonCheckbox,
  IonText,
  IonSpinner,
  IonAlert,
  IonIcon,
  IonList,
  IonProgressBar
} from '@ionic/react';
import { downloadOutline, shieldCheckmarkOutline, documentTextOutline } from 'ionicons/icons';
import { useTranslation } from 'react-i18next';
import { GDPRService, UserDataExport } from '../../services/gdpr.service';
import { useAuth } from '../../hooks/useAuth';
import './DataExportPanel.css';

export const DataExportPanel: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [format, setFormat] = useState<'json' | 'csv'>('json');
  const [encrypt, setEncrypt] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [exportData, setExportData] = useState<UserDataExport | null>(null);

  const handleExport = async () => {
    if (!user) return;

    try {
      setExporting(true);
      setExportProgress(0);

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setExportProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const data = await GDPRService.exportUserData(user.id, format, encrypt);
      
      clearInterval(progressInterval);
      setExportProgress(100);
      
      setExportData(data);
      
      // Create and download file
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: format === 'json' ? 'application/json' : 'text/csv'
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `neuralhack-data-export-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setAlertMessage(t('gdpr.export.success'));
      setShowAlert(true);
    } catch (error) {
      console.error('Failed to export data:', error);
      setAlertMessage(t('gdpr.export.error'));
      setShowAlert(true);
    } finally {
      setExporting(false);
      setExportProgress(0);
    }
  };

  const getDataSummary = () => {
    if (!exportData) return null;

    return {
      profile: 1,
      assessments: exportData.assessments.length,
      auditLogs: exportData.auditLogs.length,
      totalSize: JSON.stringify(exportData).length
    };
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="data-export-panel">
      <IonCard>
        <IonCardHeader>
          <IonCardTitle>
            <IonIcon icon={downloadOutline} />
            {t('gdpr.export.title')}
          </IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          <IonText>
            <p>{t('gdpr.export.description')}</p>
          </IonText>

          <IonList>
            <IonItem>
              <IonLabel>{t('gdpr.export.format')}</IonLabel>
              <IonSelect
                value={format}
                onSelectionChange={(e) => setFormat(e.detail.value)}
                disabled={exporting}
              >
                <IonSelectOption value="json">JSON</IonSelectOption>
                <IonSelectOption value="csv">CSV</IonSelectOption>
              </IonSelect>
            </IonItem>

            <IonItem>
              <IonCheckbox
                checked={encrypt}
                onIonChange={(e) => setEncrypt(e.detail.checked)}
                disabled={exporting}
              />
              <IonLabel className="ion-margin-start">
                <h3>{t('gdpr.export.encrypt')}</h3>
                <IonText color="medium">
                  <p>{t('gdpr.export.encryptDescription')}</p>
                </IonText>
              </IonLabel>
            </IonItem>
          </IonList>

          {exporting && (
            <div className="export-progress">
              <IonText>
                <p>{t('gdpr.export.inProgress')}</p>
              </IonText>
              <IonProgressBar value={exportProgress / 100} />
            </div>
          )}

          <div className="export-actions">
            <IonButton
              expand="block"
              onClick={handleExport}
              disabled={exporting || !user}
            >
              {exporting ? (
                <>
                  <IonSpinner slot="start" />
                  {t('gdpr.export.exporting')}
                </>
              ) : (
                <>
                  <IonIcon icon={downloadOutline} slot="start" />
                  {t('gdpr.export.download')}
                </>
              )}
            </IonButton>
          </div>

          {exportData && (
            <IonCard className="export-summary">
              <IonCardHeader>
                <IonCardTitle>{t('gdpr.export.summary')}</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <IonList>
                  <IonItem>
                    <IonIcon icon={documentTextOutline} slot="start" />
                    <IonLabel>
                      <h3>{t('gdpr.export.profileData')}</h3>
                      <p>1 {t('gdpr.export.record')}</p>
                    </IonLabel>
                  </IonItem>
                  <IonItem>
                    <IonIcon icon={documentTextOutline} slot="start" />
                    <IonLabel>
                      <h3>{t('gdpr.export.assessments')}</h3>
                      <p>{exportData.assessments.length} {t('gdpr.export.records')}</p>
                    </IonLabel>
                  </IonItem>
                  <IonItem>
                    <IonIcon icon={documentTextOutline} slot="start" />
                    <IonLabel>
                      <h3>{t('gdpr.export.auditLogs')}</h3>
                      <p>{exportData.auditLogs.length} {t('gdpr.export.records')}</p>
                    </IonLabel>
                  </IonItem>
                  <IonItem>
                    <IonIcon icon={shieldCheckmarkOutline} slot="start" />
                    <IonLabel>
                      <h3>{t('gdpr.export.fileSize')}</h3>
                      <p>{formatFileSize(getDataSummary()?.totalSize || 0)}</p>
                    </IonLabel>
                  </IonItem>
                  {encrypt && exportData.encryptionKey && (
                    <IonItem>
                      <IonIcon icon={shieldCheckmarkOutline} slot="start" />
                      <IonLabel>
                        <h3>{t('gdpr.export.encrypted')}</h3>
                        <IonText color="success">
                          <p>{t('gdpr.export.encryptionEnabled')}</p>
                        </IonText>
                      </IonLabel>
                    </IonItem>
                  )}
                </IonList>
              </IonCardContent>
            </IonCard>
          )}

          <IonCard className="export-info">
            <IonCardContent>
              <IonText color="medium">
                <h4>{t('gdpr.export.whatIsIncluded')}</h4>
                <ul>
                  <li>{t('gdpr.export.includes.profile')}</li>
                  <li>{t('gdpr.export.includes.assessments')}</li>
                  <li>{t('gdpr.export.includes.settings')}</li>
                  <li>{t('gdpr.export.includes.auditLogs')}</li>
                </ul>
                <p>
                  <strong>{t('gdpr.export.note')}:</strong> {t('gdpr.export.noteText')}
                </p>
              </IonText>
            </IonCardContent>
          </IonCard>
        </IonCardContent>
      </IonCard>

      <IonAlert
        isOpen={showAlert}
        onDidDismiss={() => setShowAlert(false)}
        header={t('gdpr.export.title')}
        message={alertMessage}
        buttons={[t('common.ok')]}
      />
    </div>
  );
};