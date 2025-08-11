import React from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonButton,
  IonIcon,
  IonRefresher,
  IonRefresherContent
} from '@ionic/react';
import { refreshOutline, downloadOutline, shareOutline } from 'ionicons/icons';
import { useTranslation } from 'react-i18next';
import { AssessmentResult } from '../../types/assessment';
import { ScoreChart } from '../charts/ScoreChart';
import { RiskIndicator } from '../charts/RiskIndicator';
import { TrendChart } from '../charts/TrendChart';
import { AssessmentHistory } from './AssessmentHistory';
import { RecommendationPanel } from './RecommendationPanel';
import './DashboardLayout.css';

interface DashboardLayoutProps {
  latestResults: AssessmentResult[];
  historicalData: AssessmentResult[];
  onRefresh?: () => Promise<void>;
  onExport?: () => void;
  onShare?: () => void;
  loading?: boolean;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  latestResults,
  historicalData,
  onRefresh,
  onExport,
  onShare,
  loading = false
}) => {
  const { t } = useTranslation();

  const handleRefresh = async (event: CustomEvent) => {
    if (onRefresh) {
      await onRefresh();
    }
    event.detail.complete();
  };

  const getOverallRisk = () => {
    if (latestResults.length === 0) return 0;
    const totalRisk = latestResults.reduce((sum, result) => sum + result.riskPercentage, 0);
    return Math.round(totalRisk / latestResults.length);
  };

  const getLatestScores = () => {
    return latestResults.map(result => ({
      testType: result.testType,
      score: result.totalScore,
      maxScore: result.maxScore,
      date: result.completedAt
    }));
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{t('dashboard.title')}</IonTitle>
        </IonToolbar>
      </IonHeader>
      
      <IonContent fullscreen>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent
            pullingIcon={refreshOutline}
            pullingText={t('dashboard.pullToRefresh')}
            refreshingSpinner="circles"
            refreshingText={t('dashboard.refreshing')}
          />
        </IonRefresher>

        <div className="dashboard-container">
          {/* Header Actions */}
          <div className="dashboard-actions">
            <IonButton 
              fill="outline" 
              size="small" 
              onClick={onExport}
              disabled={loading || latestResults.length === 0}
            >
              <IonIcon icon={downloadOutline} slot="start" />
              {t('dashboard.export')}
            </IonButton>
            <IonButton 
              fill="outline" 
              size="small" 
              onClick={onShare}
              disabled={loading || latestResults.length === 0}
            >
              <IonIcon icon={shareOutline} slot="start" />
              {t('dashboard.share')}
            </IonButton>
          </div>

          <IonGrid>
            <IonRow>
              {/* Overall Risk Indicator */}
              <IonCol size="12" sizeMd="6">
                <IonCard className="risk-overview-card">
                  <IonCardHeader>
                    <IonCardTitle>{t('dashboard.overallRisk')}</IonCardTitle>
                  </IonCardHeader>
                  <IonCardContent>
                    <RiskIndicator 
                      riskPercentage={getOverallRisk()}
                      size="large"
                      showLabel={true}
                    />
                  </IonCardContent>
                </IonCard>
              </IonCol>

              {/* Latest Scores */}
              <IonCol size="12" sizeMd="6">
                <IonCard className="scores-overview-card">
                  <IonCardHeader>
                    <IonCardTitle>{t('dashboard.latestScores')}</IonCardTitle>
                  </IonCardHeader>
                  <IonCardContent>
                    {latestResults.length > 0 ? (
                      <ScoreChart 
                        scores={getLatestScores()}
                        height={200}
                      />
                    ) : (
                      <div className="no-data-message">
                        <p>{t('dashboard.noAssessments')}</p>
                      </div>
                    )}
                  </IonCardContent>
                </IonCard>
              </IonCol>
            </IonRow>

            <IonRow>
              {/* Trend Analysis */}
              <IonCol size="12">
                <IonCard className="trend-card">
                  <IonCardHeader>
                    <IonCardTitle>{t('dashboard.trendAnalysis')}</IonCardTitle>
                  </IonCardHeader>
                  <IonCardContent>
                    {historicalData.length > 1 ? (
                      <TrendChart 
                        data={historicalData}
                        height={300}
                      />
                    ) : (
                      <div className="no-data-message">
                        <p>{t('dashboard.needMoreData')}</p>
                        <small>{t('dashboard.trendRequirement')}</small>
                      </div>
                    )}
                  </IonCardContent>
                </IonCard>
              </IonCol>
            </IonRow>

            <IonRow>
              {/* Assessment History */}
              <IonCol size="12" sizeLg="8">
                <IonCard className="history-card">
                  <IonCardHeader>
                    <IonCardTitle>{t('dashboard.assessmentHistory')}</IonCardTitle>
                  </IonCardHeader>
                  <IonCardContent>
                    <AssessmentHistory 
                      assessments={historicalData}
                      loading={loading}
                    />
                  </IonCardContent>
                </IonCard>
              </IonCol>

              {/* Recommendations */}
              <IonCol size="12" sizeLg="4">
                <IonCard className="recommendations-card">
                  <IonCardHeader>
                    <IonCardTitle>{t('dashboard.recommendations')}</IonCardTitle>
                  </IonCardHeader>
                  <IonCardContent>
                    <RecommendationPanel 
                      latestResults={latestResults}
                    />
                  </IonCardContent>
                </IonCard>
              </IonCol>
            </IonRow>
          </IonGrid>
        </div>
      </IonContent>
    </IonPage>
  );
};