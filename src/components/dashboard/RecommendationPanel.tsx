import React, { useState, useEffect } from 'react';
import {
  IonList,
  IonItem,
  IonLabel,
  IonIcon,
  IonButton,
  IonBadge,
  IonCard,
  IonCardContent,
  IonSkeletonText,
  IonAlert,
  IonChip
} from '@ionic/react';
import {
  medicalOutline,
  fitnessOutline,
  restaurantOutline,
  schoolOutline,
  warningOutline,
  checkmarkCircleOutline,
  informationCircleOutline
} from 'ionicons/icons';
import { useTranslation } from 'react-i18next';
import { AssessmentResult } from '../../types/assessment';
import { RecommendationEngine } from '../../utils/scoring/recommendationEngine';
import type { Recommendation } from '../../types/assessment';
import './RecommendationPanel.css';

interface RecommendationPanelProps {
  latestResults: AssessmentResult[];
  maxRecommendations?: number;
}

export const RecommendationPanel: React.FC<RecommendationPanelProps> = ({
  latestResults,
  maxRecommendations = 5
}) => {
  const { t } = useTranslation();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEmergencyAlert, setShowEmergencyAlert] = useState(false);
  const [emergencyRecommendations, setEmergencyRecommendations] = useState<Recommendation[]>([]);

  useEffect(() => {
    generateRecommendations();
  }, [latestResults]);

  const generateRecommendations = async () => {
    setLoading(true);
    
    try {
      const engine = new RecommendationEngine();
      const allRecommendations: Recommendation[] = [];
      const emergencyRecs: Recommendation[] = [];

      for (const result of latestResults) {
        const recs = RecommendationEngine.generatePersonalizedRecommendations(result, {} as any);
        
        // Separate emergency recommendations
        const emergency = recs.filter((r: any) => r.priority === 'urgent');
        const regular = recs.filter((r: any) => r.priority !== 'urgent');
        
        emergencyRecs.push(...emergency);
        allRecommendations.push(...regular);
      }

      // Sort by priority and limit results
      const sortedRecommendations = allRecommendations
        .sort((a, b) => {
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority as keyof typeof priorityOrder] - 
                 priorityOrder[a.priority as keyof typeof priorityOrder];
        })
        .slice(0, maxRecommendations);

      setRecommendations(sortedRecommendations);
      setEmergencyRecommendations(emergencyRecs);
      
      // Show emergency alert if there are emergency recommendations
      if (emergencyRecs.length > 0) {
        setShowEmergencyAlert(true);
      }
    } catch (error) {
      console.error('Error generating recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'medical': return medicalOutline;
      case 'lifestyle': return fitnessOutline;
      case 'nutrition': return restaurantOutline;
      case 'education': return schoolOutline;
      default: return informationCircleOutline;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'danger';
      case 'medium': return 'warning';
      case 'low': return 'success';
      case 'emergency': return 'danger';
      default: return 'medium';
    }
  };

  const getOverallRiskLevel = () => {
    if (latestResults.length === 0) return 'low';
    
    const avgRisk = latestResults.reduce((sum, result) => sum + result.riskPercentage, 0) / latestResults.length;
    
    if (avgRisk <= 5) return 'low';
    if (avgRisk <= 40) return 'moderate';
    return 'high';
  };

  if (loading) {
    return (
      <div className="recommendation-panel-loading">
        {[1, 2, 3].map(i => (
          <IonCard key={i}>
            <IonCardContent>
              <IonSkeletonText animated style={{ width: '80%' }} />
              <IonSkeletonText animated style={{ width: '60%' }} />
            </IonCardContent>
          </IonCard>
        ))}
      </div>
    );
  }

  if (latestResults.length === 0) {
    return (
      <div className="no-recommendations">
        <IonIcon icon={informationCircleOutline} size="large" color="medium" />
        <p>{t('recommendations.noAssessments')}</p>
        <small>{t('recommendations.takeAssessmentFirst')}</small>
      </div>
    );
  }

  const riskLevel = getOverallRiskLevel();

  return (
    <div className="recommendation-panel">
      {/* Risk Level Summary */}
      <div className="risk-summary">
        <IonChip color={getPriorityColor(riskLevel)} outline>
          <IonIcon icon={riskLevel === 'high' ? warningOutline : checkmarkCircleOutline} />
          <span>{t(`risk.${riskLevel}`)}</span>
        </IonChip>
      </div>

      {/* Recommendations List */}
      {recommendations.length > 0 ? (
        <IonList className="recommendations-list">
          {recommendations.map((recommendation, index) => (
            <IonCard key={index} className="recommendation-card">
              <IonCardContent>
                <div className="recommendation-header">
                  <div className="recommendation-icon">
                    <IonIcon 
                      icon={getCategoryIcon(recommendation.category)} 
                      color={getPriorityColor(recommendation.priority)}
                    />
                  </div>
                  <div className="recommendation-meta">
                    <IonBadge 
                      color={getPriorityColor(recommendation.priority)}
                    >
                      {t(`priority.${recommendation.priority}`)}
                    </IonBadge>
                  </div>
                </div>
                
                <div className="recommendation-content">
                  <h4>{recommendation.title}</h4>
                  <p>{recommendation.description}</p>
                  
                  {recommendation.actionSteps && recommendation.actionSteps.length > 0 && (
                    <div className="action-steps">
                      <strong>{t('recommendations.actionSteps')}:</strong>
                      <ul>
                        {recommendation.actionSteps.map((step, stepIndex) => (
                          <li key={stepIndex}>{step}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {recommendation.resources && recommendation.resources.length > 0 && (
                    <div className="resources">
                      <strong>{t('recommendations.resources')}:</strong>
                      <div className="resource-links">
                        {recommendation.resources?.map((resource: any, resourceIndex: number) => (
                          <IonButton
                            key={resourceIndex}
                            fill="outline"
                            size="small"
                            href={resource.url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {resource.title}
                          </IonButton>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </IonCardContent>
            </IonCard>
          ))}
        </IonList>
      ) : (
        <div className="no-specific-recommendations">
          <IonIcon icon={checkmarkCircleOutline} size="large" color="success" />
          <p>{t('recommendations.allGood')}</p>
          <small>{t('recommendations.keepUpGoodWork')}</small>
        </div>
      )}

      {/* Emergency Alert */}
      <IonAlert
        isOpen={showEmergencyAlert}
        onDidDismiss={() => setShowEmergencyAlert(false)}
        header={t('recommendations.emergencyTitle')}
        message={t('recommendations.emergencyMessage')}
        buttons={[
          {
            text: t('common.understand'),
            role: 'confirm',
            handler: () => {
              setShowEmergencyAlert(false);
            }
          }
        ]}
      />

      {/* Refresh Button */}
      <div className="panel-actions">
        <IonButton
          fill="outline"
          size="small"
          onClick={generateRecommendations}
          disabled={loading}
        >
          {t('recommendations.refresh')}
        </IonButton>
      </div>
    </div>
  );
};