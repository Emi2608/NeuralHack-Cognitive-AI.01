import type { 
  TestType, 
  ScoringContext, 
  TestResponse, 
  AssessmentResult,
  RiskAssessment,
  MoCAResult,
  PHQ9Result,
  DrawingData,
  DrawingAnalysis
} from '../../types/assessment';
import { getTestDefinition } from '../../constants/testDefinitions';
import { RiskCalculator } from './riskCalculator';

export class ScoringEngine {
  /**
   * Calculate the total score for an assessment session
   */
  static calculateScore(
    testType: TestType,
    responses: TestResponse[],
    context: ScoringContext
  ): AssessmentResult {
    try {
      getTestDefinition(testType);
    } catch (error) {
      throw new Error(`Scoring not implemented for test type: ${testType}`);
    }
    
    switch (testType) {
      case 'moca':
        return this.calculateMoCAScore(responses, context);
      case 'phq9':
        return this.calculatePHQ9Score(responses, context);
      case 'mmse':
        return this.calculateMMSEScore(responses, context);
      case 'ad8':
        return this.calculateAD8Score(responses, context);
      case 'parkinsons':
        return this.calculateParkinsonsScore(responses, context);
      default:
        throw new Error(`Scoring not implemented for test type: ${testType}`);
    }
  }

  /**
   * Calculate MoCA score with section breakdown
   */
  private static calculateMoCAScore(
    responses: TestResponse[],
    context: ScoringContext
  ): MoCAResult {
    const sectionScores = {
      visuospatial: 0,
      naming: 0,
      memory: 0,
      attention: 0,
      language: 0,
      abstraction: 0,
      delayed_recall: 0,
      orientation: 0
    };

    let rawScore = 0;

    // Calculate section scores
    responses.forEach(response => {
      const score = this.scoreResponse(response, context);
      rawScore += score;

      // Assign to appropriate section based on question ID
      if (response.questionId.includes('trail_making') || 
          response.questionId.includes('cube_copy') || 
          response.questionId.includes('clock_drawing')) {
        sectionScores.visuospatial += score;
      } else if (response.questionId.includes('naming')) {
        sectionScores.naming += score;
      } else if (response.questionId.includes('attention') || 
                 response.questionId.includes('digit_span') || 
                 response.questionId.includes('vigilance') || 
                 response.questionId.includes('serial_7s')) {
        sectionScores.attention += score;
      } else if (response.questionId.includes('sentence_repetition') || 
                 response.questionId.includes('verbal_fluency')) {
        sectionScores.language += score;
      } else if (response.questionId.includes('similarities')) {
        sectionScores.abstraction += score;
      } else if (response.questionId.includes('delayed_recall')) {
        sectionScores.delayed_recall += score;
      } else if (response.questionId.includes('date') || 
                 response.questionId.includes('month') || 
                 response.questionId.includes('year') || 
                 response.questionId.includes('day') || 
                 response.questionId.includes('place') || 
                 response.questionId.includes('city')) {
        sectionScores.orientation += score;
      }
    });

    // Apply education adjustment
    let adjustedScore = rawScore;
    if (context.userProfile.educationLevel <= 12) {
      adjustedScore += 1;
    }

    // Ensure score doesn't exceed maximum
    adjustedScore = Math.min(adjustedScore, 30);

    // Calculate risk assessment
    const baseRiskAssessment = this.calculateMoCARisk(adjustedScore, context);
    const riskAssessment = RiskCalculator.applyDemographicAdjustments(baseRiskAssessment, context);

    // Analyze drawings if present
    const drawingAnalysis = this.analyzeDrawings(responses);

    // Convert section scores object to array format
    const sectionScoresArray = [
      { sectionId: 'visuospatial', name: 'Visuoespacial', score: sectionScores.visuospatial, maxScore: 5, items: [] },
      { sectionId: 'naming', name: 'Denominación', score: sectionScores.naming, maxScore: 3, items: [] },
      { sectionId: 'memory', name: 'Memoria', score: sectionScores.memory, maxScore: 0, items: [] },
      { sectionId: 'attention', name: 'Atención', score: sectionScores.attention, maxScore: 6, items: [] },
      { sectionId: 'language', name: 'Lenguaje', score: sectionScores.language, maxScore: 3, items: [] },
      { sectionId: 'abstraction', name: 'Abstracción', score: sectionScores.abstraction, maxScore: 2, items: [] },
      { sectionId: 'delayed_recall', name: 'Recuerdo diferido', score: sectionScores.delayed_recall, maxScore: 5, items: [] },
      { sectionId: 'orientation', name: 'Orientación', score: sectionScores.orientation, maxScore: 6, items: [] }
    ];

    return {
      id: '', // Will be set by the calling function
      sessionId: '', // Will be set by the calling function
      testType: 'moca',
      totalScore: adjustedScore,
      maxScore: 30,
      rawScore,
      adjustedScore,
      sectionScores: sectionScoresArray,
      riskAssessment,
      riskPercentage: riskAssessment.riskPercentage,
      recommendations: [], // Will be generated separately
      completedAt: new Date().toISOString(),
      duration: 0, // Will be calculated separately
      completionTime: 0, // Will be calculated separately
      responses: [], // Will be set by the calling function
      metadata: {
        educationAdjustment: adjustedScore - rawScore,
        sectionBreakdown: sectionScores
      },
      mocaSectionScores: sectionScores,
      educationAdjustment: adjustedScore - rawScore,
      drawingAnalysis
    };
  }

