import React, { useState, useEffect } from 'react';
import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonList,
  IonItem,
  IonLabel,
  IonToggle,
  IonSelect,
  IonSelectOption,
  IonButton,
  IonIcon,
  IonText,
  IonSpinner,
  IonTextarea,
  IonAlert,
  IonToast
} from '@ionic/react';
import {
  notificationsOutline,
  timeOutline,
  saveOutline,
  addOutline,
  trashOutline
} from 'ionicons/icons';
import { useTranslation } from 'react-i18next';
import { LongitudinalService } from '../../services/longitudinal.service';
import { ReminderSettings as ReminderSettingsType } from '../../types/longitudinal';
import './ReminderSettings.css';

interface ReminderSettingsProps {
  userId: string;
}

export const ReminderSettings: React.FC<ReminderSettingsProps> = ({ userId }) => {
  const { t } = useTranslation();
  
  const [settings, setSettings] = useState<ReminderSettingsType[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddAlert, setShowAddAlert] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState<string | null>(null);
  const [showToast, setShowToast] = useState<{
    message: string;
    color: string;
  } | null>(null);

  const availableTestTypes = ['moca', 'phq9', 'mmse', 'ad8', 'parkinsons'];
  const frequencyOptions = [
    { value: 'weekly', label: t('longitudinal.reminders.frequency.weekly') },
    { value: 'biweekly', label: t('longitudinal.reminders.frequency.biweekly') },
    { value: 'monthly', label: t('longitudinal.reminders.frequency.monthly') },
    { value: 'quarterly', label: t('longitudinal.reminders.frequency.quarterly') }
  ];

  useEffect(() => {
    loadSettings();
  }, [userId]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const userSettings = await LongitudinalService.getReminderSettings(userId);
      setSettings(userSettings);
    } catch (error) {
      console.error('Error loading reminder settings:', error);
      setShowToast({
        message: t('longitudinal.reminders.errors.loadFailed'),
        color: 'danger'
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateNextReminder = (frequency: string): Date => {
    const now = new Date();
    const days = {
      weekly: 7,
      biweekly: 14,
      monthly: 30,
      quarterly: 90
    };
    
    return new Date(now.getTime() + days[frequency as keyof typeof days] * 24 * 60 * 60 * 1000);
  };

  const handleToggleEnabled = async (testType: string, enabled: boolean) => {
    try {
      const existingSetting = settings.find(s => s.testType === testType);
      
      if (existingSetting) {
        const updatedSetting: ReminderSettingsType = {
          ...existingSetting,
          enabled,
          nextReminder: enabled ? calculateNextReminder(existingSetting.frequency) : existingSetting.nextReminder
        };
        
        await LongitudinalService.setReminderSettings(updatedSetting);
        
        setSettings(prev => prev.map(s => 
          s.testType === testType ? updatedSetting : s
        ));
      } else if (enabled) {
        // Create new setting
        const newSetting: ReminderSettingsType = {
          userId,
          testType,
          enabled: true,
          frequency: 'monthly',
          nextReminder: calculateNextReminder('monthly')
        };
        
        await LongitudinalService.setReminderSettings(newSetting);
        setSettings(prev => [...prev, newSetting]);
      }
      
      setShowToast({
        message: t('longitudinal.reminders.updated'),
        color: 'success'
      });
    } catch (error) {
      console.error('Error updating reminder setting:', error);
      setShowToast({
        message: t('longitudinal.reminders.errors.updateFailed'),
        color: 'danger'
      });
    }
  };

  const handleFrequencyChange = async (testType: string, frequency: string) => {
    try {
      const existingSetting = settings.find(s => s.testType === testType);
      if (!existingSetting) return;
      
      const updatedSetting: ReminderSettingsType = {
        ...existingSetting,
        frequency: frequency as any,
        nextReminder: calculateNextReminder(frequency)
      };
      
      await LongitudinalService.setReminderSettings(updatedSetting);
      
      setSettings(prev => prev.map(s => 
        s.testType === testType ? updatedSetting : s
      ));
      
      setShowToast({
        message: t('longitudinal.reminders.updated'),
        color: 'success'
      });
    } catch (error) {
      console.error('Error updating frequency:', error);
      setShowToast({
        message: t('longitudinal.reminders.errors.updateFailed'),
        color: 'danger'
      });
    }
  };

  const handleCustomMessageChange = async (testType: string, message: string) => {
    try {
      const existingSetting = settings.find(s => s.testType === testType);
      if (!existingSetting) return;
      
      const updatedSetting: ReminderSettingsType = {
        ...existingSetting,
        customMessage: message.trim() || undefined
      };
      
      await LongitudinalService.setReminderSettings(updatedSetting);
      
      setSettings(prev => prev.map(s => 
        s.testType === testType ? updatedSetting : s
      ));
    } catch (error) {
      console.error('Error updating custom message:', error);
    }
  };

  const addNewReminder = async (testType: string) => {
    try {
      const newSetting: ReminderSettingsType = {
        userId,
        testType,
        enabled: true,
        frequency: 'monthly',
        nextReminder: calculateNextReminder('monthly')
      };
      
      await LongitudinalService.setReminderSettings(newSetting);
      setSettings(prev => [...prev, newSetting]);
      
      setShowToast({
        message: t('longitudinal.reminders.added'),
        color: 'success'
      });
    } catch (error) {
      console.error('Error adding reminder:', error);
      setShowToast({
        message: t('longitudinal.reminders.errors.addFailed'),
        color: 'danger'
      });
    }
  };

  const deleteReminder = async (testType: string) => {
    try {
      // In a real implementation, you'd have a delete method
      // For now, we'll just disable it
      await handleToggleEnabled(testType, false);
      
      setSettings(prev => prev.filter(s => s.testType !== testType));
      setShowDeleteAlert(null);
      
      setShowToast({
        message: t('longitudinal.reminders.deleted'),
        color: 'success'
      });
    } catch (error) {
      console.error('Error deleting reminder:', error);
      setShowToast({
        message: t('longitudinal.reminders.errors.deleteFailed'),
        color: 'danger'
      });
    }
  };

  const formatNextReminder = (date: Date): string => {
    return new Intl.DateTimeFormat('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getAvailableTestTypes = (): string[] => {
    const usedTypes = settings.map(s => s.testType);
    return availableTestTypes.filter(type => !usedTypes.includes(type));
  };

  if (loading) {
    return (
      <IonCard className="reminder-settings-card">
        <IonCardHeader>
          <IonCardTitle>
            <IonIcon icon={notificationsOutline} />
            {t('longitudinal.reminders.title')}
          </IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          <div className="loading-container">
            <IonSpinner name="crescent" />
            <IonText>{t('common.loading')}</IonText>
          </div>
        </IonCardContent>
      </IonCard>
    );
  }

  return (
    <IonCard className="reminder-settings-card">
      <IonCardHeader>
        <IonCardTitle>
          <IonIcon icon={notificationsOutline} />
          {t('longitudinal.reminders.title')}
        </IonCardTitle>
      </IonCardHeader>
      
      <IonCardContent>
        <div className="reminder-description">
          <IonText color="medium">
            <p>{t('longitudinal.reminders.description')}</p>
          </IonText>
        </div>

        <IonList className="reminders-list">
          {settings.map(setting => (
            <IonItem key={setting.testType} className="reminder-item">
              <div className="reminder-content">
                <div className="reminder-header">
                  <div className="test-info">
                    <h3 className="test-name">
                      {setting.testType.toUpperCase()}
                    </h3>
                    <IonToggle
                      checked={setting.enabled}
                      onIonChange={(e) => handleToggleEnabled(setting.testType, e.detail.checked)}
                      className="reminder-toggle"
                    />
                  </div>
                  
                  <IonButton
                    fill="clear"
                    size="small"
                    color="danger"
                    onClick={() => setShowDeleteAlert(setting.testType)}
                    className="delete-button"
                  >
                    <IonIcon icon={trashOutline} />
                  </IonButton>
                </div>

                {setting.enabled && (
                  <div className="reminder-details">
                    <div className="frequency-setting">
                      <IonLabel>{t('longitudinal.reminders.frequency.label')}:</IonLabel>
                      <IonSelect
                        value={setting.frequency}
                        onIonChange={(e: any) => handleFrequencyChange(setting.testType, e.detail.value)}
                        interface="popover"
                        className="frequency-select"
                      >
                        {frequencyOptions.map(option => (
                          <IonSelectOption key={option.value} value={option.value}>
                            {option.label}
                          </IonSelectOption>
                        ))}
                      </IonSelect>
                    </div>

                    <div className="next-reminder">
                      <IonIcon icon={timeOutline} />
                      <span>
                        {t('longitudinal.reminders.nextReminder')}: {formatNextReminder(setting.nextReminder)}
                      </span>
                    </div>

                    <div className="custom-message">
                      <IonLabel>{t('longitudinal.reminders.customMessage')}:</IonLabel>
                      <IonTextarea
                        value={setting.customMessage || ''}
                        onIonBlur={(e: any) => handleCustomMessageChange(setting.testType, e.detail?.value || '')}
                        placeholder={t('longitudinal.reminders.customMessagePlaceholder')}
                        rows={2}
                        className="message-textarea"
                      />
                    </div>
                  </div>
                )}
              </div>
            </IonItem>
          ))}
        </IonList>

        {getAvailableTestTypes().length > 0 && (
          <div className="add-reminder-section">
            <IonButton
              expand="block"
              fill="outline"
              onClick={() => setShowAddAlert(true)}
              className="add-reminder-button"
            >
              <IonIcon icon={addOutline} slot="start" />
              {t('longitudinal.reminders.addReminder')}
            </IonButton>
          </div>
        )}

        {settings.length === 0 && (
          <div className="no-reminders">
            <IonIcon icon={notificationsOutline} size="large" />
            <IonText>
              <h3>{t('longitudinal.reminders.noReminders')}</h3>
              <p>{t('longitudinal.reminders.noRemindersMessage')}</p>
            </IonText>
          </div>
        )}
      </IonCardContent>

      {/* Add Reminder Alert */}
      <IonAlert
        isOpen={showAddAlert}
        onDidDismiss={() => setShowAddAlert(false)}
        header={t('longitudinal.reminders.addReminderTitle')}
        message={t('longitudinal.reminders.selectTestType')}
        inputs={getAvailableTestTypes().map(type => ({
          type: 'radio',
          label: type.toUpperCase(),
          value: type
        }))}
        buttons={[
          {
            text: t('common.cancel'),
            role: 'cancel'
          },
          {
            text: t('common.add'),
            handler: (testType) => {
              if (testType) {
                addNewReminder(testType);
              }
            }
          }
        ]}
      />

      {/* Delete Confirmation Alert */}
      <IonAlert
        isOpen={!!showDeleteAlert}
        onDidDismiss={() => setShowDeleteAlert(null)}
        header={t('longitudinal.reminders.deleteTitle')}
        message={t('longitudinal.reminders.deleteMessage')}
        buttons={[
          {
            text: t('common.cancel'),
            role: 'cancel'
          },
          {
            text: t('common.delete'),
            role: 'destructive',
            handler: () => {
              if (showDeleteAlert) {
                deleteReminder(showDeleteAlert);
              }
            }
          }
        ]}
      />

      {/* Toast */}
      <IonToast
        isOpen={!!showToast}
        onDidDismiss={() => setShowToast(null)}
        message={showToast?.message}
        duration={3000}
        color={showToast?.color}
      />
    </IonCard>
  );
};