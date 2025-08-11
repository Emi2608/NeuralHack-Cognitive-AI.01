import { supabase } from './supabase';
import { AssessmentService } from './assessment.service';
import { 
  LongitudinalData, 
  TrendAnalysis, 
  LongitudinalAlert, 
  ChangeDetection,
  ReminderSettings,
  LongitudinalStats
} from '../types/longitudinal';
import { AssessmentResult } from '../types/assessment';

export class LongitudinalService {
  // Significant change threshold (10% as per requirements)
  private static readonly SIGNIFICANT_CHANGE_THRESHOLD = 0.10;
  
  // Rapid decline threshold (>15% in <30 days)
  private static readonly RAPID_DECLINE_THRESHOLD = 0.15;
  private static readonly RAPID_DECLINE_DAYS = 30;

  /**
   * Analyze assessment results for significant changes
   */
  static async analyzeAssessmentChanges(
    userId: string, 
    newAssessment: AssessmentResult
  ): Promise<ChangeDetection[]> {
    try {
      const history = await AssessmentService.getAssessmentHistory(userId);
      const sameTypeAssessments = history
        .filter(a => a.testType === newAssessment.testType)
        .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());

      const changes: ChangeDetection[] = [];

      if (sameTypeAssessments.length === 0) {
        // First assessment of this type
        return changes;
      }

      const previousAssessment = sameTypeAssessments[0];
      const daysBetween = Math.floor(
        (new Date(newAssessment.completedAt).getTime() - 
         new Date(previousAssessment.completedAt).getTime()) / 
        (1000 * 60 * 60 * 24)
      );

      const changePercentage = this.calculateChangePercentage(
        previousAssessment.adjustedScore,
        newAssessment.adjustedScore
      );

      const isSignificant = Math.abs(changePercentage) >= this.SIGNIFICANT_CHANGE_THRESHOLD;
      
      let changeType: 'improvement' | 'decline' | 'stable';
      if (changePercentage > 0.05) {
        changeType = 'improvement';
      } else if (changePercentage < -0.05) {
        changeType = 'decline';
      } else {
        changeType = 'stable';
      }

      const change: ChangeDetection = {
        testType: newAssessment.testType,
        previousAssessment,
        currentAssessment: newAssessment,
        changePercentage,
        isSignificant,
        changeType,
        daysBetween
      };

      changes.push(change);

      // Generate alerts if significant changes detected
      if (isSignificant) {
        await this.generateChangeAlert(userId, change);
      }

      return changes;
    } catch (error) {
      console.error('Error analyzing assessment changes:', error);
      return [];
    }
  }

  /**
   * Generate trend analysis for user's assessment history
   */
  static async generateTrendAnalysis(
    userId: string, 
    testType?: string
  ): Promise<TrendAnalysis[]> {
    try {
      const history = await AssessmentService.getAssessmentHistory(userId);
      let assessments = history;

      if (testType) {
        assessments = history.filter(a => a.testType === testType);
      }

      if (assessments.length < 2) {
        return [];
      }

      const trends: TrendAnalysis[] = [];
      const testTypes = [...new Set(assessments.map(a => a.testType))];

      for (const type of testTypes) {
        const typeAssessments = assessments
          .filter(a => a.testType === type)
          .sort((a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime());

        if (typeAssessments.length < 2) continue;

        const timeframes: Array<'week' | 'month' | 'quarter' | 'year'> = 
          ['week', 'month', 'quarter', 'year'];

        for (const timeframe of timeframes) {
          const trend = this.calculateTrend(typeAssessments, timeframe);
          if (trend) {
            trends.push(trend);
          }
        }
      }

      return trends;
    } catch (error) {
      console.error('Error generating trend analysis:', error);
      return [];
    }
  }

  /**
   * Get longitudinal alerts for user
   */
  static async getLongitudinalAlerts(
    userId: string, 
    unacknowledgedOnly: boolean = false
  ): Promise<LongitudinalAlert[]> {
    try {
      let query = supabase
        .from('longitudinal_alerts')
        .select('*')
        .eq('user_id', userId)
        .order('triggered', { ascending: false });

      if (unacknowledgedOnly) {
        query = query.eq('acknowledged', false);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data?.map(this.mapAlertFromDB) || [];
    } catch (error) {
      console.error('Error fetching longitudinal alerts:', error);
      return [];
    }
  }

  /**
   * Acknowledge an alert
   */
  static async acknowledgeAlert(alertId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('longitudinal_alerts')
        .update({
          acknowledged: true,
          acknowledged_at: new Date().toISOString()
        })
        .eq('id', alertId);

      if (error) throw error;
    } catch (error) {
      console.error('Error acknowledging alert:', error);
      throw new Error('Failed to acknowledge alert');
    }
  }

  /**
   * Set up reminder settings for user
   */
  static async setReminderSettings(settings: ReminderSettings): Promise<void> {
    try {
      const { error } = await supabase
        .from('reminder_settings')
        .upsert({
          user_id: settings.userId,
          test_type: settings.testType,
          enabled: settings.enabled,
          frequency: settings.frequency,
          next_reminder: settings.nextReminder.toISOString(),
          last_reminder: settings.lastReminder?.toISOString(),
          custom_message: settings.customMessage
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error setting reminder settings:', error);
      throw new Error('Failed to update reminder settings');
    }
  }

  /**
   * Get reminder settings for user
   */
  static async getReminderSettings(userId: string): Promise<ReminderSettings[]> {
    try {
      const { data, error } = await supabase
        .from('reminder_settings')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;

      return data?.map(item => ({
        userId: item.user_id,
        testType: item.test_type,
        enabled: item.enabled,
        frequency: item.frequency,
        nextReminder: new Date(item.next_reminder),
        lastReminder: item.last_reminder ? new Date(item.last_reminder) : undefined,
        customMessage: item.custom_message
      })) || [];
    } catch (error) {
      console.error('Error fetching reminder settings:', error);
      return [];
    }
  }

  /**
   * Get longitudinal statistics for user
   */
  static async getLongitudinalStats(userId: string): Promise<LongitudinalStats | null> {
    try {
      const history = await AssessmentService.getAssessmentHistory(userId);
      
      if (history.length === 0) {
        return null;
      }

      const assessmentsByType: Record<string, number> = {};
      const riskProgression = { low: 0, moderate: 0, high: 0 };

      history.forEach(assessment => {
        assessmentsByType[assessment.testType] = 
          (assessmentsByType[assessment.testType] || 0) + 1;
        
        riskProgression[assessment.riskCategory]++;
      });

      // Calculate average interval between assessments
      const sortedHistory = history.sort((a, b) => 
        new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime()
      );

      let totalInterval = 0;
      for (let i = 1; i < sortedHistory.length; i++) {
        const interval = new Date(sortedHistory[i].completedAt).getTime() - 
                        new Date(sortedHistory[i-1].completedAt).getTime();
        totalInterval += interval;
      }

      const averageInterval = sortedHistory.length > 1 
        ? Math.floor(totalInterval / (sortedHistory.length - 1) / (1000 * 60 * 60 * 24))
        : 0;

      // Calculate streaks (assessments within expected intervals)
      const { longestStreak, currentStreak } = this.calculateStreaks(sortedHistory);

      // Determine overall trend
      const overallTrend = await this.calculateOverallTrend(userId);

      return {
        userId,
        totalAssessments: history.length,
        assessmentsByType,
        averageInterval,
        longestStreak,
        currentStreak,
        firstAssessment: new Date(sortedHistory[0].completedAt),
        lastAssessment: new Date(sortedHistory[sortedHistory.length - 1].completedAt),
        overallTrend,
        riskProgression
      };
    } catch (error) {
      console.error('Error calculating longitudinal stats:', error);
      return null;
    }
  }

  // Private helper methods

  private static calculateChangePercentage(oldScore: number, newScore: number): number {
    if (oldScore === 0) return 0;
    return (newScore - oldScore) / oldScore;
  }

  private static async generateChangeAlert(
    userId: string, 
    change: ChangeDetection
  ): Promise<void> {
    try {
      const changePercent = Math.abs(change.changePercentage * 100);
      const isRapidDecline = change.changeType === 'decline' && 
                            change.changePercentage <= -this.RAPID_DECLINE_THRESHOLD &&
                            change.daysBetween <= this.RAPID_DECLINE_DAYS;

      let alertType: LongitudinalAlert['alertType'];
      let severity: LongitudinalAlert['severity'];
      let title: string;
      let message: string;
      let recommendations: string[];

      if (isRapidDecline) {
        alertType = 'rapid_decline';
        severity = 'critical';
        title = 'Declive Rápido Detectado';
        message = `Se ha detectado un declive significativo del ${changePercent.toFixed(1)}% en tu evaluación ${change.testType.toUpperCase()} en solo ${change.daysBetween} días.`;
        recommendations = [
          'Consulta con un profesional de la salud inmediatamente',
          'Revisa factores que puedan estar afectando tu rendimiento',
          'Considera realizar una evaluación médica completa'
        ];
      } else if (change.changeType === 'decline') {
        alertType = 'significant_decline';
        severity = changePercent > 20 ? 'high' : 'medium';
        title = 'Cambio Significativo Detectado';
        message = `Tu puntuación en ${change.testType.toUpperCase()} ha disminuido un ${changePercent.toFixed(1)}% desde tu última evaluación.`;
        recommendations = [
          'Considera consultar con un profesional de la salud',
          'Revisa tu rutina de sueño, ejercicio y alimentación',
          'Realiza otra evaluación en 1-2 semanas para confirmar la tendencia'
        ];
      } else {
        alertType = 'improvement';
        severity = 'low';
        title = 'Mejora Detectada';
        message = `¡Excelente! Tu puntuación en ${change.testType.toUpperCase()} ha mejorado un ${changePercent.toFixed(1)}%.`;
        recommendations = [
          'Continúa con tus hábitos saludables actuales',
          'Mantén tu rutina de ejercicio y alimentación',
          'Sigue realizando evaluaciones regulares'
        ];
      }

      const alert: Omit<LongitudinalAlert, 'id'> = {
        userId,
        testType: change.testType,
        alertType,
        severity,
        title,
        message,
        recommendations,
        triggered: new Date(),
        acknowledged: false,
        metadata: {
          changePercentage: change.changePercentage,
          previousScore: change.previousAssessment.adjustedScore,
          currentScore: change.currentAssessment.adjustedScore,
          timeframe: `${change.daysBetween} días`
        }
      };

      await this.saveAlert(alert);
    } catch (error) {
      console.error('Error generating change alert:', error);
    }
  }

  private static async saveAlert(alert: Omit<LongitudinalAlert, 'id'>): Promise<void> {
    try {
      const { error } = await supabase
        .from('longitudinal_alerts')
        .insert({
          user_id: alert.userId,
          test_type: alert.testType,
          alert_type: alert.alertType,
          severity: alert.severity,
          title: alert.title,
          message: alert.message,
          recommendations: alert.recommendations,
          triggered: alert.triggered.toISOString(),
          acknowledged: alert.acknowledged,
          metadata: alert.metadata
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving alert:', error);
    }
  }

  private static calculateTrend(
    assessments: AssessmentResult[], 
    timeframe: 'week' | 'month' | 'quarter' | 'year'
  ): TrendAnalysis | null {
    const now = new Date();
    const timeframeDays = {
      week: 7,
      month: 30,
      quarter: 90,
      year: 365
    };

    const cutoffDate = new Date(now.getTime() - timeframeDays[timeframe] * 24 * 60 * 60 * 1000);
    const recentAssessments = assessments.filter(a => 
      new Date(a.completedAt) >= cutoffDate
    );

    if (recentAssessments.length < 2) {
      return null;
    }

    const scores = recentAssessments.map(a => a.adjustedScore);
    const firstScore = scores[0];
    const lastScore = scores[scores.length - 1];
    
    const changePercentage = this.calculateChangePercentage(firstScore, lastScore);
    
    let direction: TrendAnalysis['direction'];
    if (changePercentage > 0.05) {
      direction = 'improving';
    } else if (changePercentage < -0.05) {
      direction = 'declining';
    } else {
      direction = 'stable';
    }

    let significance: TrendAnalysis['significance'];
    const absChange = Math.abs(changePercentage);
    if (absChange >= 0.20) {
      significance = 'significant';
    } else if (absChange >= 0.15) {
      significance = 'moderate';
    } else if (absChange >= 0.10) {
      significance = 'mild';
    } else {
      significance = 'not_significant';
    }

    // Calculate confidence based on number of data points and consistency
    const confidence = Math.min(0.9, 0.3 + (recentAssessments.length * 0.1));

    return {
      testType: assessments[0].testType,
      timeframe,
      direction,
      changePercentage,
      significance,
      dataPoints: recentAssessments.length,
      startDate: new Date(recentAssessments[0].completedAt),
      endDate: new Date(recentAssessments[recentAssessments.length - 1].completedAt),
      confidence
    };
  }

  private static calculateStreaks(sortedHistory: AssessmentResult[]): {
    longestStreak: number;
    currentStreak: number;
  } {
    // Simple implementation - count consecutive assessments within reasonable intervals
    let longestStreak = 1;
    let currentStreak = 1;
    let tempStreak = 1;

    const maxInterval = 45 * 24 * 60 * 60 * 1000; // 45 days in milliseconds

    for (let i = 1; i < sortedHistory.length; i++) {
      const interval = new Date(sortedHistory[i].completedAt).getTime() - 
                      new Date(sortedHistory[i-1].completedAt).getTime();
      
      if (interval <= maxInterval) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }

    longestStreak = Math.max(longestStreak, tempStreak);

    // Calculate current streak from the end
    const now = new Date().getTime();
    const lastAssessment = new Date(sortedHistory[sortedHistory.length - 1].completedAt).getTime();
    
    if (now - lastAssessment <= maxInterval) {
      // Still in streak
      for (let i = sortedHistory.length - 2; i >= 0; i--) {
        const interval = new Date(sortedHistory[i + 1].completedAt).getTime() - 
                        new Date(sortedHistory[i].completedAt).getTime();
        
        if (interval <= maxInterval) {
          currentStreak++;
        } else {
          break;
        }
      }
    } else {
      currentStreak = 0;
    }

    return { longestStreak, currentStreak };
  }

  private static async calculateOverallTrend(userId: string): Promise<'improving' | 'stable' | 'declining'> {
    try {
      const trends = await this.generateTrendAnalysis(userId);
      const recentTrends = trends.filter(t => t.timeframe === 'month' || t.timeframe === 'quarter');
      
      if (recentTrends.length === 0) {
        return 'stable';
      }

      const improvingCount = recentTrends.filter(t => t.direction === 'improving').length;
      const decliningCount = recentTrends.filter(t => t.direction === 'declining').length;
      
      if (improvingCount > decliningCount) {
        return 'improving';
      } else if (decliningCount > improvingCount) {
        return 'declining';
      } else {
        return 'stable';
      }
    } catch (error) {
      console.error('Error calculating overall trend:', error);
      return 'stable';
    }
  }

  private static mapAlertFromDB(dbAlert: any): LongitudinalAlert {
    return {
      id: dbAlert.id,
      userId: dbAlert.user_id,
      testType: dbAlert.test_type,
      alertType: dbAlert.alert_type,
      severity: dbAlert.severity,
      title: dbAlert.title,
      message: dbAlert.message,
      recommendations: dbAlert.recommendations,
      triggered: new Date(dbAlert.triggered),
      acknowledged: dbAlert.acknowledged,
      acknowledgedAt: dbAlert.acknowledged_at ? new Date(dbAlert.acknowledged_at) : undefined,
      metadata: dbAlert.metadata
    };
  }
}