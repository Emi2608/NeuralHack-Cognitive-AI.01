import type { 
  Recommendation, 
  AssessmentResult, 
  RiskCategory,
  MoCAResult,
  PHQ9Result
} from '../../types/assessment';
import type { UserProfile } from '../../types/user';
import { RecommendationDatabase } from './recommendationDatabase';

export class RecommendationEngine {
  /**
   * Generate personalized recommendations based on assessment results (Enhanced Version)
   */
  static generatePersonalizedRecommendations(
    result: AssessmentResult,
    userProfile: UserProfile
  ): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // Check for emergency situations first
    if (this.isEmergencyCase(result)) {
      recommendations.push(...RecommendationDatabase.getEmergencyRecommendations());
    }

    // Get structured recommendations from database
    const riskFactors = result.riskAssessment.factors?.map(f => f.factor) || [];
    const personalizedRecs = RecommendationDatabase.getPersonalizedRecommendations(
      result.testType,
      result.riskAssessment.riskCategory,
      userProfile.dateOfBirth ? new Date().getFullYear() - new Date(userProfile.dateOfBirth).getFullYear() : 50,
      riskFactors
    );
    recommendations.push(...personalizedRecs);

    // Add test-specific detailed recommendations
    recommendations.push(...this.generateDetailedRecommendations(result, userProfile));

