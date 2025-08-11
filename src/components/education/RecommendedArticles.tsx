import React, { useState, useEffect } from 'react';
import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonButton,
  IonIcon,
  IonText,
  IonSpinner,
  IonChip,
  IonLabel,
  IonList,
  IonItem,
  IonThumbnail,
  IonBadge
} from '@ionic/react';
import {
  starOutline,
  arrowForwardOutline,
  bulbOutline,
  alertCircleOutline,
  checkmarkCircleOutline
} from 'ionicons/icons';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import { EducationService } from '../../services/education.service';
import { AssessmentService } from '../../services/assessment.service';
import { EducationRecommendation, EducationalArticle } from '../../types/education';
import { EDUCATION_CATEGORIES } from '../../constants/educationalContent';
import './RecommendedArticles.css';

interface RecommendedArticlesProps {
  userId: string;
}

export const RecommendedArticles: React.FC<RecommendedArticlesProps> = ({ userId }) => {
  const { t } = useTranslation();
  const history = useHistory();
  
  const [recommendations, setRecommendations] = useState<EducationRecommendation[]>([]);
  const [articles, setArticles] = useState<Map<string, EducationalArticle>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecommendations();
  }, [userId]);

  const loadRecommendations = async () => {
    try {
      setLoading(true);
      
      // Get user's assessment results
      const assessmentResults = await AssessmentService.getAssessmentHistory(userId);
      
      // Get recommendations based on results
      const recs = await EducationService.getRecommendedArticles(userId, assessmentResults);
      setRecommendations(recs);
      
      // Load article details
      const articleMap = new Map<string, EducationalArticle>();
      for (const rec of recs) {
        const article = await EducationService.getArticleById(rec.articleId);
        if (article) {
          articleMap.set(rec.articleId, article);
        }
      }
      setArticles(articleMap);
      
    } catch (error) {
      console.error('Error loading recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return alertCircleOutline;
      case 'medium': return bulbOutline;
      case 'low': return checkmarkCircleOutline;
      default: return starOutline;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'danger';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'primary';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high': return t('priority.high');
      case 'medium': return t('priority.medium');
      case 'low': return t('priority.low');
      default: return priority;
    }
  };

  const getCategoryInfo = (categoryId: string) => {
    return EDUCATION_CATEGORIES.find(cat => cat.id === categoryId);
  };

  const handleArticleClick = (articleId: string) => {
    history.push(`/education/article/${articleId}`);
  };

  if (loading) {
    return (
      <IonCard className="recommended-articles-card">
        <IonCardHeader>
          <IonCardTitle>
            <IonIcon icon={starOutline} />
            {t('education.recommendedForYou')}
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

  if (recommendations.length === 0) {
    return (
      <IonCard className="recommended-articles-card">
        <IonCardHeader>
          <IonCardTitle>
            <IonIcon icon={starOutline} />
            {t('education.recommendedForYou')}
          </IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          <div className="no-recommendations">
            <IonIcon icon={bulbOutline} size="large" />
            <IonText>
              <p>{t('education.noRecommendationsYet')}</p>
              <p className="suggestion">{t('education.takeAssessmentForRecommendations')}</p>
            </IonText>
          </div>
        </IonCardContent>
      </IonCard>
    );
  }

  return (
    <IonCard className="recommended-articles-card">
      <IonCardHeader>
        <IonCardTitle>
          <IonIcon icon={starOutline} />
          {t('education.recommendedForYou')}
        </IonCardTitle>
      </IonCardHeader>
      
      <IonCardContent>
        <IonList className="recommendations-list">
          {recommendations.slice(0, 3).map((recommendation) => {
            const article = articles.get(recommendation.articleId);
            if (!article) return null;

            const categoryInfo = getCategoryInfo(article.category);

            return (
              <IonItem
                key={recommendation.articleId}
                button
                onClick={() => handleArticleClick(recommendation.articleId)}
                className="recommendation-item"
              >
                <IonThumbnail slot="start" className="article-thumbnail">
                  <div className="thumbnail-content">
                    {categoryInfo?.icon || '📖'}
                  </div>
                </IonThumbnail>
                
                <div className="recommendation-content">
                  <div className="recommendation-header">
                    <h3 className="article-title">{article.title}</h3>
                    <IonBadge 
                      color={getPriorityColor(recommendation.priority)}
                      className="priority-badge"
                    >
                      <IonIcon icon={getPriorityIcon(recommendation.priority)} />
                      {getPriorityLabel(recommendation.priority)}
                    </IonBadge>
                  </div>
                  
                  <p className="recommendation-reason">
                    {recommendation.reason}
                  </p>
                  
                  {recommendation.basedOnRisk && (
                    <div className="risk-context">
                      <IonChip color="medium" className="risk-chip">
                        <IonLabel>
                          {t('education.basedOnRisk', {
                            test: recommendation.basedOnRisk.testType.toUpperCase(),
                            risk: t(`risk.${recommendation.basedOnRisk.riskLevel}`)
                          })}
                        </IonLabel>
                      </IonChip>
                    </div>
                  )}
                  
                  <div className="article-meta">
                    <span className="reading-time">
                      {article.readingTime} {t('education.minutesRead')}
                    </span>
                    {categoryInfo && (
                      <span className="category-name">
                        {categoryInfo.name}
                      </span>
                    )}
                  </div>
                </div>
                
                <IonIcon icon={arrowForwardOutline} slot="end" />
              </IonItem>
            );
          })}
        </IonList>
        
        {recommendations.length > 3 && (
          <div className="view-all-container">
            <IonButton
              fill="clear"
              expand="block"
              onClick={() => history.push('/education?filter=recommended')}
            >
              {t('education.viewAllRecommendations', { count: recommendations.length })}
            </IonButton>
          </div>
        )}
      </IonCardContent>
    </IonCard>
  );
};