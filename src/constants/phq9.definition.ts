// PHQ-9 Test Definition - Patient Health Questionnaire-9
// Inline type definitions to avoid import issues

type TestType = 'moca' | 'phq9' | 'mmse' | 'ad8' | 'parkinsons';
type QuestionType = 'multiple_choice' | 'likert_scale' | 'yes_no' | 'numeric_input' | 'drawing_task' | 'memory_task' | 'attention_task' | 'text_input' | 'instruction_following';
type RiskCategory = 'low' | 'moderate' | 'high';

interface QuestionOption {
  value: string | number;
  label: string;
  score?: number;
}

interface ValidationRule {
  type: 'required' | 'min' | 'max' | 'pattern' | 'custom';
  value?: any;
  message: string;
  customValidator?: (answer: any) => boolean;
}

interface ScoringRule {
  type: 'direct' | 'lookup' | 'calculated' | 'custom';
  points?: number;
  lookup?: Record<string | number, number>;
  formula?: string;
  customScorer?: (answer: any, context: any) => number;
}

interface Question {
  id: string;
  type: QuestionType;
  text: string;
  instructions?: string;
  options?: QuestionOption[];
  validation?: ValidationRule[];
  scoring?: ScoringRule;
  section?: string;
  order: number;
  required: boolean;
  timeLimit?: number;
  metadata?: Record<string, any>;
}

interface TestSection {
  id: string;
  name: string;
  description: string;
  questions: Question[];
  order: number;
  timeLimit?: number;
  instructions?: string;
}

interface SectionScoring {
  sectionId: string;
  maxScore: number;
  weight?: number;
}

interface ScoreAdjustment {
  type: 'education' | 'age' | 'language';
  condition: any;
  adjustment: number;
  description: string;
}

interface TestScoringConfig {
  maxScore: number;
  minScore: number;
  sections?: SectionScoring[];
  adjustments?: ScoreAdjustment[];
  formula?: string;
}

interface RiskRange {
  category: RiskCategory;
  scoreRange: { min: number; max: number };
  riskRange: { min: number; max: number };
  description: string;
  recommendations: string[];
}

interface RiskMapping {
  ranges: RiskRange[];
  algorithm?: 'linear' | 'threshold' | 'custom';
  customCalculator?: (score: number, context: any) => any;
}

interface TestMetadata {
  version: string;
  language: string;
  validatedPopulation: string[];
  clinicalReferences: string[];
  lastUpdated: Date;
  author: string;
  license: string;
  notes?: string[];
}

