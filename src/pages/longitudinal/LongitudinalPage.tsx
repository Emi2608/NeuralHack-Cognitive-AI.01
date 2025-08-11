import React, { useState, useEffect } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonRefresher,
  IonRefresherContent,
  IonGrid,
  IonRow,
  IonCol,
  IonSpinner,
  IonText,
  IonIcon,
  RefresherEventDetail
} from '@ionic/react';
import {
  analyticsOutline,
  alertCircleOutline,
  notificationsOutline,
  refreshOutline,
  statsChartOutline
} from 'ionicons/icons';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { LongitudinalService } from '../../services/longitudinal.service';
import { AlertsPanel } from '../../components/longitudinal/AlertsPanel';
import { TrendChart } from '../../components/longitudinal/TrendChart';
import { ReminderSettings } from '../../components/longitudinal/ReminderSettings';
import { LongitudinalStats } from '../../types/longitudinal';
import './LongitudinalPage.css';

const LongitudinalPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'overview' | 'trends' | 'alerts' | 'reminders'>('overview');
  const [stats, setStats] = useState<LongitudinalStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadLongitudinalData();
    }
  }, [user]);

  const loadLongitudinalData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const userStats = await LongitudinalService.getLongitudinalStats(user.id);
      setStats(userStats);
    } catch (error) {
      console.error('Error loading longitudinal data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    await loadLongitudinalData();
    event.detail.complete();
  };

  const formatInterval = (days: number): string => {
    if (days === 0) return t('longitudinal.stats.noInterval');
    if (days < 7) return `${days} ${t('longitudinal.stats.days')}`;
    if (days < 30) return `${Math.round(days / 7)} ${t('longitudinal.stats.weeks')}`;
    return `${Math.round(days / 30)} ${t('longitudinal.stats.months')}`;
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return '📈';
      case 'declining': return '📉';
      case 'stable': return '➡️';
      default: return '❓';
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'improving': return 'success';
      case 'declining': return 'danger';
      case 'stable': return 'warning';
      default: return 'medium';
    }
  };

  if (!user) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle>{t('longitudinal.title')}</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <div className="auth-required">
            <IonText>
              <h2>{t('auth.loginRequired')}</h2>
              <p>{t('longitudinal.loginRequiredMessage')}</p>
            </IonText>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{t('longitudinal.title')}</IonTitle>
        </IonToolbar>
      </IonHeader>
      
      <IonContent>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent
            pullingIcon={refreshOutline}
            pullingText={t('dashboard.pullToRefresh')}
            refreshingSpinner="crescent"
            refreshingText={t('dashboard.refreshing')}
          />
        </IonRefresher>

        <div className="longitudinal-content">
          {/* Tab Navigation */}
          <div className="tab-navigation">
            <IonSegment
              value={activeTab}
              onIonChange={(e) => setActiveTab(e.detail.value as any)}
              scrollable
            >
              <IonSegmentButton value="overview">
                <IonIcon icon={statsChartOutline} />
                <IonLabel>{t('longitudinal.tabs.overview')}</IonLabel>
              </IonSegmentButton>
              <IonSegmentButton value="trends">
                <IonIcon icon={analyticsOutline} />
                <IonLabel>{t('longitudinal.tabs.trends')}</IonLabel>
              </IonSegmentButton>
              <IonSegmentButton value="alerts">
                <IonIcon icon={alertCircleOutline} />
                <IonLabel>{t('longitudinal.tabs.alerts')}</IonLabel>
              </IonSegmentButton>
              <IonSegmentButton value="reminders">
                <IonIcon icon={notificationsOutline} />
                <IonLabel>{t('longitudinal.tabs.reminders')}</IonLabel>
              </IonSegmentButton>
            </IonSegment>
          </div>

          {/* Tab Content */}
          <div className="tab-content">
            {activeTab === 'overview' && (
              <div className="overview-tab">
                {loading ? (
                  <div className="loading-container">
                    <IonSpinner name="crescent" />
                    <IonText>{t('common.loading')}</IonText>
                  </div>
                ) : stats ? (
                  <IonGrid>
                    <IonRow>
                      <IonCol size="12">
                        <div className="stats-overview">
                          <h2>{t('longitudinal.stats.title')}</h2>
                          
                          <div className="stats-grid">
                            <div className="stat-card">
                              <div className="stat-icon">📊</div>
                              <div className="stat-content">
                                <div className="stat-value">{stats.totalAssessments}</div>
                                <div className="stat-label">{t('longitudinal.stats.totalAssessments')}</div>
                              </div>
                            </div>
                            
                            <div className="stat-card">
                              <div className="stat-icon">⏱️</div>
                              <div className="stat-content">
                                <div className="stat-value">{formatInterval(stats.averageInterval)}</div>
                                <div className="stat-label">{t('longitudinal.stats.averageInterval')}</div>
                              </div>
                            </div>
                            
                            <div className="stat-card">
                              <div className="stat-icon">🔥</div>
                              <div className="stat-content">
                                <div className="stat-value">{stats.longestStreak}</div>
                                <div className="stat-label">{t('longitudinal.stats.longestStreak')}</div>
                              </div>
                            </div>
                            
                            <div className="stat-card">
                              <div className="stat-icon">⚡</div>
                              <div className="stat-content">
                                <div className="stat-value">{stats.currentStreak}</div>
                                <div className="stat-label">{t('longitudinal.stats.currentStreak')}</div>
                              </div>
                            </div>
                          </div>

                          <div className="trend-overview">
                            <div className="trend-card">
                              <div className="trend-icon">
                                {getTrendIcon(stats.overallTrend)}
                              </div>
                              <div className="trend-content">
                                <div className="trend-label">{t('longitudinal.stats.overallTrend')}</div>
                                <div className={`trend-value ${getTrendColor(stats.overallTrend)}`}>
                                  {t(`longitudinal.trend.${stats.overallTrend}`)}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="assessments-by-type">
                            <h3>{t('longitudinal.stats.assessmentsByType')}</h3>
                            <div className="type-grid">
                              {Object.entries(stats.assessmentsByType).map(([type, count]) => (
                                <div key={type} className="type-card">
                                  <div className="type-name">{type.toUpperCase()}</div>
                                  <div className="type-count">{count}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </IonCol>
                    </IonRow>
                  </IonGrid>
                ) : (
                  <div className="no-data">
                    <IonIcon icon={statsChartOutline} size="large" />
                    <IonText>
                      <h3>{t('longitudinal.noDataYet')}</h3>
                      <p>{t('longitudinal.takeAssessmentsMessage')}</p>
                    </IonText>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'trends' && (
              <div className="trends-tab">
                <TrendChart userId={user.id} />
              </div>
            )}

            {activeTab === 'alerts' && (
              <div className="alerts-tab">
                <AlertsPanel userId={user.id} />
              </div>
            )}

            {activeTab === 'reminders' && (
              <div className="reminders-tab">
                <ReminderSettings userId={user.id} />
              </div>
            )}
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default LongitudinalPage;