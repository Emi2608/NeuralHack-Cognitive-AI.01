// AD8 Test Definition - AD8 Dementia Screening Interview
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
export const ad8Definition: TestDefinition = {
  id: 'ad8',
  name: 'AD8',
  fullName: 'Entrevista de Detección de Demencia AD8',
  description: 'Herramienta breve de detección de cambios cognitivos y demencia temprana',
  duration: 3, // 3 minutes
  sections: [
    {
      id: 'cognitive_changes',
      name: 'Cambios Cognitivos',
      description: 'Detección de cambios en el funcionamiento cognitivo',
      order: 1,
      timeLimit: 180, // 3 minutes
      instructions: 'Las siguientes preguntas se refieren a cambios en el pensamiento y la memoria que han ocurrido en los últimos años. Por favor, responda SÍ si ha notado un cambio, NO si no ha habido cambio.',
      questions: [
        {
          id: 'ad8_q1',
          type: 'yes_no',
          text: '¿Ha tenido problemas con el juicio (por ejemplo, caer en estafas, tomar decisiones financieras pobres, comprar regalos inapropiados)?',
          instructions: 'Piense en cambios en la capacidad de tomar buenas decisiones.',
          order: 1,
          required: true,
          options: [
            { value: 0, label: 'No', score: 0 },
            { value: 1, label: 'Sí', score: 1 }
          ],
          scoring: {
            type: 'direct',
            points: 0 // Points determined by selected option
          },
          metadata: {
            domain: 'executive_function',
            changeType: 'judgment'
          }
        },
        {
          id: 'ad8_q2',
          type: 'yes_no',
          text: '¿Ha tenido menos interés en pasatiempos/actividades?',
          instructions: 'Considere si ha perdido interés en actividades que antes disfrutaba.',
          order: 2,
          required: true,
          options: [
            { value: 0, label: 'No', score: 0 },
            { value: 1, label: 'Sí', score: 1 }
          ],
          scoring: {
            type: 'direct',
            points: 0
          },
          metadata: {
            domain: 'behavioral',
            changeType: 'apathy'
          }
        },
        {
          id: 'ad8_q3',
          type: 'yes_no',
          text: '¿Repite las mismas cosas una y otra vez (preguntas, historias o declaraciones)?',
          instructions: 'Piense si ha notado que repite conversaciones o preguntas.',
          order: 3,
          required: true,
          options: [
            { value: 0, label: 'No', score: 0 },
            { value: 1, label: 'Sí', score: 1 }
          ],
          scoring: {
            type: 'direct',
            points: 0
          },
          metadata: {
            domain: 'memory',
            changeType: 'repetition'
          }
        },
        {
          id: 'ad8_q4',
          type: 'yes_no',
          text: '¿Ha tenido problemas para aprender a usar herramientas, aparatos o dispositivos (por ejemplo, VCR, computadora, microondas, control remoto)?',
          instructions: 'Considere dificultades con tecnología que antes podía manejar.',
          order: 4,
          required: true,
          options: [
            { value: 0, label: 'No', score: 0 },
            { value: 1, label: 'Sí', score: 1 }
          ],
          scoring: {
            type: 'direct',
            points: 0
          },
          metadata: {
            domain: 'executive_function',
            changeType: 'learning_technology'
          }
        },
        {
          id: 'ad8_q5',
          type: 'yes_no',
          text: '¿Ha olvidado el mes o el año correcto?',
          instructions: 'Piense en episodios de desorientación temporal.',
          order: 5,
          required: true,
          options: [
            { value: 0, label: 'No', score: 0 },
            { value: 1, label: 'Sí', score: 1 }
          ],
          scoring: {
            type: 'direct',
            points: 0
          },
          metadata: {
            domain: 'orientation',
            changeType: 'temporal_orientation'
          }
        },
        {
          id: 'ad8_q6',
          type: 'yes_no',
          text: '¿Ha tenido problemas para manejar asuntos financieros complicados (por ejemplo, balancear la chequera, impuestos sobre la renta, pagar cuentas)?',
          instructions: 'Considere cambios en la capacidad de manejar finanzas.',
          order: 6,
          required: true,
          options: [
            { value: 0, label: 'No', score: 0 },
            { value: 1, label: 'Sí', score: 1 }
          ],
          scoring: {
            type: 'direct',
            points: 0
          },
          metadata: {
            domain: 'executive_function',
            changeType: 'financial_management'
          }
        },
        {
          id: 'ad8_q7',
          type: 'yes_no',
          text: '¿Ha tenido problemas para recordar citas?',
          instructions: 'Piense en olvidos de citas médicas, sociales o de trabajo.',
          order: 7,
          required: true,
          options: [
            { value: 0, label: 'No', score: 0 },
            { value: 1, label: 'Sí', score: 1 }
          ],
          scoring: {
            type: 'direct',
            points: 0
          },
          metadata: {
            domain: 'memory',
            changeType: 'prospective_memory'
          }
        },
        {
          id: 'ad8_q8',
          type: 'yes_no',
          text: '¿Ha tenido problemas constantes de pensamiento y/o memoria?',
          instructions: 'Considere problemas persistentes con el pensamiento o la memoria.',
          order: 8,
          required: true,
          options: [
            { value: 0, label: 'No', score: 0 },
            { value: 1, label: 'Sí', score: 1 }
          ],
          scoring: {
            type: 'direct',
            points: 0
          },
          metadata: {
            domain: 'general_cognition',
            changeType: 'persistent_problems'
          }
        }
      ]
    }
  ],
  scoringConfig: {
    maxScore: 8,
    minScore: 0,
    sections: [
      { sectionId: 'cognitive_changes', maxScore: 8, weight: 1 }
    ],
    formula: 'sum_of_yes_responses'
  },
  riskMapping: {
    ranges: [
      {
        category: 'low',
        scoreRange: { min: 0, max: 1 },
        riskRange: { min: 0, max: 5 },
        description: 'Riesgo bajo de deterioro cognitivo',
        recommendations: [
          'Continúe con actividades cognitivas estimulantes',
          'Mantenga un estilo de vida saludable',
          'Monitoreo anual de rutina',
          'Control de factores de riesgo cardiovascular'
        ]
      },
      {
        category: 'moderate',
        scoreRange: { min: 2, max: 3 },
        riskRange: { min: 20, max: 40 },
        description: 'Posibles cambios cognitivos - evaluación recomendada',
        recommendations: [
          'Consulta con médico de atención primaria',
          'Evaluación cognitiva más detallada',
          'Monitoreo cada 6 meses',
          'Descartar causas reversibles (depresión, medicamentos)'
        ]
      },
      {
        category: 'high',
        scoreRange: { min: 4, max: 8 },
        riskRange: { min: 40, max: 80 },
        description: 'Cambios cognitivos significativos - evaluación urgente',
        recommendations: [
          'Evaluación neurológica inmediata',
          'Evaluación neuropsicológica completa',
          'Estudios de laboratorio y neuroimagen',
          'Considerar referencia a especialista en memoria',
          'Evaluación de seguridad y capacidad funcional'
        ]
      }
    ],
    algorithm: 'threshold'
  },
  metadata: {
    version: '1.0',
    language: 'es',
    validatedPopulation: ['mexican', 'latin_american', 'spanish_speaking', 'elderly', 'adult'],
    clinicalReferences: [
      'Galvin, J. E., Roe, C. M., Powlishta, K. K., Coats, M. A., Muich, S. J., Grant, E., ... & Morris, J. C. (2005). The AD8: a brief informant interview to detect dementia. Neurology, 65(4), 559-564.',
      'Galvin, J. E., Roe, C. M., Xiong, C., & Morris, J. C. (2006). Validity and reliability of the AD8 informant interview in dementia. Neurology, 67(11), 1942-1948.',
      'Adaptación al español: Rami, L., Mollica, M. A., García-Sanchez, C., Saldaña, J., Sanchez, B., Sala, I., ... & Molinuevo, J. L. (2013). The Subjective Cognitive Decline Questionnaire (SCD-Q): a validation study. Journal of Alzheimer\'s Disease, 41(2), 453-466.'
    ],
    lastUpdated: new Date('2024-01-15'),
    author: 'NeuralHack Cognitive AI Team',
    license: 'Clinical Use - AD8 Public Domain',
    notes: [
      'El AD8 puede ser completado por el paciente o un informante (familiar/cuidador)',
      'Puntuación ≥2 sugiere la necesidad de evaluación adicional',
      'Sensibilidad del 84% y especificidad del 80% para detectar demencia muy leve'
    ]
  }
};