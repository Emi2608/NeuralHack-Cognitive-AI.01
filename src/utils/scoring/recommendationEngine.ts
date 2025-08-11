import type { 
  Recommendation, 
  AssessmentResult, 
  RiskCategory,
  TestType
} from '../../types/assessment';
import type { UserProfile } from '../../types/user';

export class RecommendationEngine {
  /**
   * Generate personalized recommendations based on assessment results
   */
  static generatePersonalizedRecommendations(
    result: AssessmentResult,
    userProfile: UserProfile
  ): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // Check for emergency situations first
    if (this.isEmergencyCase(result)) {
      recommendations.push(...this.getEmergencyRecommendations(result));
    }

    // Add test-specific recommendations
    switch (result.testType) {
      case 'moca':
        recommendations.push(...this.getMoCARecommendations(result));
        break;
      case 'phq9':
        recommendations.push(...this.getPHQ9Recommendations(result));
        break;
      case 'mmse':
        recommendations.push(...this.getMMSERecommendations(result));
        break;
      case 'ad8':
        recommendations.push(...this.getAD8Recommendations(result));
        break;
      case 'parkinsons':
        recommendations.push(...this.getParkinsonsRecommendations(result));
        break;
    }

    // Add general lifestyle recommendations
    recommendations.push(...this.getGeneralRecommendations(result, userProfile));

