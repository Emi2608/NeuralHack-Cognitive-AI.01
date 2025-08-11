import React, { useState, useEffect } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonSearchbar,
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
  IonButton,
  IonChip,
  RefresherEventDetail
} from '@ionic/react';
import { 
  bookmarkOutline, 
  bookmark, 
  searchOutline,
  refreshOutline,
  libraryOutline
} from 'ionicons/icons';
import { useTranslation } from 'react-i18next';
import { EducationService } from '../../services/education.service';
import { EducationalArticle, EducationCategory } from '../../types/education';
import { EDUCATION_CATEGORIES } from '../../constants/educationalContent';
import { useAuth } from '../../hooks/useAuth';
import { ArticleCard } from '../../components/education/ArticleCard';
import { RecommendedArticles } from '../../components/education/RecommendedArticles';
import { ReadingStats } from '../../components/education/ReadingStats';
import './EducationPage.css';

const EducationPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  
  const [articles, setArticles] = useState<EducationalArticle[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<EducationalArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [bookmarkedArticles, setBookmarkedArticles] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadEducationalContent();
    if (user) {
      loadBookmarkedArticles();
    }
  }, [user]);

  useEffect(() => {
    filterArticles();
  }, [articles, searchText, selectedCategory]);

  const loadEducationalContent = async () => {
    try {
      setLoading(true);
      const allArticles = await EducationService.getAllArticles();
      setArticles(allArticles);
    } catch (error) {
      console.error('Error loading educational content:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadBookmarkedArticles = async () => {
    if (!user) return;
    
    try {
      const bookmarked = await EducationService.getBookmarkedArticles(user.id);
      setBookmarkedArticles(new Set(bookmarked.map(article => article.id)));
    } catch (error) {
      console.error('Error loading bookmarked articles:', error);
    }
  };

  const filterArticles = () => {
    let filtered = articles;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(article => article.category === selectedCategory);
    }

    // Filter by search text
    if (searchText.trim()) {
      const query = searchText.toLowerCase();
      filtered = filtered.filter(article =>
        article.title.toLowerCase().includes(query) ||
        article.summary.toLowerCase().includes(query) ||
        article.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    setFilteredArticles(filtered);
  };

  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    await loadEducationalContent();
    if (user) {
      await loadBookmarkedArticles();
    }
    event.detail.complete();
  };

  const handleBookmarkToggle = async (articleId: string) => {
    if (!user) return;

    try {
      const isBookmarked = await EducationService.toggleBookmark(user.id, articleId);
      
      setBookmarkedArticles(prev => {
        const newSet = new Set(prev);
        if (isBookmarked) {
          newSet.add(articleId);
        } else {
          newSet.delete(articleId);
        }
        return newSet;
      });
    } catch (error) {
      console.error('Error toggling bookmark:', error);
    }
  };

  const getCategoryName = (categoryId: string) => {
    const category = EDUCATION_CATEGORIES.find(cat => cat.id === categoryId);
    return category ? category.name : categoryId;
  };

  if (loading) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle>{t('navigation.education')}</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <div className="loading-container">
            <IonSpinner name="crescent" />
            <IonText>
              <p>{t('common.loading')}</p>
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
          <IonTitle>{t('navigation.education')}</IonTitle>
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

        <div className="education-content">
          {/* Search Bar */}
          <div className="search-section">
            <IonSearchbar
              value={searchText}
              onIonInput={(e) => setSearchText(e.detail.value!)}
              placeholder={t('education.searchPlaceholder')}
              showClearButton="focus"
            />
          </div>

          {/* User Stats and Recommendations */}
          {user && (
            <div className="user-section">
              <ReadingStats userId={user.id} />
              <RecommendedArticles userId={user.id} />
            </div>
          )}

          {/* Category Filter */}
          <div className="category-section">
            <IonSegment
              value={selectedCategory}
              onIonChange={(e) => setSelectedCategory(e.detail.value as string)}
              scrollable
            >
              <IonSegmentButton value="all">
                <IonLabel>{t('education.allCategories')}</IonLabel>
              </IonSegmentButton>
              {EDUCATION_CATEGORIES.map(category => (
                <IonSegmentButton key={category.id} value={category.id}>
                  <IonLabel>
                    <span className="category-icon">{category.icon}</span>
                    {category.name}
                  </IonLabel>
                </IonSegmentButton>
              ))}
            </IonSegment>
          </div>

          {/* Articles Grid */}
          <div className="articles-section">
            {filteredArticles.length === 0 ? (
              <div className="no-articles">
                <IonIcon icon={libraryOutline} size="large" />
                <IonText>
                  <h3>{t('education.noArticlesFound')}</h3>
                  <p>{t('education.tryDifferentSearch')}</p>
                </IonText>
                {searchText && (
                  <IonButton 
                    fill="clear" 
                    onClick={() => setSearchText('')}
                  >
                    {t('education.clearSearch')}
                  </IonButton>
                )}
              </div>
            ) : (
              <IonGrid>
                <IonRow>
                  {filteredArticles.map(article => (
                    <IonCol key={article.id} size="12" sizeMd="6" sizeLg="4">
                      <ArticleCard
                        article={article}
                        isBookmarked={bookmarkedArticles.has(article.id)}
                        onBookmarkToggle={() => handleBookmarkToggle(article.id)}
                        showBookmark={!!user}
                      />
                    </IonCol>
                  ))}
                </IonRow>
              </IonGrid>
            )}
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default EducationPage;