import { supabase } from './supabase';
import { 
  EducationalArticle, 
  EducationProgress, 
  EducationRecommendation,
  EducationCategory 
} from '../types/education';
import { EDUCATIONAL_ARTICLES } from '../constants/educationalContent';
import { AssessmentResult } from '../types/assessment';

export class EducationService {
  // Get all educational articles
  static async getAllArticles(): Promise<EducationalArticle[]> {
    try {
      // In a real implementation, this would fetch from Supabase
      // For now, return the static content
      return EDUCATIONAL_ARTICLES;
    } catch (error) {
      console.error('Error fetching educational articles:', error);
      throw new Error('Failed to load educational content');
    }
  }

  // Get articles by category
  static async getArticlesByCategory(category: EducationCategory): Promise<EducationalArticle[]> {
    try {
      return EDUCATIONAL_ARTICLES.filter(article => article.category === category);
    } catch (error) {
      console.error('Error fetching articles by category:', error);
      throw new Error('Failed to load articles for category');
    }
  }

  // Get single article by ID
  static async getArticleById(articleId: string): Promise<EducationalArticle | null> {
    try {
      return EDUCATIONAL_ARTICLES.find(article => article.id === articleId) || null;
    } catch (error) {
      console.error('Error fetching article:', error);
      throw new Error('Failed to load article');
    }
  }

