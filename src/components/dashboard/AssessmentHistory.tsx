import React, { useState } from 'react';
import {
  IonList,
  IonItem,
  IonLabel,
  IonBadge,
  IonButton,
  IonIcon,
  IonSkeletonText,
  IonChip,
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonGrid,
  IonRow,
  IonCol
} from '@ionic/react';
import { 
  eyeOutline, 
  gitCompareOutline, 
  closeOutline,
  trendingUpOutline,
  trendingDownOutline,
  removeOutline
} from 'ionicons/icons';
import { useTranslation } from 'react-i18next';
import { AssessmentResult } from '../../types/assessment';
import { ScoreChart } from '../charts/ScoreChart';
import { RiskIndicator } from '../charts/RiskIndicator';
import './AssessmentHistory.css';

interface AssessmentHistoryProps {
  assessments: AssessmentResult[];
  loading?: boolean;
  onCompare?: (assessments: AssessmentResult[]) => void;
}

export const AssessmentHistory: React.FC<AssessmentHistoryProps> = ({
  assessments,
  loading = false,
  onCompare
}) => {
  const { t } = useTranslation();
  const [selectedAssessment, setSelectedAssessment] = useState<AssessmentResult | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [selectedForCompare, setSelectedForCompare] = useState<AssessmentResult[]>([]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRiskLevel = (riskPercentage: number) => {
    if (riskPercentage <= 5) return 'low';
    if (riskPercentage <= 40) return 'moderate';
    return 'high';
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return 'success';
      case 'moderate': return 'warning';
      case 'high': return 'danger';
      default: return 'medium';
    }
  };

  const getTrendIcon = (current: AssessmentResult, previous?: AssessmentResult) => {
    if (!previous || current.testType !== previous.testType) return null;
    
    const currentRisk = current.riskPercentage;
    const previousRisk = previous.riskPercentage;
    const change = currentRisk - previousRisk;
    
    if (Math.abs(change) < 2) return removeOutline; // No significant change
    return change > 0 ? trendingUpOutline : trendingDownOutline;
  };

  const getTrendColor = (current: AssessmentResult, previous?: AssessmentResult) => {
    if (!previous || current.testType !== previous.testType) return 'medium';
    
    const change = current.riskPercentage - previous.riskPercentage;
    if (Math.abs(change) < 2) return 'medium';
    return change > 0 ? 'danger' : 'success';
  };

  const handleCompareToggle = (assessment: AssessmentResult) => {
    if (selectedForCompare.includes(assessment)) {
      setSelectedForCompare(prev => prev.filter(a => a.id !== assessment.id));
    } else if (selectedForCompare.length < 3) {
      setSelectedForCompare(prev => [...prev, assessment]);
    }
  };

  const handleCompare = () => {
    if (onCompare && selectedForCompare.length >= 2) {
      onCompare(selectedForCompare);
    }
  };

  const groupedAssessments = assessments.reduce((groups, assessment) => {
    const date = new Date(assessment.completedAt).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(assessment);
    return groups;
  }, {} as Record<string, AssessmentResult[]>);

  if (loading) {
    return (
      <div className="assessment-history-loading">
        {[1, 2, 3].map(i => (
          <IonItem key={i}>
            <IonLabel>
              <IonSkeletonText animated style={{ width: '60%' }} />
              <IonSkeletonText animated style={{ width: '40%' }} />
            </IonLabel>
          </IonItem>
        ))}
      </div>
    );
  }

  if (assessments.length === 0) {
    return (
      <div className="no-assessments">
        <p>{t('dashboard.noAssessmentsYet')}</p>
        <small>{t('dashboard.takeFirstAssessment')}</small>
      </div>
    );
  }

  return (
    <div className="assessment-history">
      {/* Compare Mode Controls */}
      {compareMode && (
        <div className="compare-controls">
          <div className="compare-info">
            <span>{t('dashboard.selectedForCompare', { count: selectedForCompare.length })}</span>
          </div>
          <div className="compare-actions">
            <IonButton
              size="small"
              fill="clear"
              onClick={() => {
                setCompareMode(false);
                setSelectedForCompare([]);
              }}
            >
              {t('common.cancel')}
            </IonButton>
            <IonButton
              size="small"
              onClick={handleCompare}
              disabled={selectedForCompare.length < 2}
            >
              {t('dashboard.compare')}
            </IonButton>
          </div>
        </div>
      )}

      {/* Toggle Compare Mode */}
      <div className="history-actions">
        <IonButton
          fill="outline"
          size="small"
          onClick={() => setCompareMode(!compareMode)}
        >
          <IonIcon icon={gitCompareOutline} slot="start" />
          {compareMode ? t('dashboard.exitCompare') : t('dashboard.compareMode')}
        </IonButton>
      </div>

      <IonList>
        {Object.entries(groupedAssessments)
          .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
          .map(([date, dayAssessments]) => (
            <div key={date} className="assessment-day-group">
              <div className="day-header">
                <h3>{new Date(date).toLocaleDateString('es-MX', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}</h3>
              </div>
              
              {dayAssessments
                .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
                .map((assessment, index) => {
                  const previousAssessment = assessments.find(a => 
                    a.testType === assessment.testType && 
                    new Date(a.completedAt) < new Date(assessment.completedAt)
                  );
                  const riskLevel = getRiskLevel(assessment.riskPercentage);
                  const trendIcon = getTrendIcon(assessment, previousAssessment);
                  const trendColor = getTrendColor(assessment, previousAssessment);
                  const isSelected = selectedForCompare.includes(assessment);

                  return (
                    <IonItem 
                      key={assessment.id}
                      className={`assessment-item ${compareMode ? 'compare-mode' : ''} ${isSelected ? 'selected' : ''}`}
                      button={!compareMode}
                      onClick={() => {
                        if (compareMode) {
                          handleCompareToggle(assessment);
                        } else {
                          setSelectedAssessment(assessment);
                        }
                      }}
                    >
                      <IonLabel>
                        <div className="assessment-header">
                          <h3>{t(`assessments.${assessment.testType}.name`)}</h3>
                          <div className="assessment-meta">
                            <span className="assessment-time">
                              {formatDate(assessment.completedAt)}
                            </span>
                            {trendIcon && (
                              <IonIcon 
                                icon={trendIcon} 
                                color={trendColor}
                                className="trend-icon"
                              />
                            )}
                          </div>
                        </div>
                        
                        <div className="assessment-details">
                          <div className="score-info">
                            <IonChip color="primary" outline>
                              {t('dashboard.score')}: {assessment.totalScore}/{assessment.maxScore}
                            </IonChip>
                            <IonBadge color={getRiskColor(riskLevel)}>
                              {t(`risk.${riskLevel}`)} ({assessment.riskPercentage}%)
                            </IonBadge>
                          </div>
                          
                          {assessment.duration && (
                            <small className="duration">
                              {t('dashboard.duration')}: {Math.round(assessment.duration / 60)}min
                            </small>
                          )}
                        </div>
                      </IonLabel>

                      {!compareMode && (
                        <IonButton 
                          fill="clear" 
                          slot="end"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedAssessment(assessment);
                          }}
                        >
                          <IonIcon icon={eyeOutline} />
                        </IonButton>
                      )}
                    </IonItem>
                  );
                })}
            </div>
          ))}
      </IonList>

      {/* Assessment Detail Modal */}
      <IonModal isOpen={!!selectedAssessment} onDidDismiss={() => setSelectedAssessment(null)}>
        <IonHeader>
          <IonToolbar>
            <IonTitle>
              {selectedAssessment && t(`assessments.${selectedAssessment.testType}.name`)}
            </IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={() => setSelectedAssessment(null)}>
                <IonIcon icon={closeOutline} />
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        
        <IonContent>
          {selectedAssessment && (
            <div className="assessment-detail">
              <IonGrid>
                <IonRow>
                  <IonCol size="12" sizeMd="6">
                    <div className="detail-section">
                      <h3>{t('dashboard.overallScore')}</h3>
                      <ScoreChart 
                        scores={[{
                          testType: selectedAssessment.testType,
                          score: selectedAssessment.totalScore,
                          maxScore: selectedAssessment.maxScore,
                          date: selectedAssessment.completedAt
                        }]}
                        height={200}
                      />
                    </div>
                  </IonCol>
                  
                  <IonCol size="12" sizeMd="6">
                    <div className="detail-section">
                      <h3>{t('dashboard.riskAssessment')}</h3>
                      <RiskIndicator 
                        riskPercentage={selectedAssessment.riskPercentage}
                        size="large"
                        showLabel={true}
                      />
                    </div>
                  </IonCol>
                </IonRow>
                
                <IonRow>
                  <IonCol size="12">
                    <div className="detail-section">
                      <h3>{t('dashboard.sectionScores')}</h3>
                      <IonList>
                        {selectedAssessment.sectionScores.map((section, index) => (
                          <IonItem key={index}>
                            <IonLabel>
                              <h4>{section.name}</h4>
                              <p>{section.score}/{section.maxScore} puntos</p>
                            </IonLabel>
                            <IonBadge slot="end" color="primary">
                              {Math.round((section.score / section.maxScore) * 100)}%
                            </IonBadge>
                          </IonItem>
                        ))}
                      </IonList>
                    </div>
                  </IonCol>
                </IonRow>
              </IonGrid>
            </div>
          )}
        </IonContent>
      </IonModal>
    </div>
  );
};