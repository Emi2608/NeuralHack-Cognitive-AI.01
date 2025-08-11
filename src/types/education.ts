export interface EducationalArticle {
  id: string;
  title: string;
  summary: string;
  content: string;
  category: EducationCategory;
  tags: string[];
  readingTime: number; // in minutes
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  lastUpdated: Date;
  author?: string;
  sources: EducationalSource[];
  relatedArticles?: string[];
}

export interface EducationalSource {
  title: string;
  url: string;
  type: 'medical_journal' | 'government' | 'university' | 'medical_association' | 'research_paper';
  credibility: 'high' | 'medium' | 'low';
}

export type EducationCategory = 
  | 'alzheimer_prevention'
  | 'parkinson_prevention'
  | 'dementia_prevention'
  | 'depression_prevention'
  | 'lifestyle_factors'
  | 'nutrition'
  | 'exercise'
  | 'sleep'
  | 'cognitive_training'
  | 'risk_factors'
  | 'early_detection'
  | 'medical_resources';

export interface EducationProgress {
  userId: string;
  articleId: string;
  readAt: Date;
  timeSpent: number; // in seconds
  completed: boolean;
  bookmarked: boolean;
}

export interface EducationRecommendation {
  articleId: string;
  reason: string;
  priority: 'low' | 'medium' | 'high';
  basedOnRisk?: {
    testType: string;
    riskLevel: string;
  };
}