import React, { useState, useEffect } from 'react';
import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonGrid,
  IonRow,
  IonCol,
  IonIcon,
  IonText,
  IonSpinner,
  IonProgressBar
} from '@ionic/react';
import {
  libraryOutline,
  timeOutline,
  checkmarkCircleOutline,
  bookmarkOutline,
  trophyOutline,
  statsChartOutline
} from 'ionicons/icons';
import { useTranslation } from 'react-i18next';
import { EducationService } from '../../services/education.service';
import { EDUCATION_CATEGORIES } from '../../constants/educationalContent';
import './ReadingStats.css';

interface ReadingStatsProps {
  userId: string;
}

export const ReadingStats: React.FC<ReadingStatsProps> = ({ userId }) => {
  const { t } = useTranslation();
  
  const [stats, setStats] = useState({
    totalArticlesRead: 0,
    totalTimeSpent: 0,
    completedArticles: 0,
    bookmarkedArticles: 0,
    favoriteCategory: null as string | null
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [userId]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const userStats = await EducationService.getReadingStats(userId);
      setStats(userStats);
    } catch (error) {
      console.error('Error loading reading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number): string => {
    if (seconds < 60) {
      return `${seconds}s`;
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      return `${minutes}m`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return `${hours}h ${minutes}m`;
    }
  };

  const getFavoriteCategoryName = (): string => {
    if (!stats.favoriteCategory) return t('education.noFavoriteYet');
    
    const category = EDUCATION_CATEGORIES.find(cat => cat.id === stats.favoriteCategory);
    return category ? category.name : stats.favoriteCategory;
  };

  const getFavoriteCategoryIcon = (): string => {
    if (!stats.favoriteCategory) return '📚';
    
    const category = EDUCATION_CATEGORIES.find(cat => cat.id === stats.favoriteCategory);
    return category ? category.icon : '📚';
  };

  const getCompletionRate = (): number => {
    if (stats.totalArticlesRead === 0) return 0;
    return (stats.completedArticles / stats.totalArticlesRead) * 100;
  };

  const getEngagementLevel = (): { level: string; color: string; message: string } => {
    const completionRate = getCompletionRate();
    
    if (completionRate >= 80) {
      return {
        level: t('education.engagement.excellent'),
        color: 'success',
        message: t('education.engagement.excellentMessage')
      };
    } else if (completionRate >= 60) {
      return {
        level: t('education.engagement.good'),
        color: 'primary',
        message: t('education.engagement.goodMessage')
      };
    } else if (completionRate >= 40) {
      return {
        level: t('education.engagement.fair'),
        color: 'warning',
        message: t('education.engagement.fairMessage')
      };
    } else {
      return {
        level: t('education.engagement.needsImprovement'),
        color: 'medium',
        message: t('education.engagement.improvementMessage')
      };
    }
  };

  if (loading) {
    return (
      <IonCard className="reading-stats-card">
        <IonCardHeader>
          <IonCardTitle>
            <IonIcon icon={statsChartOutline} />
            {t('education.readingStats')}
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

  if (stats.totalArticlesRead === 0) {
    return (
      <IonCard className="reading-stats-card">
        <IonCardHeader>
          <IonCardTitle>
            <IonIcon icon={statsChartOutline} />
            {t('education.readingStats')}
          </IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          <div className="no-stats">
            <IonIcon icon={libraryOutline} size="large" />
            <IonText>
              <p>{t('education.noReadingStatsYet')}</p>
              <p className="suggestion">{t('education.startReadingToSeeStats')}</p>
            </IonText>
          </div>
        </IonCardContent>
      </IonCard>
    );
  }

  const engagement = getEngagementLevel();

  return (
    <IonCard className="reading-stats-card">
      <IonCardHeader>
        <IonCardTitle>
          <IonIcon icon={statsChartOutline} />
          {t('education.readingStats')}
        </IonCardTitle>
      </IonCardHeader>
      
      <IonCardContent>
        {/* Main Stats Grid */}
        <IonGrid className="stats-grid">
          <IonRow>
            <IonCol size="6">
              <div className="stat-item">
                <div className="stat-icon">
                  <IonIcon icon={libraryOutline} color="primary" />
                </div>
                <div className="stat-content">
                  <div className="stat-value">{stats.totalArticlesRead}</div>
                  <div className="stat-label">{t('education.articlesRead')}</div>
                </div>
              </div>
            </IonCol>
            
            <IonCol size="6">
              <div className="stat-item">
                <div className="stat-icon">
                  <IonIcon icon={timeOutline} color="secondary" />
                </div>
                <div className="stat-content">
                  <div className="stat-value">{formatTime(stats.totalTimeSpent)}</div>
                  <div className="stat-label">{t('education.timeSpent')}</div>
                </div>
              </div>
            </IonCol>
          </IonRow>
          
          <IonRow>
            <IonCol size="6">
              <div className="stat-item">
                <div className="stat-icon">
                  <IonIcon icon={checkmarkCircleOutline} color="success" />
                </div>
                <div className="stat-content">
                  <div className="stat-value">{stats.completedArticles}</div>
                  <div className="stat-label">{t('education.completed')}</div>
                </div>
              </div>
            </IonCol>
            
            <IonCol size="6">
              <div className="stat-item">
                <div className="stat-icon">
                  <IonIcon icon={bookmarkOutline} color="warning" />
                </div>
                <div className="stat-content">
                  <div className="stat-value">{stats.bookmarkedArticles}</div>
                  <div className="stat-label">{t('education.bookmarked')}</div>
                </div>
              </div>
            </IonCol>
          </IonRow>
        </IonGrid>

        {/* Completion Rate */}
        <div className="completion-section">
          <div className="section-header">
            <IonIcon icon={trophyOutline} color={engagement.color} />
            <span className="section-title">{t('education.completionRate')}</span>
            <span className="completion-percentage">{Math.round(getCompletionRate())}%</span>
          </div>
          
          <IonProgressBar 
            value={getCompletionRate() / 100} 
            color={engagement.color}
            className="completion-progress"
          />
          
          <div className="engagement-info">
            <div className={`engagement-level ${engagement.color}`}>
              {engagement.level}
            </div>
            <div className="engagement-message">
              {engagement.message}
            </div>
          </div>
        </div>

        {/* Favorite Category */}
        {stats.favoriteCategory && (
          <div className="favorite-category">
            <div className="section-header">
              <span className="category-icon">{getFavoriteCategoryIcon()}</span>
              <span className="section-title">{t('education.favoriteCategory')}</span>
            </div>
            <div className="category-name">
              {getFavoriteCategoryName()}
            </div>
          </div>
        )}
      </IonCardContent>
    </IonCard>
  );
};