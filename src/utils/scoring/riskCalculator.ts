import type { 
  TestType, 
  ScoringContext, 
  RiskAssessment,
  AssessmentResult
} from '../../types/assessment';

// Export enums for tests
export enum RiskLevel {
  LOW = 'low',
  MODERATE = 'moderate',
  HIGH = 'high'
}

export enum AssessmentType {
  MOCA = 'moca',
  PHQ9 = 'phq9',
  MMSE = 'mmse',
  AD8 = 'ad8',
  PARKINSONS = 'parkinsons'
}

// Export function for tests
export function calculateRisk(
  testType: TestType,
  score: number,
  demographics: { age: number; education: number }
): RiskAssessment {
  // Simple implementation for tests
  let riskLevel: RiskLevel;
  let riskPercentage: number;
  
  if (testType === 'moca') {
    if (score >= 26) {
      riskLevel = RiskLevel.LOW;
      riskPercentage = 2;
    } else if (score >= 20) {
      riskLevel = RiskLevel.MODERATE;
      riskPercentage = 15;
    } else {
      riskLevel = RiskLevel.HIGH;
      riskPercentage = 60;
    }
  } else if (testType === 'phq9') {
    if (score <= 4) {
      riskLevel = RiskLevel.LOW;
      riskPercentage = 5;
    } else if (score <= 14) {
      riskLevel = RiskLevel.MODERATE;
      riskPercentage = 25;
    } else {
      riskLevel = RiskLevel.HIGH;
      riskPercentage = 70;
    }
  } else {
    riskLevel = RiskLevel.LOW;
    riskPercentage = 5;
  }
  
  // Apply age adjustment
  if (demographics.age > 65) {
    riskPercentage += 5;
  }
  
  // Apply education adjustment
  if (demographics.education < 12) {
    riskPercentage += 3;
  }
  
  return {
    testType,
    riskCategory: riskLevel,
    riskLevel: riskLevel, // Add this for backward compatibility
    riskScore: score,
    riskPercentage,
    confidenceInterval: { lower: riskPercentage - 5, upper: riskPercentage + 5 },
    factors: demographics.age > 65 ? ['age'] : []
  };
}

/**
 * Advanced risk calculation engine with demographic adjustments
 */
export class RiskCalculator {
  /**
   * Apply demographic adjustments to risk assessment
   */
  static applyDemographicAdjustments(
    riskAssessment: RiskAssessment,
    context: ScoringContext
  ): RiskAssessment {
    let adjustedRiskPercentage = riskAssessment.riskPercentage;
    const adjustmentFactors = [];

    // Age adjustments
    const ageAdjustment = this.calculateAgeAdjustment(riskAssessment.testType, context.userProfile.age);
    if (ageAdjustment !== 0) {
      adjustedRiskPercentage += ageAdjustment;
      adjustmentFactors.push({
        factor: 'edad',
        adjustment: ageAdjustment,
        description: `Ajuste por edad: ${ageAdjustment > 0 ? '+' : ''}${ageAdjustment}%`
      });
    }

    // Education adjustments
    const educationAdjustment = this.calculateEducationAdjustment(
      riskAssessment.testType, 
      context.userProfile.educationLevel
    );
    if (educationAdjustment !== 0) {
      adjustedRiskPercentage += educationAdjustment;
      adjustmentFactors.push({
        factor: 'educación',
        adjustment: educationAdjustment,
        description: `Ajuste por nivel educativo: ${educationAdjustment > 0 ? '+' : ''}${educationAdjustment}%`
      });
    }

    // Gender adjustments (where applicable)
    const genderAdjustment = this.calculateGenderAdjustment(
      riskAssessment.testType, 
      context.userProfile.gender
    );
    if (genderAdjustment !== 0) {
      adjustedRiskPercentage += genderAdjustment;
      adjustmentFactors.push({
        factor: 'sexo',
        adjustment: genderAdjustment,
        description: `Ajuste por sexo: ${genderAdjustment > 0 ? '+' : ''}${genderAdjustment}%`
      });
    }

    // Ensure risk percentage stays within bounds
    adjustedRiskPercentage = Math.max(0, Math.min(100, adjustedRiskPercentage));

    // Recalculate risk category if needed
    const adjustedRiskCategory = this.determineRiskCategory(
      riskAssessment.testType,
      adjustedRiskPercentage
    );

    return {
      ...riskAssessment,
      riskPercentage: Math.round(adjustedRiskPercentage),
      riskCategory: adjustedRiskCategory,
      confidenceInterval: [
        Math.max(0, adjustedRiskPercentage - 10),
        Math.min(100, adjustedRiskPercentage + 10)
      ],
      metadata: {
        ...riskAssessment.metadata,
        demographicAdjustments: adjustmentFactors,
        originalRiskPercentage: riskAssessment.riskPercentage
      }
    };
  }