interface TestDefinition {
  id: TestType;
  name: string;
  fullName: string;
  description: string;
  duration: number;
  sections: TestSection[];
  scoringConfig: TestScoringConfig;
  riskMapping: RiskMapping;
  metadata: TestMetadata;
}
export const phq9Definition: TestDefinition = {
  id: 'phq9',
  name: 'PHQ-9',
  fullName: 'Cuestionario de Salud del Paciente-9',
  description: 'Herramienta de detección y evaluación de la gravedad de la depresión basada en los criterios del DSM-IV',
  duration: 5, // 5 minutes
  sections: [
    {
      id: 'depression_symptoms',
      name: 'Síntomas Depresivos',
      description: 'Evaluación de síntomas depresivos en las últimas 2 semanas',
      order: 1,
      timeLimit: 300, // 5 minutes
      instructions: 'Durante las últimas 2 semanas, ¿con qué frecuencia ha tenido molestias debido a los siguientes problemas?',
      questions: [
        {
          id: 'phq9_q1',
          type: 'likert_scale',
          text: 'Poco interés o placer en hacer cosas',
          instructions: 'Piense en las últimas dos semanas y seleccione la frecuencia que mejor describe su experiencia.',
          order: 1,
          required: true,
          options: [
            { value: 0, label: 'Para nada', score: 0 },
            { value: 1, label: 'Varios días', score: 1 },
            { value: 2, label: 'Más de la mitad de los días', score: 2 },
            { value: 3, label: 'Casi todos los días', score: 3 }
          ],
          scoring: {
            type: 'direct',
            points: 0 // Points determined by selected option
          },
          section: 'depression_symptoms'
        },
        {
          id: 'phq9_q2',
          type: 'likert_scale',
          text: 'Se ha sentido decaído(a), deprimido(a) o sin esperanzas',
          instructions: 'Considere su estado de ánimo general durante las últimas dos semanas.',
          order: 2,
          required: true,
          options: [
            { value: 0, label: 'Para nada', score: 0 },
            { value: 1, label: 'Varios días', score: 1 },
            { value: 2, label: 'Más de la mitad de los días', score: 2 },
            { value: 3, label: 'Casi todos los días', score: 3 }
          ],
          scoring: {
            type: 'direct',
            points: 0
          },
          section: 'depression_symptoms'
        },
        {
          id: 'phq9_q3',
          type: 'likert_scale',
          text: 'Dificultad para quedarse o permanecer dormido(a), o dormir demasiado',
          instructions: 'Incluya tanto problemas para conciliar el sueño como para mantenerlo, o dormir en exceso.',
          order: 3,
          required: true,
          options: [
            { value: 0, label: 'Para nada', score: 0 },
            { value: 1, label: 'Varios días', score: 1 },
            { value: 2, label: 'Más de la mitad de los días', score: 2 },
            { value: 3, label: 'Casi todos los días', score: 3 }
          ],
          scoring: {
            type: 'direct',
            points: 0
          },
          section: 'depression_symptoms'
        },
        {
          id: 'phq9_q4',
          type: 'likert_scale',
          text: 'Se ha sentido cansado(a) o con poca energía',
          instructions: 'Considere su nivel de energía y fatiga durante las actividades diarias.',
          order: 4,
          required: true,
          options: [
            { value: 0, label: 'Para nada', score: 0 },
            { value: 1, label: 'Varios días', score: 1 },
            { value: 2, label: 'Más de la mitad de los días', score: 2 },
            { value: 3, label: 'Casi todos los días', score: 3 }
          ],
          scoring: {
            type: 'direct',
            points: 0
          },
          section: 'depression_symptoms'
        },
        {
          id: 'phq9_q5',
          type: 'likert_scale',
          text: 'Falta de apetito o comer en exceso',
          instructions: 'Incluya tanto la pérdida de apetito como el comer compulsivamente.',
          order: 5,
          required: true,
          options: [
            { value: 0, label: 'Para nada', score: 0 },
            { value: 1, label: 'Varios días', score: 1 },
            { value: 2, label: 'Más de la mitad de los días', score: 2 },
            { value: 3, label: 'Casi todos los días', score: 3 }
          ],
          scoring: {
            type: 'direct',
            points: 0
          },
          section: 'depression_symptoms'
        },
        {
          id: 'phq9_q6',
          type: 'likert_scale',
          text: 'Se ha sentido mal con usted mismo(a) — o que es un fracaso o que ha quedado mal con usted mismo(a) o con su familia',
          instructions: 'Considere sentimientos de culpa, vergüenza o baja autoestima.',
          order: 6,
          required: true,
          options: [
            { value: 0, label: 'Para nada', score: 0 },
            { value: 1, label: 'Varios días', score: 1 },
            { value: 2, label: 'Más de la mitad de los días', score: 2 },
            { value: 3, label: 'Casi todos los días', score: 3 }
          ],
          scoring: {
            type: 'direct',
            points: 0
          },
          section: 'depression_symptoms'
        },
        {
          id: 'phq9_q7',
          type: 'likert_scale',
          text: 'Dificultad para concentrarse en cosas, tales como leer el periódico o ver la televisión',
          instructions: 'Incluya problemas de concentración en el trabajo, estudios o actividades cotidianas.',
          order: 7,
          required: true,
          options: [
            { value: 0, label: 'Para nada', score: 0 },
            { value: 1, label: 'Varios días', score: 1 },
            { value: 2, label: 'Más de la mitad de los días', score: 2 },
            { value: 3, label: 'Casi todos los días', score: 3 }
          ],
          scoring: {
            type: 'direct',
            points: 0
          },
          section: 'depression_symptoms'
        },
        {
          id: 'phq9_q8',
          type: 'likert_scale',
          text: '¿Se ha movido o hablado tan lento que otras personas podrían haberlo(a) notado? O lo contrario — muy inquieto(a) o agitado(a), ha estado moviéndose mucho más de lo normal',
          instructions: 'Considere cambios en su velocidad de movimiento o habla que otros puedan haber notado.',
          order: 8,
          required: true,
          options: [
            { value: 0, label: 'Para nada', score: 0 },
            { value: 1, label: 'Varios días', score: 1 },
            { value: 2, label: 'Más de la mitad de los días', score: 2 },
            { value: 3, label: 'Casi todos los días', score: 3 }
          ],
          scoring: {
            type: 'direct',
            points: 0
          },
          section: 'depression_symptoms'
        },
        {
          id: 'phq9_q9',
          type: 'likert_scale',
          text: 'Pensamientos de que estaría mejor muerto(a) o de lastimarse de alguna manera',
          instructions: 'Esta pregunta es muy importante. Incluya cualquier pensamiento sobre la muerte o autolesión.',
          order: 9,
          required: true,
          options: [
            { value: 0, label: 'Para nada', score: 0 },
            { value: 1, label: 'Varios días', score: 1 },
            { value: 2, label: 'Más de la mitad de los días', score: 2 },
            { value: 3, label: 'Casi todos los días', score: 3 }
          ],
          scoring: {
            type: 'direct',
            points: 0
          },
          section: 'depression_symptoms',
          metadata: {
            suicidalIdeation: true,
            criticalQuestion: true,
            requiresImmediateAttention: true
          }
        }
      ]
    },
    {
      id: 'functional_impairment',
      name: 'Deterioro Funcional',
      description: 'Evaluación del impacto de los síntomas en el funcionamiento diario',
      order: 2,
      timeLimit: 60,
      instructions: 'Si ha marcado algún problema en las preguntas anteriores, ¿qué tan difícil le han hecho estos problemas hacer su trabajo, encargarse de las tareas del hogar, o llevarse bien con otras personas?',
      questions: [
        {
          id: 'phq9_functional',
          type: 'multiple_choice',
          text: '¿Qué tan difícil le han hecho estos problemas hacer su trabajo, encargarse de las tareas del hogar, o llevarse bien con otras personas?',
          instructions: 'Seleccione la opción que mejor describe cómo los síntomas han afectado su vida diaria.',
          order: 1,
          required: true,
          options: [
            { value: 0, label: 'Para nada difícil', score: 0 },
            { value: 1, label: 'Algo difícil', score: 1 },
            { value: 2, label: 'Muy difícil', score: 2 },
            { value: 3, label: 'Extremadamente difícil', score: 3 }
          ],
          scoring: {
            type: 'direct',
            points: 0 // This doesn't count toward PHQ-9 score but is important for assessment
          },
          section: 'functional_impairment'
        }
      ]
    }
  ],
  scoringConfig: {
    maxScore: 27,
    minScore: 0,
    sections: [
      { sectionId: 'depression_symptoms', maxScore: 27, weight: 1 },
      { sectionId: 'functional_impairment', maxScore: 0, weight: 0 } // Not counted in total score
    ],
    formula: 'sum_of_depression_symptoms'
  },
  riskMapping: {
    ranges: [
      {
        category: 'low',
        scoreRange: { min: 0, max: 4 },
        riskRange: { min: 0, max: 10 },
        description: 'Depresión mínima o ausente',
        recommendations: [
          'Mantener rutinas saludables de sueño y ejercicio',
          'Practicar técnicas de manejo del estrés',
          'Mantener conexiones sociales',
          'Monitorear síntomas si persisten'
        ]
      },
      {
        category: 'low',
        scoreRange: { min: 5, max: 9 },
        riskRange: { min: 10, max: 25 },
        description: 'Depresión leve',
        recommendations: [
          'Considerar intervenciones de autoayuda',
          'Aumentar actividad física regular',
          'Técnicas de relajación y mindfulness',
          'Consultar con médico de atención primaria si los síntomas persisten'
        ]
      },
      {
        category: 'moderate',
        scoreRange: { min: 10, max: 14 },
        riskRange: { min: 25, max: 50 },
        description: 'Depresión moderada',
        recommendations: [
          'Evaluación por profesional de salud mental',
          'Considerar psicoterapia (TCC, terapia interpersonal)',
          'Evaluación para posible tratamiento farmacológico',
          'Seguimiento regular con profesional de la salud'
        ]
      },
      {
        category: 'high',
        scoreRange: { min: 15, max: 19 },
        riskRange: { min: 50, max: 75 },
        description: 'Depresión moderadamente severa',
        recommendations: [
          'Tratamiento inmediato con especialista en salud mental',
          'Psicoterapia intensiva',
          'Evaluación psiquiátrica para medicación',
          'Evaluación de riesgo suicida',
          'Seguimiento frecuente'
        ]
      },
      {
        category: 'high',
        scoreRange: { min: 20, max: 27 },
        riskRange: { min: 75, max: 95 },
        description: 'Depresión severa',
        recommendations: [
          'Atención psiquiátrica urgente',
          'Evaluación inmediata de riesgo suicida',
          'Considerar hospitalización si hay riesgo inmediato',
          'Tratamiento farmacológico intensivo',
          'Terapia psicológica especializada',
          'Apoyo familiar y social intensivo'
        ]
      }
    ],
    algorithm: 'threshold'
  },
  metadata: {
    version: '1.0',
    language: 'es',
    validatedPopulation: ['mexican', 'latin_american', 'spanish_speaking', 'adult'],
    clinicalReferences: [
      'Kroenke, K., Spitzer, R. L., & Williams, J. B. (2001). The PHQ-9: validity of a brief depression severity measure. Journal of general internal medicine, 16(9), 606-613.',
      'Familiar, I., Ortiz-Panozo, E., Hall, B. J., Vieitez, I., Romieu, I., Lopez-Ridaura, R., & Lajous, M. (2015). Factor structure of the Spanish version of the Patient Health Questionnaire-9 in Mexican women. International Journal of Methods in Psychiatric Research, 24(1), 74-82.',
      'Adaptación mexicana: Familiar I, et al. Mexican version of the Patient Health Questionnaire (PHQ-9): Tool for detection of depression in primary care. Aten Primaria. 2020;52(10):669-676.'
    ],
    lastUpdated: new Date('2024-01-15'),
    author: 'NeuralHack Cognitive AI Team',
    license: 'Clinical Use - PHQ-9 Public Domain'
  }
};