  /**
   * Calculate PHQ-9 score
   */
  private static calculatePHQ9Score(
    responses: TestResponse[],
    context: ScoringContext
  ): PHQ9Result {
    let totalScore = 0;
    let suicidalIdeation = false;

    responses.forEach(response => {
      const score = this.scoreResponse(response, context);
      totalScore += score;

      // Check for suicidal ideation (question 9)
      if (response.questionId === 'phq9_q9' && typeof response.answer === 'number' && response.answer > 0) {
        suicidalIdeation = true;
      }
    });

    // Determine severity level
    let severityLevel: 'minimal' | 'mild' | 'moderate' | 'moderately_severe' | 'severe';
    if (totalScore <= 4) {
      severityLevel = 'minimal';
    } else if (totalScore <= 9) {
      severityLevel = 'mild';
    } else if (totalScore <= 14) {
      severityLevel = 'moderate';
    } else if (totalScore <= 19) {
      severityLevel = 'moderately_severe';
    } else {
      severityLevel = 'severe';
    }

    // Determine functional impairment
    let functionalImpairment: 'none' | 'mild' | 'moderate' | 'severe';
    if (totalScore <= 4) {
      functionalImpairment = 'none';
    } else if (totalScore <= 9) {
      functionalImpairment = 'mild';
    } else if (totalScore <= 14) {
      functionalImpairment = 'moderate';
    } else {
      functionalImpairment = 'severe';
    }

    // Calculate risk assessment
    const baseRiskAssessment = this.calculatePHQ9Risk(totalScore, context);
    const riskAssessment = RiskCalculator.applyDemographicAdjustments(baseRiskAssessment, context);

    return {
      id: '', // Will be set by the calling function
      sessionId: '', // Will be set by the calling function
      testType: 'phq9',
      totalScore: totalScore,
      maxScore: 27,
      rawScore: totalScore,
      adjustedScore: totalScore, // No adjustments for PHQ-9
      sectionScores: [], // PHQ-9 doesn't have sections
      riskAssessment,
      riskPercentage: riskAssessment.riskPercentage,
      recommendations: [], // Will be generated separately
      completedAt: new Date().toISOString(),
      duration: 0, // Will be calculated separately
      completionTime: 0, // Will be calculated separately
      responses: [], // Will be set by the calling function
      metadata: {
        severityLevel,
        suicidalIdeation,
        functionalImpairment
      },
      severityLevel,
      suicidalIdeation,
      functionalImpairment
    };
  }