  /**
   * Calculate age-based risk adjustment
   */
  private static calculateAgeAdjustment(testType: TestType, age: number): number {
    switch (testType) {
      case 'moca':
      case 'mmse':
        // Cognitive tests: risk increases with age
        if (age >= 80) return 8;
        if (age >= 75) return 5;
        if (age >= 70) return 3;
        if (age >= 65) return 1;
        if (age < 50) return -2; // Lower risk for younger adults
        return 0;

      case 'ad8':
        // Dementia screening: significant age effect
        if (age >= 85) return 15;
        if (age >= 80) return 10;
        if (age >= 75) return 6;
        if (age >= 70) return 3;
        if (age < 60) return -5;
        return 0;

      case 'parkinsons':
        // Parkinson's: age-related but different pattern
        if (age >= 70) return 5;
        if (age >= 60) return 2;
        if (age < 40) return -3;
        return 0;

      case 'phq9':
        // Depression: complex age relationship
        if (age >= 75) return 2; // Elderly depression
        if (age <= 25) return 3; // Young adult depression
        return 0;

      default:
        return 0;
    }
  }

  /**
   * Calculate education-based risk adjustment
   */
  private static calculateEducationAdjustment(testType: TestType, educationLevel: number): number {
    switch (testType) {
      case 'moca':
      case 'mmse':
        // Cognitive tests: lower education increases apparent risk
        if (educationLevel <= 6) return 5;
        if (educationLevel <= 9) return 3;
        if (educationLevel <= 12) return 1;
        if (educationLevel >= 16) return -2;
        return 0;

      case 'ad8':
        // Dementia screening: education protective effect
        if (educationLevel <= 8) return 3;
        if (educationLevel >= 16) return -2;
        return 0;

      case 'parkinsons':
      case 'phq9':
        // Less education effect for these conditions
        return 0;

      default:
        return 0;
    }
  }

  /**
   * Calculate gender-based risk adjustment
   */
  private static calculateGenderAdjustment(testType: TestType, gender?: string): number {
    if (!gender) return 0;

    switch (testType) {
      case 'parkinsons':
        // Men have slightly higher risk
        return gender === 'male' ? 1 : 0;

      case 'phq9':
        // Women have higher depression rates
        return gender === 'female' ? 2 : 0;

      case 'moca':
      case 'mmse':
      case 'ad8':
        // Minimal gender differences for cognitive tests
        return 0;

      default:
        return 0;
    }
  }

  /**
   * Determine risk category based on adjusted percentage
   */
  private static determineRiskCategory(
    testType: TestType, 
    riskPercentage: number
  ): 'low' | 'moderate' | 'high' {
    // Standard thresholds - can be customized per test type
    const thresholds = this.getRiskThresholds(testType);
    
    if (riskPercentage <= thresholds.low) return 'low';
    if (riskPercentage <= thresholds.moderate) return 'moderate';
    return 'high';
  }

  /**
   * Get risk thresholds for each test type
   */
  private static getRiskThresholds(testType: TestType): { low: number; moderate: number } {
    switch (testType) {
      case 'moca':
      case 'mmse':
        return { low: 5, moderate: 40 };
      
      case 'ad8':
        return { low: 5, moderate: 40 };
      
      case 'parkinsons':
        return { low: 10, moderate: 50 };
      
      case 'phq9':
        return { low: 20, moderate: 40 };
      
      default:
        return { low: 5, moderate: 40 };
    }
  }