  // Search articles
  static async searchArticles(query: string): Promise<EducationalArticle[]> {
    try {
      const lowercaseQuery = query.toLowerCase();
      return EDUCATIONAL_ARTICLES.filter(article => 
        article.title.toLowerCase().includes(lowercaseQuery) ||
        article.summary.toLowerCase().includes(lowercaseQuery) ||
        article.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery)) ||
        article.content.toLowerCase().includes(lowercaseQuery)
      );
    } catch (error) {
      console.error('Error searching articles:', error);
      throw new Error('Failed to search articles');
    }
  }

  // Get recommended articles based on assessment results
  static async getRecommendedArticles(
    userId: string, 
    assessmentResults?: AssessmentResult[]
  ): Promise<EducationRecommendation[]> {
    try {
      const recommendations: EducationRecommendation[] = [];

      if (!assessmentResults || assessmentResults.length === 0) {
        // Default recommendations for new users
        recommendations.push(
          {
            articleId: 'lifestyle-factors-brain-health',
            reason: 'Fundamentos esenciales para la salud cerebral',
            priority: 'high'
          },
          {
            articleId: 'alzheimer-prevention-basics',
            reason: 'Información básica sobre prevención',
            priority: 'medium'
          }
        );
        return recommendations;
      }

      // Analyze assessment results and generate recommendations
      for (const result of assessmentResults) {
        const riskLevel = result.riskAssessment?.riskCategory || 'low';
        const testType = result.testType;

        if (riskLevel === 'high') {
          if (testType === 'moca' || testType === 'mmse') {
            recommendations.push({
              articleId: 'alzheimer-prevention-basics',
              reason: 'Estrategias de prevención para deterioro cognitivo',
              priority: 'high',
              basedOnRisk: { testType, riskLevel }
            });
          }
          
          if (testType === 'parkinsons') {
            recommendations.push({
              articleId: 'parkinson-early-signs',
              reason: 'Información sobre síntomas tempranos y prevención',
              priority: 'high',
              basedOnRisk: { testType, riskLevel }
            });
          }

          if (testType === 'phq9') {
            recommendations.push({
              articleId: 'depression-cognitive-impact',
              reason: 'Manejo de la depresión y su impacto cognitivo',
              priority: 'high',
              basedOnRisk: { testType, riskLevel }
            });
          }
        }

        if (riskLevel === 'moderate') {
          recommendations.push({
            articleId: 'lifestyle-factors-brain-health',
            reason: 'Modificaciones en el estilo de vida para reducir riesgo',
            priority: 'medium',
            basedOnRisk: { testType, riskLevel }
          });
        }
      }

      // Remove duplicates and sort by priority
      const uniqueRecommendations = recommendations.filter((rec, index, self) => 
        index === self.findIndex(r => r.articleId === rec.articleId)
      );

      return uniqueRecommendations.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });

    } catch (error) {
      console.error('Error generating recommendations:', error);
      throw new Error('Failed to generate article recommendations');
    }
  }

  // Track reading progress
  static async trackReadingProgress(
    userId: string, 
    articleId: string, 
    timeSpent: number,
    completed: boolean = false
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('education_progress')
        .upsert({
          user_id: userId,
          article_id: articleId,
          time_spent: timeSpent,
          completed,
          read_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error tracking reading progress:', error);
      // Don't throw error for tracking - it's not critical
    }
  }

  // Get user's reading progress
  static async getUserProgress(userId: string): Promise<EducationProgress[]> {
    try {
      const { data, error } = await supabase
        .from('education_progress')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;

      return data?.map(item => ({
        userId: item.user_id,
        articleId: item.article_id,
        readAt: new Date(item.read_at),
        timeSpent: item.time_spent,
        completed: item.completed,
        bookmarked: item.bookmarked || false
      })) || [];
    } catch (error) {
      console.error('Error fetching user progress:', error);
      return []; // Return empty array on error
    }
  }

  // Bookmark/unbookmark article
  static async toggleBookmark(userId: string, articleId: string): Promise<boolean> {
    try {
      // First check if progress record exists
      const { data: existing } = await supabase
        .from('education_progress')
        .select('bookmarked')
        .eq('user_id', userId)
        .eq('article_id', articleId)
        .single();

      const newBookmarkStatus = !existing?.bookmarked;

      const { error } = await supabase
        .from('education_progress')
        .upsert({
          user_id: userId,
          article_id: articleId,
          bookmarked: newBookmarkStatus,
          read_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      return newBookmarkStatus;
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      throw new Error('Failed to update bookmark');
    }
  }

  // Get bookmarked articles
  static async getBookmarkedArticles(userId: string): Promise<EducationalArticle[]> {
    try {
      const { data, error } = await supabase
        .from('education_progress')
        .select('article_id')
        .eq('user_id', userId)
        .eq('bookmarked', true);

      if (error) throw error;

      const bookmarkedIds = data?.map(item => item.article_id) || [];
      return EDUCATIONAL_ARTICLES.filter(article => 
        bookmarkedIds.includes(article.id)
      );
    } catch (error) {
      console.error('Error fetching bookmarked articles:', error);
      return [];
    }
  }

  // Get reading statistics
  static async getReadingStats(userId: string): Promise<{
    totalArticlesRead: number;
    totalTimeSpent: number;
    completedArticles: number;
    bookmarkedArticles: number;
    favoriteCategory: string | null;
  }> {
    try {
      const progress = await this.getUserProgress(userId);
      
      const totalArticlesRead = progress.length;
      const totalTimeSpent = progress.reduce((sum, p) => sum + p.timeSpent, 0);
      const completedArticles = progress.filter(p => p.completed).length;
      const bookmarkedArticles = progress.filter(p => p.bookmarked).length;

      // Calculate favorite category
      const categoryCount: Record<string, number> = {};
      for (const p of progress) {
        const article = EDUCATIONAL_ARTICLES.find(a => a.id === p.articleId);
        if (article) {
          categoryCount[article.category] = (categoryCount[article.category] || 0) + 1;
        }
      }

      const favoriteCategory = Object.keys(categoryCount).length > 0
        ? Object.keys(categoryCount).reduce((a, b) => 
            categoryCount[a] > categoryCount[b] ? a : b
          )
        : null;

      return {
        totalArticlesRead,
        totalTimeSpent,
        completedArticles,
        bookmarkedArticles,
        favoriteCategory
      };
    } catch (error) {
      console.error('Error fetching reading stats:', error);
      return {
        totalArticlesRead: 0,
        totalTimeSpent: 0,
        completedArticles: 0,
        bookmarkedArticles: 0,
        favoriteCategory: null
      };
    }
  }
}