  /**
   * Calculate MMSE score
   */
  private static calculateMMSEScore(
    responses: TestResponse[],
    context: ScoringContext
  ): AssessmentResult {
    const sectionScores = {
      orientation: 0,
      registration: 0,
      attention_calculation: 0,
      recall: 0,
      language: 0
    };

    let rawScore = 0;

    // Calculate section scores
    responses.forEach(response => {
      const score = this.scoreResponse(response, context);
      rawScore += score;

      // Assign to appropriate section based on question ID
      if (response.questionId.includes('mmse_year') || 
          response.questionId.includes('mmse_season') || 
          response.questionId.includes('mmse_date') || 
          response.questionId.includes('mmse_day') || 
          response.questionId.includes('mmse_month') ||
          response.questionId.includes('mmse_country') ||
          response.questionId.includes('mmse_state') ||
          response.questionId.includes('mmse_city') ||
          response.questionId.includes('mmse_hospital') ||
          response.questionId.includes('mmse_floor')) {
        sectionScores.orientation += score;
      } else if (response.questionId.includes('mmse_registration')) {
        sectionScores.registration += score;
      } else if (response.questionId.includes('mmse_serial_7s')) {
        sectionScores.attention_calculation += score;
      } else if (response.questionId.includes('mmse_recall')) {
        sectionScores.recall += score;
      } else if (response.questionId.includes('mmse_naming') || 
                 response.questionId.includes('mmse_repetition') ||
                 response.questionId.includes('mmse_three_stage') ||
                 response.questionId.includes('mmse_reading') ||
                 response.questionId.includes('mmse_writing') ||
                 response.questionId.includes('mmse_copying')) {
        sectionScores.language += score;
      }
    });

    // MMSE doesn't have education adjustments in the standard version
    const adjustedScore = Math.min(rawScore, 30);

    // Calculate risk assessment
    const baseRiskAssessment = this.calculateMMSERisk(adjustedScore, context);
    const riskAssessment = RiskCalculator.applyDemographicAdjustments(baseRiskAssessment, context);

    // Convert section scores to array format
    const sectionScoresArray = [
      { sectionId: 'orientation', name: 'Orientación', score: sectionScores.orientation, maxScore: 10, items: [] },
      { sectionId: 'registration', name: 'Registro', score: sectionScores.registration, maxScore: 3, items: [] },
      { sectionId: 'attention_calculation', name: 'Atención y Cálculo', score: sectionScores.attention_calculation, maxScore: 5, items: [] },
      { sectionId: 'recall', name: 'Recuerdo', score: sectionScores.recall, maxScore: 3, items: [] },
      { sectionId: 'language', name: 'Lenguaje', score: sectionScores.language, maxScore: 9, items: [] }
    ];

    return {
      id: '',
      sessionId: '',
      testType: 'mmse',
      totalScore: adjustedScore,
      maxScore: 30,
      rawScore,
      adjustedScore,
      sectionScores: sectionScoresArray,
      riskAssessment,
      riskPercentage: riskAssessment.riskPercentage,
      recommendations: [],
      completedAt: new Date().toISOString(),
      duration: 0,
      completionTime: 0,
      responses: [],
      metadata: {
        sectionBreakdown: sectionScores
      }
    };
  }

  /**
   * Calculate AD8 score
   */
  private static calculateAD8Score(
    responses: TestResponse[],
    context: ScoringContext
  ): AssessmentResult {
    let totalScore = 0;
    const domainScores = {
      executive_function: 0,
      memory: 0,
      behavioral: 0,
      orientation: 0,
      general_cognition: 0
    };

    responses.forEach(response => {
      const score = this.scoreResponse(response, context);
      totalScore += score;

      // Categorize by domain based on metadata
      const questionId = response.questionId;
      if (questionId === 'ad8_q1' || questionId === 'ad8_q4' || questionId === 'ad8_q6') {
        domainScores.executive_function += score;
      } else if (questionId === 'ad8_q3' || questionId === 'ad8_q7') {
        domainScores.memory += score;
      } else if (questionId === 'ad8_q2') {
        domainScores.behavioral += score;
      } else if (questionId === 'ad8_q5') {
        domainScores.orientation += score;
      } else if (questionId === 'ad8_q8') {
        domainScores.general_cognition += score;
      }
    });

    const adjustedScore = Math.min(totalScore, 8);

    // Calculate risk assessment
    const baseRiskAssessment = this.calculateAD8Risk(adjustedScore, context);
    const riskAssessment = RiskCalculator.applyDemographicAdjustments(baseRiskAssessment, context);

    // Convert domain scores to section scores array
    const sectionScoresArray = [
      { sectionId: 'executive_function', name: 'Función Ejecutiva', score: domainScores.executive_function, maxScore: 3, items: [] },
      { sectionId: 'memory', name: 'Memoria', score: domainScores.memory, maxScore: 2, items: [] },
      { sectionId: 'behavioral', name: 'Comportamental', score: domainScores.behavioral, maxScore: 1, items: [] },
      { sectionId: 'orientation', name: 'Orientación', score: domainScores.orientation, maxScore: 1, items: [] },
      { sectionId: 'general_cognition', name: 'Cognición General', score: domainScores.general_cognition, maxScore: 1, items: [] }
    ];

    return {
      id: '',
      sessionId: '',
      testType: 'ad8',
      totalScore: adjustedScore,
      maxScore: 8,
      rawScore: totalScore,
      adjustedScore,
      sectionScores: sectionScoresArray,
      riskAssessment,
      riskPercentage: riskAssessment.riskPercentage,
      recommendations: [],
      completedAt: new Date().toISOString(),
      duration: 0,
      completionTime: 0,
      responses: responses,
      metadata: {
        domainBreakdown: domainScores,
        positiveResponses: totalScore
      }
    };
  }