    // Remove duplicates and sort by priority
    const uniqueRecommendations = this.removeDuplicates(recommendations);
    return uniqueRecommendations.sort((a, b) => this.getPriorityWeight(b.priority) - this.getPriorityWeight(a.priority));
  }

  /**
   * Generate personalized recommendations based on assessment results (Legacy Version)
   */
  static generateRecommendations(
    result: AssessmentResult,
    userProfile: UserProfile
  ): Recommendation[] {
    const recommendations: Recommendation[] = [];

    switch (result.testType) {
      case 'moca':
        recommendations.push(...this.generateMoCARecommendations(result as MoCAResult, userProfile));
        break;
      case 'phq9':
        recommendations.push(...this.generatePHQ9Recommendations(result as PHQ9Result, userProfile));
        break;
      case 'mmse':
        recommendations.push(...this.generateMMSERecommendations(result, userProfile));
        break;
      case 'ad8':
        recommendations.push(...this.generateAD8Recommendations(result, userProfile));
        break;
      case 'parkinsons':
        recommendations.push(...this.generateParkinsonsRecommendations(result, userProfile));
        break;
      default:
        recommendations.push(...this.generateGeneralRecommendations(result, userProfile));
    }

    // Add general lifestyle recommendations based on risk level
    recommendations.push(...this.generateLifestyleRecommendations(result.riskAssessment.riskCategory, userProfile));

    // Sort by priority and return
    return recommendations.sort((a, b) => this.getPriorityWeight(b.priority) - this.getPriorityWeight(a.priority));
  }

  /**
   * Check if this is an emergency case requiring immediate attention
   */
  private static isEmergencyCase(result: AssessmentResult): boolean {
    // PHQ-9 suicidal ideation
    if (result.testType === 'phq9') {
      const phq9Result = result as PHQ9Result;
      if (phq9Result.suicidalIdeation) {
        return true;
      }
    }

    // Severe cognitive impairment
    if (['moca', 'mmse'].includes(result.testType) && result.adjustedScore < 10) {
      return true;
    }

    // Very high risk in any assessment
    if (result.riskAssessment.riskPercentage > 90) {
      return true;
    }

    return false;
  }

  /**
   * Generate detailed test-specific recommendations
   */
  private static generateDetailedRecommendations(
    result: AssessmentResult,
    userProfile: UserProfile
  ): Recommendation[] {
    switch (result.testType) {
      case 'moca':
        return this.generateMoCARecommendations(result as MoCAResult, userProfile);
      case 'phq9':
        return this.generatePHQ9Recommendations(result as PHQ9Result, userProfile);
      case 'mmse':
        return this.generateMMSERecommendations(result, userProfile);
      case 'ad8':
        return this.generateAD8Recommendations(result, userProfile);
      case 'parkinsons':
        return this.generateParkinsonsRecommendations(result, userProfile);
      default:
        return this.generateGeneralRecommendations(result, userProfile);
    }
  }

  /**
   * Remove duplicate recommendations based on ID
   */
  private static removeDuplicates(recommendations: Recommendation[]): Recommendation[] {
    const seen = new Set<string>();
    return recommendations.filter(rec => {
      if (seen.has(rec.id)) {
        return false;
      }
      seen.add(rec.id);
      return true;
    });
  }

  /**
   * Generate MoCA-specific recommendations
   */
  private static generateMoCARecommendations(result: MoCAResult, _userProfile: UserProfile): Recommendation[] {
    const recommendations: Recommendation[] = [];
    const riskCategory = result.riskAssessment.riskCategory;

    if (riskCategory === 'high') {
      recommendations.push({
        testType: result.testType,
        riskLevel: result.riskAssessment.riskCategory,
        id: 'moca_urgent_consultation',
        type: 'medical',
        category: 'immediate',
        title: 'Consulta Neurológica Urgente',
        description: 'Su puntuación sugiere un posible deterioro cognitivo significativo. Es importante que consulte con un neurólogo lo antes posible.',
        priority: 'urgent',
        actionSteps: [
          'Solicite cita con neurólogo en las próximas 2 semanas',
          'Prepare lista de medicamentos actuales',
          'Anote cambios cognitivos que haya notado',
          'Considere llevar a un familiar a la consulta'
        ],
        resources: [
          {
            type: 'contact',
            title: 'Directorio de Neurólogos - IMSS',
            description: 'Encuentre neurólogos en su área'
          },
          {
            type: 'article',
            title: 'Qué esperar en una consulta neurológica',
            url: 'https://example.com/consulta-neurologica'
          }
        ],
        followUpDays: 14
      });

      recommendations.push({
        id: 'moca_neuroimaging',
        type: 'medical',
        category: 'short_term',
        title: 'Evaluación con Neuroimagen',
        description: 'Su médico podría recomendar estudios de imagen cerebral para evaluar posibles causas del deterioro cognitivo.',
        priority: 'high',
        actionSteps: [
          'Discuta con su neurólogo la necesidad de RM cerebral',
          'Pregunte sobre estudios de laboratorio',
          'Considere evaluación neuropsicológica completa'
        ],
        followUpDays: 30
      });
    }

    if (riskCategory === 'moderate') {
      recommendations.push({
        id: 'moca_specialist_evaluation',
        type: 'medical',
        category: 'short_term',
        title: 'Evaluación Especializada',
        description: 'Su puntuación sugiere posible deterioro cognitivo leve. Una evaluación más detallada puede ser beneficiosa.',
        priority: 'high',
        actionSteps: [
          'Consulte con su médico de cabecera',
          'Solicite referencia a neurología o geriatría',
          'Considere evaluación neuropsicológica',
          'Monitoree cambios cognitivos'
        ],
        followUpDays: 30
      });

      recommendations.push({
        id: 'moca_cognitive_monitoring',
        type: 'monitoring',
        category: 'long_term',
        title: 'Monitoreo Cognitivo Regular',
        description: 'Es importante realizar seguimiento regular de su función cognitiva.',
        priority: 'medium',
        actionSteps: [
          'Repita evaluación en 6 meses',
          'Mantenga diario de síntomas cognitivos',
          'Informe cambios a su médico',
          'Involucre a familiares en el monitoreo'
        ],
        followUpDays: 180
      });
    }

    // Section-specific recommendations
    const memorySection = result.sectionScores.find(s => s.sectionId === 'memory');
    if (memorySection && memorySection.score < 3) {
      recommendations.push({
        id: 'moca_memory_training',
        type: 'lifestyle',
        category: 'short_term',
        title: 'Entrenamiento de Memoria',
        description: 'Su puntuación en memoria puede beneficiarse de ejercicios específicos.',
        priority: 'medium',
        actionSteps: [
          'Practique técnicas de memorización',
          'Use recordatorios y listas',
          'Realice ejercicios de memoria diarios',
          'Considere aplicaciones de entrenamiento cognitivo'
        ],
        resources: [
          {
            type: 'app',
            title: 'Lumosity - Entrenamiento Cerebral',
            description: 'Aplicación con ejercicios de memoria'
          }
        ],
        followUpDays: 30
      });
    }

    const attentionSection = result.sectionScores.find(s => s.sectionId === 'attention');
    if (attentionSection && attentionSection.score < 4) {
      recommendations.push({
        id: 'moca_attention_exercises',
        type: 'lifestyle',
        category: 'short_term',
        title: 'Ejercicios de Atención',
        description: 'Mejore su capacidad de atención con ejercicios específicos.',
        priority: 'medium',
        actionSteps: [
          'Practique meditación mindfulness',
          'Realice ejercicios de concentración',
          'Limite distracciones durante tareas importantes',
          'Practique sudoku o crucigramas'
        ],
        followUpDays: 30
      });
    }

    return recommendations;
  }

  /**
   * Generate PHQ-9 specific recommendations
   */
  private static generatePHQ9Recommendations(result: PHQ9Result, _userProfile: UserProfile): Recommendation[] {
    const recommendations: Recommendation[] = [];
    const riskCategory = result.riskAssessment.riskCategory;

    // Handle suicidal ideation with highest priority
    if (result.suicidalIdeation) {
      recommendations.push({
        id: 'phq9_suicide_risk',
        type: 'medical',
        category: 'immediate',
        title: 'Atención Inmediata Requerida',
        description: 'Ha indicado pensamientos de autolesión. Es crucial que busque ayuda profesional inmediatamente.',
        priority: 'urgent',
        actionSteps: [
          'Contacte línea de crisis suicida: 800-290-0024',
          'Vaya a urgencias si tiene pensamientos activos de suicidio',
          'No se quede solo, busque apoyo de familiares',
          'Contacte a su médico inmediatamente'
        ],
        resources: [
          {
            type: 'contact',
            title: 'Línea Nacional de Prevención del Suicidio',
            description: '800-290-0024 - Disponible 24/7'
          },
          {
            type: 'website',
            title: 'Centro de Atención Ciudadana',
            url: 'https://www.gob.mx/salud/acciones-y-programas/centro-de-atencion-ciudadana'
          }
        ],
        followUpDays: 1
      });
    }

    if (riskCategory === 'high' && result.severityLevel === 'severe') {
      recommendations.push({
        id: 'phq9_psychiatric_care',
        type: 'medical',
        category: 'immediate',
        title: 'Atención Psiquiátrica Especializada',
        description: 'Su nivel de depresión requiere atención profesional especializada inmediata.',
        priority: 'urgent',
        actionSteps: [
          'Consulte con psiquiatra en las próximas 48 horas',
          'Considere hospitalización si es necesario',
          'Inicie tratamiento farmacológico si se recomienda',
          'Establezca red de apoyo familiar'
        ],
        followUpDays: 2
      });
    }

    if (riskCategory === 'high' || riskCategory === 'moderate') {
      recommendations.push({
        id: 'phq9_psychotherapy',
        type: 'medical',
        category: 'short_term',
        title: 'Terapia Psicológica',
        description: 'La terapia psicológica puede ser muy efectiva para tratar la depresión.',
        priority: 'high',
        actionSteps: [
          'Busque psicólogo clínico especializado en depresión',
          'Considere terapia cognitivo-conductual',
          'Mantenga citas regulares de terapia',
          'Practique técnicas aprendidas en terapia'
        ],
        resources: [
          {
            type: 'article',
            title: 'Guía de Terapia Cognitivo-Conductual',
            url: 'https://example.com/terapia-cbt'
          }
        ],
        followUpDays: 14
      });

      recommendations.push({
        id: 'phq9_medication_evaluation',
        type: 'medical',
        category: 'short_term',
        title: 'Evaluación Farmacológica',
        description: 'Su médico podría considerar medicación antidepresiva como parte del tratamiento.',
        priority: 'high',
        actionSteps: [
          'Discuta opciones de medicación con su médico',
          'Informe sobre otros medicamentos que toma',
          'Monitoree efectos secundarios',
          'Sea paciente - los antidepresivos tardan en hacer efecto'
        ],
        followUpDays: 21
      });
    }

    if (result.severityLevel === 'mild' || result.severityLevel === 'moderate') {
      recommendations.push({
        id: 'phq9_self_help',
        type: 'lifestyle',
        category: 'short_term',
        title: 'Estrategias de Autoayuda',
        description: 'Técnicas de autoayuda pueden complementar el tratamiento profesional.',
        priority: 'medium',
        actionSteps: [
          'Establezca rutina diaria estructurada',
          'Practique técnicas de relajación',
          'Mantenga diario de emociones',
          'Identifique y desafíe pensamientos negativos'
        ],
        resources: [
          {
            type: 'article',
            title: 'Técnicas de Autoayuda para la Depresión',
            url: 'https://example.com/autoayuda-depresion'
          }
        ],
        followUpDays: 30
      });
    }

    return recommendations;
  }

  /**
   * Generate MMSE-specific recommendations
   */
  private static generateMMSERecommendations(result: AssessmentResult, userProfile: UserProfile): Recommendation[] {
    const recommendations: Recommendation[] = [];
    const riskCategory = result.riskAssessment.riskCategory;
    const score = result.adjustedScore;

    if (riskCategory === 'high' && score < 12) {
      recommendations.push({
        id: 'mmse_severe_impairment',
        type: 'medical',
        category: 'immediate',
        title: 'Evaluación Neurológica Urgente',
        description: 'Su puntuación MMSE indica deterioro cognitivo severo que requiere atención médica inmediata.',
        priority: 'urgent',
        actionSteps: [
          'Consulte con neurólogo en las próximas 48 horas',
          'Solicite estudios de neuroimagen (RM cerebral)',
          'Evaluación de causas reversibles de demencia',
          'Considere evaluación de seguridad en el hogar',
          'Involucre a familiares en el plan de cuidado'
        ],
        resources: [
          {
            type: 'contact',
            title: 'Servicios de Neurología - IMSS',
            description: 'Directorio de especialistas en neurología'
          },
          {
            type: 'article',
            title: 'Guía para Familias: Demencia Severa',
            url: 'https://example.com/demencia-severa'
          }
        ],
        followUpDays: 2
      });

      recommendations.push({
        id: 'mmse_safety_assessment',
        type: 'lifestyle',
        category: 'immediate',
        title: 'Evaluación de Seguridad',
        description: 'Es importante evaluar la seguridad en actividades diarias.',
        priority: 'urgent',
        actionSteps: [
          'Evalúe capacidad para conducir vehículos',
          'Revise seguridad en el hogar (gas, electricidad)',
          'Considere supervisión para medicamentos',
          'Evalúe capacidad para manejar finanzas'
        ],
        followUpDays: 7
      });
    }

    if (riskCategory === 'high' && score >= 12) {
      recommendations.push({
        id: 'mmse_moderate_impairment',
        type: 'medical',
        category: 'short_term',
        title: 'Evaluación Geriátrica Integral',
        description: 'Su puntuación sugiere deterioro cognitivo moderado que requiere evaluación especializada.',
        priority: 'high',
        actionSteps: [
          'Consulte con geriatra o neurólogo',
          'Evaluación neuropsicológica completa',
          'Descarte causas tratables (depresión, deficiencias vitamínicas)',
          'Planifique cuidados a largo plazo'
        ],
        followUpDays: 14
      });
    }

    if (riskCategory === 'moderate') {
      recommendations.push({
        id: 'mmse_mild_impairment',
        type: 'medical',
        category: 'short_term',
        title: 'Seguimiento Cognitivo',
        description: 'Su puntuación indica posible deterioro cognitivo leve que requiere monitoreo.',
        priority: 'medium',
        actionSteps: [
          'Consulte con médico de atención primaria',
          'Repita evaluación en 6 meses',
          'Mantenga actividad cognitiva estimulante',
          'Control de factores de riesgo cardiovascular'
        ],
        followUpDays: 30
      });
    }

    // Age-specific recommendations
    const userAge = userProfile.dateOfBirth ? new Date().getFullYear() - new Date(userProfile.dateOfBirth).getFullYear() : 50;
    if (userAge > 75) {
      recommendations.push({
        id: 'mmse_elderly_care',
        type: 'lifestyle',
        category: 'long_term',
        title: 'Cuidado Integral del Adulto Mayor',
        description: 'Recomendaciones específicas para mantener la independencia y calidad de vida.',
        priority: 'medium',
        actionSteps: [
          'Mantenga rutinas diarias estructuradas',
          'Ejercicio adaptado a su edad y capacidad',
          'Revisiones médicas regulares',
          'Mantenga conexiones sociales activas'
        ],
        followUpDays: 30
      });
    }

    return recommendations;
  }

  /**
   * Generate AD8-specific recommendations
   */
  private static generateAD8Recommendations(result: AssessmentResult, userProfile: UserProfile): Recommendation[] {
    const recommendations: Recommendation[] = [];
    const riskCategory = result.riskAssessment.riskCategory;
    const score = result.adjustedScore;

    if (riskCategory === 'high' || score >= 4) {
      recommendations.push({
        id: 'ad8_dementia_evaluation',
        type: 'medical',
        category: 'immediate',
        title: 'Evaluación de Demencia',
        description: 'Sus respuestas sugieren cambios cognitivos significativos que requieren evaluación especializada.',
        priority: 'urgent',
        actionSteps: [
          'Consulte con especialista en memoria o neurólogo',
          'Evaluación neuropsicológica completa',
          'Estudios de laboratorio (B12, tiroides, etc.)',
          'Considere estudios de neuroimagen',
          'Involucre a familiares en la evaluación'
        ],
        resources: [
          {
            type: 'contact',
            title: 'Clínicas de Memoria - México',
            description: 'Directorio de clínicas especializadas en trastornos de memoria'
          },
          {
            type: 'article',
            title: 'Qué Esperar en una Evaluación de Memoria',
            url: 'https://example.com/evaluacion-memoria'
          }
        ],
        followUpDays: 14
      });

      recommendations.push({
        id: 'ad8_family_support',
        type: 'lifestyle',
        category: 'short_term',
        title: 'Apoyo Familiar',
        description: 'Es importante involucrar a la familia en el proceso de evaluación y cuidado.',
        priority: 'high',
        actionSteps: [
          'Eduque a familiares sobre cambios cognitivos',
          'Establezca red de apoyo familiar',
          'Considere grupos de apoyo para familias',
          'Planifique cuidados futuros'
        ],
        resources: [
          {
            type: 'organization',
            title: 'Asociación Mexicana de Alzheimer',
            description: 'Recursos y apoyo para familias'
          }
        ],
        followUpDays: 30
      });
    }

    if (riskCategory === 'moderate' || (score >= 2 && score < 4)) {
      recommendations.push({
        id: 'ad8_monitoring',
        type: 'monitoring',
        category: 'short_term',
        title: 'Monitoreo de Cambios Cognitivos',
        description: 'Se han identificado algunos cambios cognitivos que requieren seguimiento.',
        priority: 'medium',
        actionSteps: [
          'Consulte con médico de atención primaria',
          'Mantenga diario de cambios cognitivos',
          'Repita evaluación en 6 meses',
          'Mantenga actividad mental estimulante'
        ],
        followUpDays: 30
      });
    }

    // Prevention recommendations for low risk
    if (riskCategory === 'low') {
      recommendations.push({
        id: 'ad8_prevention',
        type: 'lifestyle',
        category: 'long_term',
        title: 'Prevención de Demencia',
        description: 'Estrategias para mantener la salud cognitiva y prevenir el deterioro.',
        priority: 'medium',
        actionSteps: [
          'Mantenga actividad física regular',
          'Estimulación cognitiva continua',
          'Control de factores de riesgo cardiovascular',
          'Dieta mediterránea rica en antioxidantes'
        ],
        followUpDays: 90
      });
    }

    return recommendations;
  }

  /**
   * Generate Parkinson's-specific recommendations
   */
  private static generateParkinsonsRecommendations(result: AssessmentResult, userProfile: UserProfile): Recommendation[] {
    const recommendations: Recommendation[] = [];
    const riskCategory = result.riskAssessment.riskCategory;
    const score = result.adjustedScore;

    if (riskCategory === 'high' || score > 18) {
      recommendations.push({
        id: 'parkinsons_neurology_consultation',
        type: 'medical',
        category: 'immediate',
        title: 'Consulta con Neurólogo Especialista',
        description: 'Sus síntomas sugieren posible enfermedad de Parkinson que requiere evaluación especializada.',
        priority: 'urgent',
        actionSteps: [
          'Consulte con neurólogo especialista en trastornos del movimiento',
          'Evaluación clínica detallada de síntomas motores',
          'Considere DaTscan si está disponible',
          'Evaluación de respuesta a levodopa',
          'Descarte otras causas de parkinsonismo'
        ],
        resources: [
          {
            type: 'contact',
            title: 'Especialistas en Trastornos del Movimiento',
            description: 'Directorio de neurólogos especializados en Parkinson'
          },
          {
            type: 'article',
            title: 'Guía del Paciente: Enfermedad de Parkinson',
            url: 'https://example.com/parkinson-guia'
          }
        ],
        followUpDays: 14
      });

      recommendations.push({
        id: 'parkinsons_multidisciplinary_care',
        type: 'medical',
        category: 'short_term',
        title: 'Cuidado Multidisciplinario',
        description: 'El Parkinson se maneja mejor con un equipo multidisciplinario.',
        priority: 'high',
        actionSteps: [
          'Fisioterapia para mantener movilidad',
          'Terapia ocupacional para actividades diarias',
          'Evaluación del habla y deglución',
          'Apoyo psicológico y familiar'
        ],
        followUpDays: 30
      });

      recommendations.push({
        id: 'parkinsons_exercise_therapy',
        type: 'lifestyle',
        category: 'immediate',
        title: 'Ejercicio Terapéutico',
        description: 'El ejercicio es fundamental en el manejo del Parkinson.',
        priority: 'high',
        actionSteps: [
          'Inicie programa de ejercicio supervisado',
          'Incluya ejercicios de equilibrio y coordinación',
          'Practique tai chi o yoga adaptado',
          'Mantenga actividad física diaria'
        ],
        resources: [
          {
            type: 'program',
            title: 'Programa de Ejercicio para Parkinson',
            description: 'Ejercicios específicos para personas con Parkinson'
          }
        ],
        followUpDays: 7
      });
    }

    if (riskCategory === 'moderate' || (score > 8 && score <= 18)) {
      recommendations.push({
        id: 'parkinsons_early_evaluation',
        type: 'medical',
        category: 'short_term',
        title: 'Evaluación Neurológica',
        description: 'Algunos síntomas sugieren la necesidad de evaluación neurológica.',
        priority: 'medium',
        actionSteps: [
          'Consulte con neurólogo general',
          'Evaluación de síntomas motores y no motores',
          'Monitoreo de progresión de síntomas',
          'Descarte otras condiciones'
        ],
        followUpDays: 30
      });

      recommendations.push({
        id: 'parkinsons_lifestyle_modifications',
        type: 'lifestyle',
        category: 'short_term',
        title: 'Modificaciones del Estilo de Vida',
        description: 'Cambios en el estilo de vida pueden ayudar con los síntomas tempranos.',
        priority: 'medium',
        actionSteps: [
          'Ejercicio regular adaptado a sus capacidades',
          'Técnicas de relajación para rigidez',
          'Mejore la postura y marcha',
          'Mantenga actividades sociales'
        ],
        followUpDays: 30
      });
    }

    // Specific recommendations based on symptom domains
    const metadata = result.metadata as any;
    if (metadata?.motorSymptomScore > 10) {
      recommendations.push({
        id: 'parkinsons_motor_management',
        type: 'lifestyle',
        category: 'short_term',
        title: 'Manejo de Síntomas Motores',
        description: 'Estrategias específicas para manejar síntomas motores.',
        priority: 'medium',
        actionSteps: [
          'Ejercicios de amplitud de movimiento',
          'Técnicas para mejorar la marcha',
          'Estrategias para el temblor',
          'Ejercicios de escritura y motricidad fina'
        ],
        followUpDays: 14
      });
    }

    if (metadata?.nonMotorSymptomScore > 6) {
      recommendations.push({
        id: 'parkinsons_nonmotor_management',
        type: 'lifestyle',
        category: 'short_term',
        title: 'Manejo de Síntomas No Motores',
        description: 'Los síntomas no motores también requieren atención.',
        priority: 'medium',
        actionSteps: [
          'Mejore la higiene del sueño',
          'Manejo del estreñimiento con dieta y ejercicio',
          'Técnicas para mejorar el olfato',
          'Apoyo para cambios de ánimo'
        ],
        followUpDays: 21
      });
    }

    return recommendations;
  }

  /**
   * Generate general lifestyle recommendations based on risk category
   */
  private static generateLifestyleRecommendations(riskCategory: RiskCategory, _userProfile: UserProfile): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // Exercise recommendations
    recommendations.push({
      id: 'lifestyle_exercise',
      type: 'lifestyle',
      category: 'long_term',
      title: 'Ejercicio Regular',
      description: 'El ejercicio regular beneficia tanto la salud física como mental y cognitiva.',
      priority: riskCategory === 'high' ? 'high' : 'medium',
      actionSteps: [
        'Realice al menos 150 minutos de ejercicio moderado por semana',
        'Incluya ejercicios de fuerza 2 veces por semana',
        'Considere actividades como caminar, nadar o bailar',
        'Comience gradualmente si no ha ejercitado recientemente'
      ],
      resources: [
        {
          type: 'article',
          title: 'Guía de Ejercicio para Adultos Mayores',
          url: 'https://example.com/ejercicio-adultos-mayores'
        }
      ],
      followUpDays: 30
    });

    // Nutrition recommendations
    recommendations.push({
      id: 'lifestyle_nutrition',
      type: 'lifestyle',
      category: 'long_term',
      title: 'Dieta Mediterránea',
      description: 'Una dieta rica en frutas, verduras, pescado y aceite de oliva puede proteger la salud cerebral.',
      priority: 'medium',
      actionSteps: [
        'Consuma al menos 5 porciones de frutas y verduras diarias',
        'Incluya pescado graso 2-3 veces por semana',
        'Use aceite de oliva como grasa principal',
        'Limite alimentos procesados y azúcar refinada'
      ],
      resources: [
        {
          type: 'article',
          title: 'Guía de la Dieta Mediterránea',
          url: 'https://example.com/dieta-mediterranea'
        }
      ],
      followUpDays: 30
    });

    // Sleep recommendations
    recommendations.push({
      id: 'lifestyle_sleep',
      type: 'lifestyle',
      category: 'short_term',
      title: 'Higiene del Sueño',
      description: 'Un sueño de calidad es esencial para la salud cognitiva y emocional.',
      priority: 'medium',
      actionSteps: [
        'Mantenga horario regular de sueño',
        'Duerma 7-9 horas por noche',
        'Evite pantallas 1 hora antes de dormir',
        'Cree ambiente tranquilo y oscuro para dormir'
      ],
      followUpDays: 14
    });

    // Social engagement
    recommendations.push({
      id: 'lifestyle_social',
      type: 'lifestyle',
      category: 'long_term',
      title: 'Actividad Social',
      description: 'Mantener conexiones sociales es importante para la salud mental y cognitiva.',
      priority: 'medium',
      actionSteps: [
        'Mantenga contacto regular con familiares y amigos',
        'Participe en actividades comunitarias',
        'Considere voluntariado o grupos de interés',
        'Busque apoyo social cuando lo necesite'
      ],
      followUpDays: 30
    });

    // Cognitive stimulation
    if (riskCategory === 'moderate' || riskCategory === 'high') {
      recommendations.push({
        id: 'lifestyle_cognitive',
        type: 'lifestyle',
        category: 'long_term',
        title: 'Estimulación Cognitiva',
        description: 'Actividades que desafían el cerebro pueden ayudar a mantener la función cognitiva.',
        priority: 'medium',
        actionSteps: [
          'Lea libros y periódicos regularmente',
          'Aprenda nuevas habilidades o hobbies',
          'Resuelva rompecabezas y juegos mentales',
          'Participe en conversaciones estimulantes'
        ],
        resources: [
          {
            type: 'article',
            title: 'Ejercicios de Estimulación Cognitiva',
            url: 'https://example.com/estimulacion-cognitiva'
          }
        ],
        followUpDays: 30
      });
    }

    return recommendations;
  }

  /**
   * Generate general recommendations for any test type
   */
  private static generateGeneralRecommendations(_result: AssessmentResult, _userProfile: UserProfile): Recommendation[] {
    const recommendations: Recommendation[] = [];

    recommendations.push({
      id: 'general_followup',
      type: 'monitoring',
      category: 'long_term',
      title: 'Seguimiento Regular',
      description: 'Es importante realizar evaluaciones regulares para monitorear su salud.',
      priority: 'medium',
      actionSteps: [
        'Programe cita de seguimiento con su médico',
        'Repita evaluación según recomendación médica',
        'Mantenga registro de síntomas o cambios',
        'Comparta resultados con su equipo de salud'
      ],
      followUpDays: 90
    });

    return recommendations;
  }

  /**
   * Generate composite recommendations from multiple assessment results
   */
  static generateCompositeRecommendations(
    results: AssessmentResult[],
    userProfile: UserProfile
  ): Recommendation[] {
    if (results.length === 0) {
      return [];
    }

    const allRecommendations: Recommendation[] = [];
    const riskCategories: RiskCategory[] = [];
    const testTypes = new Set<string>();

    // Collect recommendations from all assessments
    results.forEach(result => {
      const recommendations = this.generatePersonalizedRecommendations(result, userProfile);
      allRecommendations.push(...recommendations);
      riskCategories.push(result.riskAssessment.riskCategory);
      testTypes.add(result.testType);
    });

    // Add composite-specific recommendations
    const compositeRecs = this.generateCompositeSpecificRecommendations(results, userProfile);
    allRecommendations.push(...compositeRecs);

    // Remove duplicates and prioritize
    const uniqueRecommendations = this.removeDuplicates(allRecommendations);
    
    // Adjust priorities based on multiple risk factors
    const adjustedRecommendations = this.adjustPrioritiesForComposite(uniqueRecommendations, riskCategories);

    return adjustedRecommendations.sort((a, b) => this.getPriorityWeight(b.priority) - this.getPriorityWeight(a.priority));
  }

  /**
   * Generate recommendations specific to having multiple assessment results
   */
  private static generateCompositeSpecificRecommendations(
    results: AssessmentResult[],
    userProfile: UserProfile
  ): Recommendation[] {
    const recommendations: Recommendation[] = [];
    const highRiskCount = results.filter(r => r.riskAssessment.riskCategory === 'high').length;
    const testTypes = results.map(r => r.testType);

    // Multiple high-risk conditions
    if (highRiskCount >= 2) {
      recommendations.push({
        id: 'composite_multiple_high_risk',
        type: 'medical',
        category: 'immediate',
        title: 'Evaluación Médica Integral Urgente',
        description: 'Múltiples evaluaciones indican riesgo alto que requiere atención médica coordinada.',
        priority: 'urgent',
        actionSteps: [
          'Consulta médica integral en 24-48 horas',
          'Coordinación entre especialistas',
          'Evaluación de interacciones entre condiciones',
          'Plan de tratamiento multidisciplinario'
        ],
        resources: [
          {
            type: 'contact',
            title: 'Coordinación de Cuidados Médicos',
            description: 'Servicios de coordinación para múltiples especialidades'
          }
        ],
        followUpDays: 2
      });
    }

    // Cognitive + Depression combination
    if (testTypes.includes('phq9') && (testTypes.includes('moca') || testTypes.includes('mmse'))) {
      const phq9Result = results.find(r => r.testType === 'phq9');
      const cognitiveResult = results.find(r => r.testType === 'moca' || r.testType === 'mmse');
      
      if (phq9Result?.riskAssessment.riskCategory !== 'low' && cognitiveResult?.riskAssessment.riskCategory !== 'low') {
        recommendations.push({
          id: 'composite_cognitive_depression',
          type: 'medical',
          category: 'short_term',
          title: 'Evaluación Neuropsiquiátrica',
          description: 'La combinación de síntomas cognitivos y depresivos requiere evaluación especializada.',
          priority: 'high',
          actionSteps: [
            'Consulta con neuropsiquiatra',
            'Evaluación de depresión pseudodemencial',
            'Tratamiento coordinado de ambas condiciones',
            'Seguimiento estrecho de respuesta al tratamiento'
          ],
          followUpDays: 14
        });
      }
    }

    // Parkinson + Cognitive combination
    if (testTypes.includes('parkinsons') && (testTypes.includes('moca') || testTypes.includes('mmse'))) {
      recommendations.push({
        id: 'composite_parkinson_cognitive',
        type: 'medical',
        category: 'short_term',
        title: 'Evaluación de Parkinson con Deterioro Cognitivo',
        description: 'La combinación de síntomas parkinsonianos y cognitivos requiere evaluación especializada.',
        priority: 'high',
        actionSteps: [
          'Consulta con neurólogo especialista en Parkinson',
          'Evaluación de demencia con cuerpos de Lewy',
          'Ajuste de medicamentos considerando cognición',
          'Terapias no farmacológicas coordinadas'
        ],
        followUpDays: 21
      });
    }

    // Multiple cognitive assessments with concerning results
    const cognitiveTests = results.filter(r => ['moca', 'mmse', 'ad8'].includes(r.testType));
    if (cognitiveTests.length >= 2 && cognitiveTests.some(r => r.riskAssessment.riskCategory === 'high')) {
      recommendations.push({
        id: 'composite_multiple_cognitive',
        type: 'medical',
        category: 'short_term',
        title: 'Evaluación Cognitiva Integral',
        description: 'Múltiples evaluaciones cognitivas sugieren la necesidad de evaluación neuropsicológica completa.',
        priority: 'high',
        actionSteps: [
          'Evaluación neuropsicológica completa',
          'Correlación entre diferentes dominios cognitivos',
          'Identificación de patrón de deterioro',
          'Recomendaciones de rehabilitación cognitiva'
        ],
        followUpDays: 30
      });
    }

    return recommendations;
  }

  /**
   * Adjust recommendation priorities based on multiple risk factors
   */
  private static adjustPrioritiesForComposite(
    recommendations: Recommendation[],
    riskCategories: RiskCategory[]
  ): Recommendation[] {
    const highRiskCount = riskCategories.filter(cat => cat === 'high').length;
    const moderateRiskCount = riskCategories.filter(cat => cat === 'moderate').length;

    return recommendations.map(rec => {
      let adjustedPriority = rec.priority;

      // Elevate priority if multiple high-risk conditions
      if (highRiskCount >= 2) {
        if (rec.priority === 'high') adjustedPriority = 'urgent';
        if (rec.priority === 'medium') adjustedPriority = 'high';
      }
      // Elevate priority if multiple moderate-risk conditions
      else if (moderateRiskCount >= 2) {
        if (rec.priority === 'medium') adjustedPriority = 'high';
        if (rec.priority === 'low') adjustedPriority = 'medium';
      }

      return {
        ...rec,
        priority: adjustedPriority
      };
    });
  }

  /**
   * Generate recommendations by priority level
   */
  static getRecommendationsByPriority(
    result: AssessmentResult,
    userProfile: UserProfile,
    minPriority: 'low' | 'medium' | 'high' | 'urgent' = 'low'
  ): Recommendation[] {
    const allRecommendations = this.generatePersonalizedRecommendations(result, userProfile);
    return RecommendationDatabase.filterByPriority(allRecommendations, minPriority);
  }

  /**
   * Generate lifestyle-only recommendations
   */
  static getLifestyleOnlyRecommendations(
    result: AssessmentResult,
    userProfile: UserProfile
  ): Recommendation[] {
    const allRecommendations = this.generatePersonalizedRecommendations(result, userProfile);
    return allRecommendations.filter(rec => rec.type === 'lifestyle');
  }

  /**
   * Generate medical-only recommendations
   */
  static getMedicalOnlyRecommendations(
    result: AssessmentResult,
    userProfile: UserProfile
  ): Recommendation[] {
    const allRecommendations = this.generatePersonalizedRecommendations(result, userProfile);
    return allRecommendations.filter(rec => rec.type === 'medical');
  }

  /**
   * Get numeric weight for priority sorting
   */
  private static getPriorityWeight(priority: string): number {
    switch (priority) {
      case 'urgent': return 4;
      case 'high': return 3;
      case 'medium': return 2;
      case 'low': return 1;
      default: return 0;
    }
  }
}
