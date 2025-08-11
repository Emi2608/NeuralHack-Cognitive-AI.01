import React, { useState, useEffect } from 'react';
import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonList,
  IonItem,
  IonLabel,
  IonButton,
  IonIcon,
  IonBadge,
  IonText,
  IonSpinner,
  IonAlert,
  IonChip,
  IonRefresher,
  IonRefresherContent,
  RefresherEventDetail
} from '@ionic/react';
import {
  alertCircleOutline,
  warningOutline,
  checkmarkCircleOutline,
  informationCircleOutline,
  closeOutline,
  refreshOutline,
  timeOutline
} from 'ionicons/icons';
import { useTranslation } from 'react-i18next';
import { LongitudinalService } from '../../services/longitudinal.service';
import { LongitudinalAlert } from '../../types/longitudinal';
import './AlertsPanel.css';

interface AlertsPanelProps {
  userId: string;
  showOnlyUnacknowledged?: boolean;
  maxAlerts?: number;
}

export const AlertsPanel: React.FC<AlertsPanelProps> = ({
  userId,
  showOnlyUnacknowledged = false,
  maxAlerts
}) => {
  const { t } = useTranslation();
  
  const [alerts, setAlerts] = useState<LongitudinalAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [acknowledgeAlert, setAcknowledgeAlert] = useState<string | null>(null);

  useEffect(() => {
    loadAlerts();
  }, [userId, showOnlyUnacknowledged]);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const userAlerts = await LongitudinalService.getLongitudinalAlerts(
        userId, 
        showOnlyUnacknowledged
      );
      
      let filteredAlerts = userAlerts;
      if (maxAlerts) {
        filteredAlerts = userAlerts.slice(0, maxAlerts);
      }
      
      setAlerts(filteredAlerts);
    } catch (error) {
      console.error('Error loading alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    await loadAlerts();
    event.detail.complete();
  };

  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      await LongitudinalService.acknowledgeAlert(alertId);
      setAlerts(prev => prev.map(alert => 
        alert.id === alertId 
          ? { ...alert, acknowledged: true, acknowledgedAt: new Date() }
          : alert
      ));
      setAcknowledgeAlert(null);
    } catch (error) {
      console.error('Error acknowledging alert:', error);
    }
  };

  const getAlertIcon = (alertType: string, severity: string) => {
    switch (alertType) {
      case 'rapid_decline':
      case 'significant_decline':
        return severity === 'critical' ? alertCircleOutline : warningOutline;
      case 'improvement':
        return checkmarkCircleOutline;
      case 'reminder':
        return timeOutline;
      default:
        return informationCircleOutline;
    }
  };

  const getAlertColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'danger';
      case 'high': return 'danger';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'medium';
    }
  };

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case 'critical': return t('longitudinal.severity.critical');
      case 'high': return t('longitudinal.severity.high');
      case 'medium': return t('longitudinal.severity.medium');
      case 'low': return t('longitudinal.severity.low');
      default: return severity;
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffDays > 0) {
      return t('longitudinal.timeAgo.days', { count: diffDays });
    } else if (diffHours > 0) {
      return t('longitudinal.timeAgo.hours', { count: diffHours });
    } else if (diffMinutes > 0) {
      return t('longitudinal.timeAgo.minutes', { count: diffMinutes });
    } else {
      return t('longitudinal.timeAgo.justNow');
    }
  };

  if (loading) {
    return (
      <IonCard className="alerts-panel">
        <IonCardHeader>
          <IonCardTitle>
            <IonIcon icon={alertCircleOutline} />
            {t('longitudinal.alerts.title')}
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

  if (alerts.length === 0) {
    return (
      <IonCard className="alerts-panel">
        <IonCardHeader>
          <IonCardTitle>
            <IonIcon icon={alertCircleOutline} />
            {t('longitudinal.alerts.title')}
          </IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
            <IonRefresherContent
              pullingIcon={refreshOutline}
              pullingText={t('dashboard.pullToRefresh')}
              refreshingSpinner="crescent"
              refreshingText={t('dashboard.refreshing')}
            />
          </IonRefresher>
          
          <div className="no-alerts">
            <IonIcon icon={checkmarkCircleOutline} size="large" />
            <IonText>
              <h3>{t('longitudinal.alerts.noAlerts')}</h3>
              <p>{t('longitudinal.alerts.noAlertsMessage')}</p>
            </IonText>
          </div>
        </IonCardContent>
      </IonCard>
    );
  }

  return (
    <IonCard className="alerts-panel">
      <IonCardHeader>
        <IonCardTitle>
          <IonIcon icon={alertCircleOutline} />
          {t('longitudinal.alerts.title')}
          {showOnlyUnacknowledged && alerts.length > 0 && (
            <IonBadge color="danger" className="alert-count">
              {alerts.length}
            </IonBadge>
          )}
        </IonCardTitle>
      </IonCardHeader>
      
      <IonCardContent>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent
            pullingIcon={refreshOutline}
            pullingText={t('dashboard.pullToRefresh')}
            refreshingSpinner="crescent"
            refreshingText={t('dashboard.refreshing')}
          />
        </IonRefresher>

        <IonList className="alerts-list">
          {alerts.map(alert => (
            <IonItem key={alert.id} className={`alert-item ${alert.severity}`}>
              <div className="alert-content">
                <div className="alert-header">
                  <div className="alert-icon-title">
                    <IonIcon 
                      icon={getAlertIcon(alert.alertType, alert.severity)}
                      color={getAlertColor(alert.severity)}
                      className="alert-icon"
                    />
                    <div className="alert-title-meta">
                      <h3 className="alert-title">{alert.title}</h3>
                      <div className="alert-meta">
                        <IonChip 
                          color={getAlertColor(alert.severity)}
                          className="severity-chip"
                        >
                          {getSeverityLabel(alert.severity)}
                        </IonChip>
                        <span className="test-type">
                          {alert.testType.toUpperCase()}
                        </span>
                        <span className="time-ago">
                          {getTimeAgo(alert.triggered)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {!alert.acknowledged && (
                    <IonButton
                      fill="clear"
                      size="small"
                      onClick={() => setAcknowledgeAlert(alert.id)}
                      className="acknowledge-button"
                    >
                      <IonIcon icon={closeOutline} />
                    </IonButton>
                  )}
                </div>

                <div className="alert-message">
                  <p>{alert.message}</p>
                </div>

                {alert.metadata && (
                  <div className="alert-details">
                    {alert.metadata.changePercentage && (
                      <div className="detail-item">
                        <strong>{t('longitudinal.alerts.change')}:</strong>
                        <span className={alert.metadata.changePercentage > 0 ? 'positive' : 'negative'}>
                          {(alert.metadata.changePercentage * 100).toFixed(1)}%
                        </span>
                      </div>
                    )}
                    {alert.metadata.timeframe && (
                      <div className="detail-item">
                        <strong>{t('longitudinal.alerts.timeframe')}:</strong>
                        <span>{alert.metadata.timeframe}</span>
                      </div>
                    )}
                  </div>
                )}

                {alert.recommendations.length > 0 && (
                  <div className="alert-recommendations">
                    <h4>{t('longitudinal.alerts.recommendations')}:</h4>
                    <ul>
                      {alert.recommendations.map((rec, index) => (
                        <li key={index}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {alert.acknowledged && alert.acknowledgedAt && (
                  <div className="acknowledged-info">
                    <IonIcon icon={checkmarkCircleOutline} color="success" />
                    <span>
                      {t('longitudinal.alerts.acknowledgedAt', {
                        date: formatDate(alert.acknowledgedAt)
                      })}
                    </span>
                  </div>
                )}
              </div>
            </IonItem>
          ))}
        </IonList>
      </IonCardContent>

      <IonAlert
        isOpen={!!acknowledgeAlert}
        onDidDismiss={() => setAcknowledgeAlert(null)}
        header={t('longitudinal.alerts.acknowledgeTitle')}
        message={t('longitudinal.alerts.acknowledgeMessage')}
        buttons={[
          {
            text: t('common.cancel'),
            role: 'cancel'
          },
          {
            text: t('longitudinal.alerts.acknowledge'),
            handler: () => {
              if (acknowledgeAlert) {
                handleAcknowledgeAlert(acknowledgeAlert);
              }
            }
          }
        ]}
      />
    </IonCard>
  );
};