  /**
   * Calculate Parkinson's score with weighted sections
   */
  private static calculateParkinsonsScore(
    responses: TestResponse[],
    context: ScoringContext
  ): AssessmentResult {
    const sectionScores = {
      motor_symptoms: 0,
      non_motor_symptoms: 0,
      daily_activities: 0
    };

    let rawScore = 0;

    // Calculate section scores
    responses.forEach(response => {
      const score = this.scoreResponse(response, context);
      rawScore += score;

      // Assign to appropriate section based on question ID
      if (response.questionId.includes('parkinsons_tremor') || 
          response.questionId.includes('parkinsons_rigidity') || 
          response.questionId.includes('parkinsons_bradykinesia') || 
          response.questionId.includes('parkinsons_balance') || 
          response.questionId.includes('parkinsons_gait')) {
        sectionScores.motor_symptoms += score;
      } else if (response.questionId.includes('parkinsons_smell') || 
                 response.questionId.includes('parkinsons_sleep') ||
                 response.questionId.includes('parkinsons_constipation') ||
                 response.questionId.includes('parkinsons_mood')) {
        sectionScores.non_motor_symptoms += score;
      } else if (response.questionId.includes('parkinsons_handwriting') || 
                 response.questionId.includes('parkinsons_voice') ||
                 response.questionId.includes('parkinsons_facial')) {
        sectionScores.daily_activities += score;
      }
    });

    // Apply weighted scoring as defined in the test definition
    const weightedScore = (sectionScores.motor_symptoms * 2) + 
                         (sectionScores.non_motor_symptoms * 1.5) + 
                         (sectionScores.daily_activities * 1);

    const adjustedScore = Math.min(weightedScore, 44);

    // Calculate risk assessment
    const baseRiskAssessment = this.calculateParkinsonsRisk(adjustedScore, context);
    const riskAssessment = RiskCalculator.applyDemographicAdjustments(baseRiskAssessment, context);

    // Convert section scores to array format
    const sectionScoresArray = [
      { sectionId: 'motor_symptoms', name: 'Síntomas Motores', score: sectionScores.motor_symptoms, maxScore: 20, items: [] },
      { sectionId: 'non_motor_symptoms', name: 'Síntomas No Motores', score: sectionScores.non_motor_symptoms, maxScore: 16, items: [] },
      { sectionId: 'daily_activities', name: 'Actividades Diarias', score: sectionScores.daily_activities, maxScore: 8, items: [] }
    ];

    return {
      id: '',
      sessionId: '',
      testType: 'parkinsons',
      totalScore: adjustedScore,
      maxScore: 44,
      rawScore,
      adjustedScore,
      sectionScores: sectionScoresArray,
      riskAssessment,
      riskPercentage: riskAssessment.riskPercentage,
      recommendations: [],
      completedAt: new Date().toISOString(),
      duration: 0,
      completionTime: 0,
      responses: [],
      metadata: {
        sectionBreakdown: sectionScores,
        weightedScore: adjustedScore,
        motorSymptomScore: sectionScores.motor_symptoms,
        nonMotorSymptomScore: sectionScores.non_motor_symptoms,
        dailyActivitiesScore: sectionScores.daily_activities
      }
    };
  }

  /**
   * Score an individual response
   */
  private static scoreResponse(response: TestResponse, _context: ScoringContext): number {
    // This would be implemented based on the specific scoring rules for each question
    // For now, return a basic score based on the answer
    if (typeof response.answer === 'number') {
      return response.answer;
    }
    
    if (typeof response.answer === 'boolean') {
      return response.answer ? 1 : 0;
    }

    if (typeof response.answer === 'string') {
      // For text responses, this would involve more complex scoring logic
      // based on the specific question and expected answers
      return this.scoreTextResponse(response.questionId, response.answer);
    }

    return 0;
  }