    // Sort by priority and remove duplicates
    return this.prioritizeAndDeduplicateRecommendations(recommendations);
  }

  /**
   * Check if this is an emergency case requiring immediate attention
   */
  private static isEmergencyCase(result: AssessmentResult): boolean {
    // PHQ-9 suicide risk
    if (result.testType === 'phq9' && result.responses) {
      const suicideQuestion = result.responses.find(r => r.questionId === 'phq9_q9');
      if (suicideQuestion && typeof suicideQuestion.answer === 'number' && suicideQuestion.answer > 0) {
        return true;
      }
    }

    // Severe cognitive impairment
    if (result.testType === 'mmse' && result.totalScore < 10) {
      return true;
    }

    // High risk with multiple factors
    if (result.riskAssessment.riskCategory === 'high' && 
        result.riskAssessment.factors && 
        result.riskAssessment.factors.length >= 3) {
      return true;
    }

    return false;
  }

  /**
   * Get emergency recommendations
   */
  private static getEmergencyRecommendations(result: AssessmentResult): Recommendation[] {
    return [
      {
        id: 'emergency_medical_attention',
        testType: result.testType,
        riskLevel: result.riskAssessment.riskCategory,
        type: 'medical',
        category: 'immediate',
        title: 'Atención Médica Inmediata',
        description: 'Busque atención médica inmediata debido a riesgo elevado.',
        priority: 'urgent',
        actionSteps: [
          'Contactar servicios de emergencia',
          'Acudir al hospital más cercano',
          'No quedarse solo'
        ],
        followUpDays: 1,
        metadata: {}
      }
    ];
  }

  /**
   * Generate MoCA-specific recommendations
   */
  private static getMoCARecommendations(result: AssessmentResult): Recommendation[] {
    const recommendations: Recommendation[] = [];
    const score = result.totalScore;

    if (score < 18) {
      recommendations.push({
        id: 'moca_neuroimaging',
        testType: result.testType,
        riskLevel: result.riskAssessment.riskCategory,
        type: 'medical',
        category: 'short_term',
        title: 'Evaluación de Neuroimagen',
        description: 'Considerar estudios de imagen cerebral (RM o TC) para evaluar cambios estructurales.',
        priority: 'high',
        actionSteps: [
          'Solicitar referencia a neurología',
          'Programar resonancia magnética cerebral',
          'Evaluar resultados con especialista'
        ],
        followUpDays: 30,
        metadata: {}
      });
    }

    return recommendations;
  }

  /**
   * Generate PHQ-9 specific recommendations
   */
  private static getPHQ9Recommendations(result: AssessmentResult): Recommendation[] {
    const recommendations: Recommendation[] = [];
    const score = result.totalScore;

    if (score >= 15) {
      recommendations.push({
        id: 'phq9_psychiatric_care',
        testType: result.testType,
        riskLevel: result.riskAssessment.riskCategory,
        type: 'medical',
        category: 'immediate',
        title: 'Atención Psiquiátrica Urgente',
        description: 'Evaluación psiquiátrica inmediata para depresión severa.',
        priority: 'urgent',
        actionSteps: [
          'Contactar servicio de salud mental inmediatamente',
          'Programar evaluación psiquiátrica en 48 horas',
          'Considerar hospitalización si hay riesgo'
        ],
        followUpDays: 2,
        metadata: {}
      });
    }

    return recommendations;
  }

  /**
   * Generate MMSE-specific recommendations
   */
  private static getMMSERecommendations(result: AssessmentResult): Recommendation[] {
    const recommendations: Recommendation[] = [];
    const score = result.totalScore;

    if (score < 10) {
      recommendations.push({
        id: 'mmse_severe_impairment',
        testType: result.testType,
        riskLevel: result.riskAssessment.riskCategory,
        type: 'medical',
        category: 'immediate',
        title: 'Evaluación Neurológica Urgente',
        description: 'Deterioro cognitivo severo requiere evaluación neurológica inmediata.',
        priority: 'urgent',
        actionSteps: [
          'Contactar neurólogo inmediatamente',
          'Programar evaluación completa',
          'Considerar estudios de imagen'
        ],
        followUpDays: 2,
        metadata: {}
      });
    }

    return recommendations;
  }

  /**
   * Generate AD8-specific recommendations
   */
  private static getAD8Recommendations(result: AssessmentResult): Recommendation[] {
    const recommendations: Recommendation[] = [];
    const score = result.totalScore;

    if (score >= 2) {
      recommendations.push({
        id: 'ad8_dementia_evaluation',
        testType: result.testType,
        riskLevel: result.riskAssessment.riskCategory,
        type: 'medical',
        category: 'immediate',
        title: 'Evaluación de Demencia',
        description: 'Puntuación sugiere posible demencia, requiere evaluación especializada.',
        priority: 'urgent',
        actionSteps: [
          'Programar evaluación neurológica',
          'Realizar pruebas cognitivas adicionales',
          'Evaluar capacidad funcional'
        ],
        followUpDays: 14,
        metadata: {}
      });
    }

    return recommendations;
  }

  /**
   * Generate Parkinson's-specific recommendations
   */
  private static getParkinsonsRecommendations(result: AssessmentResult): Recommendation[] {
    const recommendations: Recommendation[] = [];
    const score = result.totalScore;

    if (score >= 3) {
      recommendations.push({
        id: 'parkinsons_neurology_consultation',
        testType: result.testType,
        riskLevel: result.riskAssessment.riskCategory,
        type: 'medical',
        category: 'immediate',
        title: 'Consulta Neurológica',
        description: 'Síntomas sugieren posible enfermedad de Parkinson.',
        priority: 'urgent',
        actionSteps: [
          'Programar consulta con neurólogo especialista en movimiento',
          'Realizar evaluación clínica completa',
          'Considerar estudios de imagen especializados'
        ],
        followUpDays: 14,
        metadata: {}
      });
    }

    return recommendations;
  }

  /**
   * Generate general lifestyle recommendations
   */
  private static getGeneralRecommendations(result: AssessmentResult, userProfile: UserProfile): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // Exercise recommendation
    recommendations.push({
      id: 'lifestyle_exercise',
      testType: result.testType,
      riskLevel: result.riskAssessment.riskCategory,
      type: 'lifestyle',
      category: 'long_term',
      title: 'Programa de Ejercicio Regular',
      description: 'El ejercicio regular mejora la función cognitiva y reduce el riesgo de deterioro.',
      priority: result.riskAssessment.riskCategory === 'high' ? 'high' : 'medium',
      actionSteps: [
        'Comenzar con 30 minutos de caminata diaria',
        'Incluir ejercicios de resistencia 2-3 veces por semana',
        'Considerar actividades como yoga o tai chi'
      ],
      followUpDays: 30,
      metadata: {}
    });

    return recommendations;
  }

  /**
   * Prioritize and remove duplicate recommendations
   */
  private static prioritizeAndDeduplicateRecommendations(recommendations: Recommendation[]): Recommendation[] {
    // Remove duplicates by ID
    const uniqueRecommendations = recommendations.filter((rec, index, self) => 
      index === self.findIndex(r => r.id === rec.id)
    );

    // Sort by priority
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    
    return uniqueRecommendations.sort((a, b) => {
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      // Secondary sort by follow-up days (sooner first)
      return a.followUpDays - b.followUpDays;
    });
  }

  /**
   * Get recommendations by priority level
   */
  static getRecommendationsByPriority(
    recommendations: Recommendation[], 
    minPriority: 'urgent' | 'high' | 'medium' | 'low' = 'low'
  ): Recommendation[] {
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    const minPriorityValue = priorityOrder[minPriority];
    
    return recommendations.filter(rec => 
      priorityOrder[rec.priority] <= minPriorityValue
    );
  }
}