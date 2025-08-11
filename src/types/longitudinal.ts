import { AssessmentResult } from './assessment';

export interface LongitudinalData {
  userId: string;
  testType: string;
  assessmentHistory: AssessmentResult[];
  trends: TrendAnalysis[];
  alerts: LongitudinalAlert[];
  lastAnalyzed: Date;
}

export interface TrendAnalysis {
  testType: string;
  timeframe: 'week' | 'month' | 'quarter' | 'year';
  direction: 'improving' | 'stable' | 'declining';
  changePercentage: number;
  significance: 'not_significant' | 'mild' | 'moderate' | 'significant';
  dataPoints: number;
  startDate: Date;
  endDate: Date;
  confidence: number; // 0-1
}

export interface LongitudinalAlert {
  id: string;
  userId: string;
  testType: string;
  alertType: 'significant_decline' | 'rapid_decline' | 'improvement' | 'reminder';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  recommendations: string[];
  triggered: Date;
  acknowledged: boolean;
  acknowledgedAt?: Date;
  metadata: {
    changePercentage?: number;
    previousScore?: number;
    currentScore?: number;
    timeframe?: string;
    threshold?: number;
  };
}

export interface ChangeDetection {
  testType: string;
  previousAssessment: AssessmentResult;
  currentAssessment: AssessmentResult;
  changePercentage: number;
  isSignificant: boolean;
  changeType: 'improvement' | 'decline' | 'stable';
  daysBetween: number;
}

export interface ReminderSettings {
  userId: string;
  testType: string;
  enabled: boolean;
  frequency: 'weekly' | 'biweekly' | 'monthly' | 'quarterly';
  nextReminder: Date;
  lastReminder?: Date;
  customMessage?: string;
}

export interface LongitudinalStats {
  userId: string;
  totalAssessments: number;
  assessmentsByType: Record<string, number>;
  averageInterval: number; // days between assessments
  longestStreak: number; // consecutive assessments
  currentStreak: number;
  firstAssessment: Date;
  lastAssessment: Date;
  overallTrend: 'improving' | 'stable' | 'declining';
  riskProgression: {
    low: number;
    moderate: number;
    high: number;
  };
}