  /**
   * Score text responses based on question-specific rules
   */
  private static scoreTextResponse(questionId: string, answer: string): number {
    const normalizedAnswer = answer.toLowerCase().trim();

    // MoCA naming questions
    if (questionId === 'moca_naming_lion') {
      return ['león', 'leon', 'leona'].includes(normalizedAnswer) ? 1 : 0;
    }
    if (questionId === 'moca_naming_rhino') {
      return ['rinoceronte', 'rino'].includes(normalizedAnswer) ? 1 : 0;
    }
    if (questionId === 'moca_naming_camel') {
      return ['camello', 'dromedario'].includes(normalizedAnswer) ? 1 : 0;
    }

    // MoCA abstraction questions
    if (questionId === 'moca_similarities_1') {
      const validAnswers = ['transporte', 'vehiculos', 'vehículos', 'medios de transporte', 'se mueven', 'para moverse'];
      return validAnswers.some(valid => normalizedAnswer.includes(valid)) ? 1 : 0;
    }
    if (questionId === 'moca_similarities_2') {
      const validAnswers = ['miden', 'instrumentos de medida', 'para medir', 'medición', 'herramientas de medida'];
      return validAnswers.some(valid => normalizedAnswer.includes(valid)) ? 1 : 0;
    }

    // MoCA orientation questions
    if (questionId.includes('moca_date') || questionId.includes('moca_month') || 
        questionId.includes('moca_year') || questionId.includes('moca_day')) {
      return this.scoreOrientationResponse(questionId, normalizedAnswer);
    }

    // MMSE naming questions
    if (questionId === 'mmse_naming_watch') {
      return ['reloj', 'reloj de pulsera', 'reloj de mano'].includes(normalizedAnswer) ? 1 : 0;
    }
    if (questionId === 'mmse_naming_pencil') {
      return ['lápiz', 'lapiz', 'pluma', 'bolígrafo', 'boligrafo'].includes(normalizedAnswer) ? 1 : 0;
    }

    // MMSE repetition
    if (questionId === 'mmse_repetition') {
      const validAnswers = ['ni sí, ni no, ni pero', 'ni si, ni no, ni pero', 'ni sí ni no ni pero', 'ni si ni no ni pero'];
      return validAnswers.includes(normalizedAnswer) ? 1 : 0;
    }

    // MMSE orientation questions
    if (questionId.includes('mmse_year') || questionId.includes('mmse_month') || 
        questionId.includes('mmse_date') || questionId.includes('mmse_day') ||
        questionId.includes('mmse_country') || questionId.includes('mmse_state') ||
        questionId.includes('mmse_city') || questionId.includes('mmse_hospital') ||
        questionId.includes('mmse_floor') || questionId.includes('mmse_season')) {
      return this.scoreMMSEOrientationResponse(questionId, normalizedAnswer);
    }

    // MMSE writing task
    if (questionId === 'mmse_writing') {
      // Basic validation: has words, ends with punctuation, makes sense
      if (normalizedAnswer.length > 5 && /[.!?]$/.test(normalizedAnswer)) {
        return 1;
      }
      return 0;
    }

    // Default: no score for unrecognized text responses
    return 0;
  }

  /**
   * Score orientation responses
   */
  private static scoreOrientationResponse(questionId: string, answer: string): number {
    const now = new Date();
    
    if (questionId === 'moca_date') {
      const today = now.getDate();
      const answerNum = parseInt(answer);
      return Math.abs(answerNum - today) <= 1 ? 1 : 0; // Allow 1 day tolerance
    }
    
    if (questionId === 'moca_month') {
      const currentMonth = now.getMonth() + 1;
      const monthNames = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
                         'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
      const answerNum = parseInt(answer);
      return (answerNum === currentMonth || monthNames[currentMonth - 1] === answer) ? 1 : 0;
    }
    
    if (questionId === 'moca_year') {
      const currentYear = now.getFullYear();
      const answerNum = parseInt(answer);
      return answerNum === currentYear ? 1 : 0;
    }
    
    if (questionId === 'moca_day') {
      const dayNames = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
      const currentDay = dayNames[now.getDay()];
      return answer === currentDay ? 1 : 0;
    }
    
    return 0;
  }

  /**
   * Calculate MoCA risk assessment
   */
  private static calculateMoCARisk(score: number, context: ScoringContext): RiskAssessment {
    let riskCategory: 'low' | 'moderate' | 'high';
    let riskPercentage: number;
    
    if (score >= 26) {
      riskCategory = 'low';
      riskPercentage = Math.max(0, 5 - (score - 26) * 1);
    } else if (score >= 18) {
      riskCategory = 'moderate';
      riskPercentage = 5 + ((25 - score) / 7) * 35; // Linear interpolation between 5% and 40%
    } else {
      riskCategory = 'high';
      riskPercentage = 40 + ((17 - score) / 17) * 60; // Linear interpolation between 40% and 100%
    }

    return {
      testType: 'moca',
      rawScore: score,
      adjustedScore: score,
      riskPercentage: Math.round(riskPercentage),
      riskCategory,
      confidenceInterval: RiskCalculator.calculateConfidenceInterval(riskPercentage, 'moca', context),
      factors: this.calculateMoCAFactors(score, context),
      calculatedAt: new Date(),
      algorithm: 'threshold_based'
    };
  }

