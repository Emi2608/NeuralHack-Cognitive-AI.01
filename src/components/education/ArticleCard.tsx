import React from 'react';
import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonButton,
  IonIcon,
  IonChip,
  IonLabel,
  IonText,
  IonBadge
} from '@ionic/react';
import {
  bookmarkOutline,
  bookmark,
  timeOutline,
  personOutline,
  calendarOutline,
  readerOutline
} from 'ionicons/icons';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import { EducationalArticle } from '../../types/education';
import { EDUCATION_CATEGORIES } from '../../constants/educationalContent';
import './ArticleCard.css';

interface ArticleCardProps {
  article: EducationalArticle;
  isBookmarked?: boolean;
  onBookmarkToggle?: () => void;
  showBookmark?: boolean;
}

export const ArticleCard: React.FC<ArticleCardProps> = ({
  article,
  isBookmarked = false,
  onBookmarkToggle,
  showBookmark = true
}) => {
  const { t } = useTranslation();
  const history = useHistory();

  const getCategoryInfo = () => {
    return EDUCATION_CATEGORIES.find(cat => cat.id === article.category);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'success';
      case 'intermediate': return 'warning';
      case 'advanced': return 'danger';
      default: return 'medium';
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return t('education.difficulty.beginner');
      case 'intermediate': return t('education.difficulty.intermediate');
      case 'advanced': return t('education.difficulty.advanced');
      default: return difficulty;
    }
  };

  const handleCardClick = () => {
    history.push(`/education/article/${article.id}`);
  };

  const handleBookmarkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onBookmarkToggle?.();
  };

  const categoryInfo = getCategoryInfo();
  const formattedDate = new Intl.DateTimeFormat('es-MX', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(article.lastUpdated);

  return (
    <IonCard className="article-card" button onClick={handleCardClick}>
      <IonCardHeader>
        <div className="article-card-header">
          <div className="article-meta">
            {categoryInfo && (
              <IonChip color="primary" className="category-chip">
                <span className="category-icon">{categoryInfo.icon}</span>
                <IonLabel>{categoryInfo.name}</IonLabel>
              </IonChip>
            )}
            <IonBadge 
              color={getDifficultyColor(article.difficulty)}
              className="difficulty-badge"
            >
              {getDifficultyLabel(article.difficulty)}
            </IonBadge>
          </div>
          
          {showBookmark && (
            <IonButton
              fill="clear"
              size="small"
              onClick={handleBookmarkClick}
              className="bookmark-button"
            >
              <IonIcon
                icon={isBookmarked ? bookmark : bookmarkOutline}
                color={isBookmarked ? 'warning' : 'medium'}
              />
            </IonButton>
          )}
        </div>

        <IonCardTitle className="article-title">
          {article.title}
        </IonCardTitle>
        
        <IonCardSubtitle className="article-summary">
          {article.summary}
        </IonCardSubtitle>
      </IonCardHeader>

      <IonCardContent>
        <div className="article-details">
          <div className="detail-item">
            <IonIcon icon={timeOutline} />
            <IonText>{article.readingTime} {t('education.minutesRead')}</IonText>
          </div>
          
          {article.author && (
            <div className="detail-item">
              <IonIcon icon={personOutline} />
              <IonText>{article.author}</IonText>
            </div>
          )}
          
          <div className="detail-item">
            <IonIcon icon={calendarOutline} />
            <IonText>{formattedDate}</IonText>
          </div>
        </div>

        <div className="article-tags">
          {article.tags.slice(0, 3).map(tag => (
            <IonChip key={tag} outline className="tag-chip">
              <IonLabel>{tag}</IonLabel>
            </IonChip>
          ))}
          {article.tags.length > 3 && (
            <IonChip outline className="tag-chip more-tags">
              <IonLabel>+{article.tags.length - 3}</IonLabel>
            </IonChip>
          )}
        </div>

        <div className="article-actions">
          <IonButton
            expand="block"
            fill="clear"
            onClick={handleCardClick}
            className="read-button"
          >
            <IonIcon icon={readerOutline} slot="start" />
            {t('education.readArticle')}
          </IonButton>
        </div>
      </IonCardContent>
    </IonCard>
  );
};