  /**
   * Calculate composite risk across multiple assessments
   */
  static calculateCompositeRisk(assessmentResults: AssessmentResult[]): {
    overallRisk: number;
    riskCategory: 'low' | 'moderate' | 'high';
    dominantFactors: string[];
    recommendations: string[];
  } {
    if (assessmentResults.length === 0) {
      return {
        overallRisk: 0,
        riskCategory: 'low',
        dominantFactors: [],
        recommendations: []
      };
    }

    // Weight different test types
    const testWeights = {
      moca: 0.25,
      mmse: 0.25,
      ad8: 0.20,
      parkinsons: 0.15,
      phq9: 0.15
    };

    let weightedRiskSum = 0;
    let totalWeight = 0;
    const dominantFactors: string[] = [];

    assessmentResults.forEach(result => {
      const weight = testWeights[result.testType] || 0.1;
      weightedRiskSum += result.riskAssessment.riskPercentage * weight;
      totalWeight += weight;

      // Collect high-impact factors
      if (result.riskAssessment.riskCategory === 'high') {
        dominantFactors.push(`${result.testType.toUpperCase()}: ${result.riskAssessment.riskPercentage}%`);
      }
    });

    const overallRisk = Math.round(weightedRiskSum / totalWeight);
    
    let riskCategory: 'low' | 'moderate' | 'high';
    if (overallRisk <= 15) riskCategory = 'low';
    else if (overallRisk <= 45) riskCategory = 'moderate';
    else riskCategory = 'high';

    const recommendations = this.generateCompositeRecommendations(
      riskCategory,
      assessmentResults
    );

    return {
      overallRisk,
      riskCategory,
      dominantFactors,
      recommendations
    };
  }

  /**
   * Generate recommendations based on composite risk
   */
  private static generateCompositeRecommendations(
    riskCategory: 'low' | 'moderate' | 'high',
    assessmentResults: AssessmentResult[]
  ): string[] {
    const recommendations: string[] = [];

    // Base recommendations by risk level
    switch (riskCategory) {
      case 'low':
        recommendations.push('Mantener estilo de vida saludable');
        recommendations.push('Ejercicio regular y dieta balanceada');
        recommendations.push('Actividades cognitivamente estimulantes');
        break;
      
      case 'moderate':
        recommendations.push('Consulta con médico de atención primaria');
        recommendations.push('Evaluación neuropsicológica recomendada');
        recommendations.push('Monitoreo regular cada 6 meses');
        recommendations.push('Intervenciones de estilo de vida intensificadas');
        break;
      
      case 'high':
        recommendations.push('Consulta urgente con especialista');
        recommendations.push('Evaluación neurológica completa');
        recommendations.push('Estudios de neuroimagen si están indicados');
        recommendations.push('Seguimiento médico estrecho');
        break;
    }

    // Add specific recommendations based on test results
    const hasDepressionRisk = assessmentResults.some(r => 
      r.testType === 'phq9' && r.riskAssessment.riskCategory !== 'low'
    );
    if (hasDepressionRisk) {
      recommendations.push('Evaluación de salud mental recomendada');
    }

    const hasParkinsonsRisk = assessmentResults.some(r => 
      r.testType === 'parkinsons' && r.riskAssessment.riskCategory === 'high'
    );
    if (hasParkinsonsRisk) {
      recommendations.push('Consulta con neurólogo especialista en trastornos del movimiento');
    }

    return recommendations;
  }

  /**
   * Calculate confidence intervals with demographic considerations
   */
  static calculateConfidenceInterval(
    riskPercentage: number,
    testType: TestType,
    context: ScoringContext
  ): [number, number] {
    // Base confidence interval width
    let intervalWidth = 10;

    // Adjust based on test reliability and demographic factors
    switch (testType) {
      case 'moca':
      case 'mmse':
        intervalWidth = 8; // More reliable cognitive tests
        break;
      case 'ad8':
        intervalWidth = 12; // Screening tool, less precise
        break;
      case 'parkinsons':
        intervalWidth = 15; // Symptom-based, more variable
        break;
      case 'phq9':
        intervalWidth = 8; // Well-validated depression scale
        break;
    }

    // Widen interval for extreme ages or education levels
    if (context.userProfile.age < 40 || context.userProfile.age > 80) {
      intervalWidth += 3;
    }
    if (context.userProfile.educationLevel < 8 || context.userProfile.educationLevel > 18) {
      intervalWidth += 2;
    }

    const lowerBound = Math.max(0, riskPercentage - intervalWidth);
    const upperBound = Math.min(100, riskPercentage + intervalWidth);

    return [lowerBound, upperBound];
  }
}