  /**
   * Calculate PHQ-9 risk assessment
   */
  private static calculatePHQ9Risk(score: number, context: ScoringContext): RiskAssessment {
    let riskCategory: 'low' | 'moderate' | 'high';
    let riskPercentage: number;
    
    if (score <= 4) {
      riskCategory = 'low';
      riskPercentage = score * 1.25; // 0-5%
    } else if (score <= 9) {
      riskCategory = 'low';
      riskPercentage = 5 + ((score - 4) / 5) * 15; // 5-20%
    } else if (score <= 14) {
      riskCategory = 'moderate';
      riskPercentage = 20 + ((score - 9) / 5) * 20; // 20-40%
    } else if (score <= 19) {
      riskCategory = 'high';
      riskPercentage = 40 + ((score - 14) / 5) * 30; // 40-70%
    } else {
      riskCategory = 'high';
      riskPercentage = 70 + ((score - 19) / 8) * 30; // 70-100%
    }

    return {
      testType: 'phq9',
      rawScore: score,
      adjustedScore: score,
      riskPercentage: Math.round(riskPercentage),
      riskCategory,
      confidenceInterval: RiskCalculator.calculateConfidenceInterval(riskPercentage, 'phq9', context),
      factors: this.calculatePHQ9Factors(score, context),
      calculatedAt: new Date(),
      algorithm: 'severity_based'
    };
  }

  /**
   * Score MMSE orientation responses
   */
  private static scoreMMSEOrientationResponse(questionId: string, answer: string): number {
    const now = new Date();
    
    if (questionId === 'mmse_year') {
      const currentYear = now.getFullYear();
      const answerNum = parseInt(answer);
      return answerNum === currentYear ? 1 : 0;
    }
    
    if (questionId === 'mmse_season') {
      const month = now.getMonth();
      const seasons = {
        'primavera': [2, 3, 4], // March, April, May
        'verano': [5, 6, 7],    // June, July, August
        'otoño': [8, 9, 10],    // September, October, November
        'otono': [8, 9, 10],    // Alternative spelling
        'invierno': [11, 0, 1]  // December, January, February
      };
      
      for (const [season, months] of Object.entries(seasons)) {
        if (answer === season && months.includes(month)) {
          return 1;
        }
      }
      return 0;
    }
    
    if (questionId === 'mmse_date') {
      const today = now.getDate();
      const answerNum = parseInt(answer);
      return Math.abs(answerNum - today) <= 1 ? 1 : 0; // Allow 1 day tolerance
    }
    
    if (questionId === 'mmse_day') {
      const dayNames = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
      const currentDay = dayNames[now.getDay()];
      return answer === currentDay ? 1 : 0;
    }
    
    if (questionId === 'mmse_month') {
      const monthNames = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
                         'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
      const currentMonth = monthNames[now.getMonth()];
      return answer === currentMonth ? 1 : 0;
    }

    if (questionId === 'mmse_country') {
      return ['méxico', 'mexico', 'estados unidos mexicanos'].includes(answer) ? 1 : 0;
    }

    // For state, city, hospital, floor - accept any reasonable answer (would need more context in real implementation)
    if (questionId === 'mmse_state' || questionId === 'mmse_city' || 
        questionId === 'mmse_hospital' || questionId === 'mmse_floor') {
      return answer.length > 0 ? 1 : 0;
    }
    
    return 0;
  }

  /**
   * Calculate MMSE risk assessment
   */
  private static calculateMMSERisk(score: number, context: ScoringContext): RiskAssessment {
    let riskCategory: 'low' | 'moderate' | 'high';
    let riskPercentage: number;
    
    if (score >= 24) {
      riskCategory = 'low';
      riskPercentage = Math.max(0, 5 - (score - 24) * 1);
    } else if (score >= 18) {
      riskCategory = 'moderate';
      riskPercentage = 5 + ((23 - score) / 5) * 35; // Linear interpolation between 5% and 40%
    } else if (score >= 12) {
      riskCategory = 'high';
      riskPercentage = 40 + ((17 - score) / 5) * 30; // Linear interpolation between 40% and 70%
    } else {
      riskCategory = 'high';
      riskPercentage = 70 + ((11 - score) / 11) * 25; // Linear interpolation between 70% and 95%
    }

    return {
      testType: 'mmse',
      rawScore: score,
      adjustedScore: score,
      riskPercentage: Math.round(riskPercentage),
      riskCategory,
      confidenceInterval: RiskCalculator.calculateConfidenceInterval(riskPercentage, 'mmse', context),
      factors: this.calculateMMSEFactors(score, context),
      calculatedAt: new Date(),
      algorithm: 'threshold_based'
    };
  }

  /**
   * Calculate AD8 risk assessment
   */
  private static calculateAD8Risk(score: number, context: ScoringContext): RiskAssessment {
    let riskCategory: 'low' | 'moderate' | 'high';
    let riskPercentage: number;
    
    if (score <= 1) {
      riskCategory = 'low';
      riskPercentage = score * 2.5; // 0-5%
    } else if (score <= 3) {
      riskCategory = 'moderate';
      riskPercentage = 20 + ((score - 2) / 1) * 20; // 20-40%
    } else {
      riskCategory = 'high';
      riskPercentage = 40 + ((score - 4) / 4) * 40; // 40-80%
    }

    return {
      testType: 'ad8',
      rawScore: score,
      adjustedScore: score,
      riskPercentage: Math.round(riskPercentage),
      riskCategory,
      confidenceInterval: RiskCalculator.calculateConfidenceInterval(riskPercentage, 'ad8', context),
      factors: this.calculateAD8Factors(score, context),
      calculatedAt: new Date(),
      algorithm: 'threshold_based'
    };
  }

  /**
   * Calculate Parkinson's risk assessment with weighted scoring
   */
  private static calculateParkinsonsRisk(score: number, context: ScoringContext): RiskAssessment {
    let riskCategory: 'low' | 'moderate' | 'high';
    let riskPercentage: number;
    
    if (score <= 8) {
      riskCategory = 'low';
      riskPercentage = score * 1.25; // 0-10%
    } else if (score <= 18) {
      riskCategory = 'moderate';
      riskPercentage = 10 + ((score - 8) / 10) * 40; // 10-50%
    } else {
      riskCategory = 'high';
      riskPercentage = 50 + ((score - 18) / 26) * 40; // 50-90%
    }

    return {
      testType: 'parkinsons',
      rawScore: score,
      adjustedScore: score,
      riskPercentage: Math.round(riskPercentage),
      riskCategory,
      confidenceInterval: RiskCalculator.calculateConfidenceInterval(riskPercentage, 'parkinsons', context),
      factors: this.calculateParkinsonsFactors(score, context),
      calculatedAt: new Date(),
      algorithm: 'weighted_threshold'
    };
  }

  /**
   * Calculate risk factors for MoCA
   */
  private static calculateMoCAFactors(score: number, context: ScoringContext) {
    const factors = [];
    
    if (context.userProfile.age > 65) {
      factors.push({
        factor: 'edad avanzada',
        impact: 'negative' as const,
        weight: 0.2,
        description: 'La edad avanzada es un factor de riesgo para deterioro cognitivo'
      });
    }
    
    if (context.userProfile.educationLevel <= 12) {
      factors.push({
        factor: 'educación limitada',
        impact: 'negative' as const,
        weight: 0.15,
        description: 'Menor nivel educativo puede afectar el rendimiento en pruebas cognitivas'
      });
    }
    
    if (score < 26) {
      factors.push({
        factor: 'puntuación por debajo del punto de corte',
        impact: 'negative' as const,
        weight: 0.4,
        description: 'Puntuación sugiere posible deterioro cognitivo'
      });
    }
    
    return factors;
  }

  /**
   * Calculate risk factors for PHQ-9
   */
  private static calculatePHQ9Factors(score: number, context: ScoringContext) {
    const factors = [];
    
    if (score > 14) {
      factors.push({
        factor: 'Síntomas depresivos severos',
        impact: 'negative' as const,
        weight: 0.5,
        description: 'Puntuación indica depresión moderada a severa'
      });
    }
    
    if (context.userProfile.age < 30) {
      factors.push({
        factor: 'Edad joven',
        impact: 'negative' as const,
        weight: 0.1,
        description: 'Los adultos jóvenes pueden tener mayor riesgo de depresión'
      });
    }
    
    return factors;
  }

  /**
   * Calculate risk factors for MMSE
   */
  private static calculateMMSEFactors(score: number, context: ScoringContext) {
    const factors = [];
    
    if (context.userProfile.age > 75) {
      factors.push({
        factor: 'edad muy avanzada',
        impact: 'negative' as const,
        weight: 0.25,
        description: 'La edad muy avanzada incrementa significativamente el riesgo de deterioro cognitivo'
      });
    } else if (context.userProfile.age > 65) {
      factors.push({
        factor: 'edad avanzada',
        impact: 'negative' as const,
        weight: 0.15,
        description: 'La edad avanzada es un factor de riesgo para deterioro cognitivo'
      });
    }
    
    if (score < 24) {
      factors.push({
        factor: 'puntuación por debajo del punto de corte',
        impact: 'negative' as const,
        weight: 0.5,
        description: 'Puntuación sugiere deterioro cognitivo que requiere evaluación adicional'
      });
    }

    if (score < 12) {
      factors.push({
        factor: 'deterioro cognitivo severo',
        impact: 'negative' as const,
        weight: 0.7,
        description: 'Puntuación indica deterioro cognitivo severo que requiere atención inmediata'
      });
    }
    
    return factors;
  }

  /**
   * Calculate risk factors for AD8
   */
  private static calculateAD8Factors(score: number, context: ScoringContext) {
    const factors = [];
    
    if (score >= 2) {
      factors.push({
        factor: 'cambios cognitivos reportados',
        impact: 'negative' as const,
        weight: 0.4,
        description: 'Se reportan cambios en el funcionamiento cognitivo que requieren evaluación'
      });
    }

    if (score >= 4) {
      factors.push({
        factor: 'múltiples cambios cognitivos',
        impact: 'negative' as const,
        weight: 0.6,
        description: 'Múltiples cambios cognitivos sugieren posible demencia temprana'
      });
    }
    
    if (context.userProfile.age > 70) {
      factors.push({
        factor: 'edad de riesgo para demencia',
        impact: 'negative' as const,
        weight: 0.2,
        description: 'La edad avanzada incrementa el riesgo de demencia'
      });
    }

    // Family history would be added here if available in context
    
    return factors;
  }

  /**
   * Calculate risk factors for Parkinson's
   */
  private static calculateParkinsonsFactors(score: number, context: ScoringContext) {
    const factors = [];
    
    if (score > 18) {
      factors.push({
        factor: 'síntomas sugestivos de Parkinson',
        impact: 'negative' as const,
        weight: 0.6,
        description: 'Múltiples síntomas motores y no motores sugieren posible enfermedad de Parkinson'
      });
    } else if (score > 8) {
      factors.push({
        factor: 'síntomas parkinsonianos moderados',
        impact: 'negative' as const,
        weight: 0.3,
        description: 'Algunos síntomas presentes que requieren seguimiento'
      });
    }
    
    if (context.userProfile.age > 60) {
      factors.push({
        factor: 'edad de riesgo para Parkinson',
        impact: 'negative' as const,
        weight: 0.15,
        description: 'La incidencia de Parkinson aumenta con la edad'
      });
    }

    // Gender factor - men have slightly higher risk
    if (context.userProfile.gender === 'male') {
      factors.push({
        factor: 'sexo masculino',
        impact: 'negative' as const,
        weight: 0.05,
        description: 'Los hombres tienen un riesgo ligeramente mayor de desarrollar Parkinson'
      });
    }
    
    return factors;
  }

  /**
   * Analyze drawing data for MoCA
   */
  private static analyzeDrawings(responses: TestResponse[]): DrawingAnalysis | undefined {
    const clockDrawing = responses.find(r => r.questionId === 'moca_clock_drawing');
    const cubeDrawing = responses.find(r => r.questionId === 'moca_cube_copy');
    
    if (!clockDrawing && !cubeDrawing) {
      return undefined;
    }

    const analysis: DrawingAnalysis = {
      clockDrawing: {
        score: 0,
        features: []
      },
      cubeDrawing: {
        score: 0,
        features: []
      }
    };

    // Analyze clock drawing
    if (clockDrawing && typeof clockDrawing.answer === 'object' && 'strokes' in clockDrawing.answer) {
      const drawingData = clockDrawing.answer as DrawingData;
      analysis.clockDrawing = this.analyzeClockDrawing(drawingData);
    }

    // Analyze cube drawing
    if (cubeDrawing && typeof cubeDrawing.answer === 'object' && 'strokes' in cubeDrawing.answer) {
      const drawingData = cubeDrawing.answer as DrawingData;
      analysis.cubeDrawing = this.analyzeCubeDrawing(drawingData);
    }

    return analysis;
  }

  /**
   * Analyze clock drawing features
   */
  private static analyzeClockDrawing(drawingData: DrawingData) {
    // This is a simplified analysis - in a real implementation,
    // this would use computer vision or machine learning algorithms
    const features = [
      { feature: 'circle' as const, present: drawingData.strokes.length > 0, score: 1 },
      { feature: 'numbers' as const, present: drawingData.strokes.length > 5, score: 1 },
      { feature: 'hands' as const, present: drawingData.strokes.length > 10, score: 1 },
      { feature: 'time_accuracy' as const, present: drawingData.strokes.length > 12, score: 1 }
    ];

    const totalScore = features.reduce((sum, feature) => sum + (feature.present ? feature.score : 0), 0);

    return {
      score: Math.min(totalScore, 3), // Max 3 points for clock drawing
      features
    };
  }

  /**
   * Analyze cube drawing features
   */
  private static analyzeCubeDrawing(drawingData: DrawingData) {
    // This is a simplified analysis - in a real implementation,
    // this would use computer vision or machine learning algorithms
    const features = [
      { feature: '3d_perspective' as const, present: drawingData.strokes.length > 3, score: 1 },
      { feature: 'parallel_lines' as const, present: drawingData.strokes.length > 6, score: 0 },
      { feature: 'depth' as const, present: drawingData.strokes.length > 8, score: 0 },
      { feature: 'proportions' as const, present: drawingData.strokes.length > 10, score: 0 }
    ];

    const totalScore = features.reduce((sum, feature) => sum + (feature.present ? feature.score : 0), 0);

    return {
      score: Math.min(totalScore, 1), // Max 1 point for cube drawing
      features
    };
  }
}