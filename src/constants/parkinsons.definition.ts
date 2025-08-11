import type { TestDefinition, Question, TestSection } from '../types/assessment';

// Parkinson's Disease Screening Test Definition
export const parkinsonsDefinition: TestDefinition = {
  id: 'parkinsons',
  name: "Parkinson's",
  fullName: 'Evaluación de Síntomas de Parkinson',
  description: 'Herramienta de detección temprana de síntomas motores y no motores de la enfermedad de Parkinson',
  duration: 8, // 8 minutes
  sections: [
    {
      id: 'motor_symptoms',
      name: 'Síntomas Motores',
      description: 'Evaluación de síntomas motores característicos del Parkinson',
      order: 1,
      timeLimit: 300, // 5 minutes
      instructions: 'Las siguientes preguntas se refieren a síntomas físicos que puede haber experimentado. Responda con qué frecuencia ha notado estos síntomas en los últimos 6 meses.',
      questions: [
        {
          id: 'parkinsons_tremor',
          type: 'likert_scale',
          text: '¿Ha notado temblor en las manos, brazos o piernas cuando están en reposo?',
          instructions: 'Considere temblores que ocurren cuando no está usando activamente esa parte del cuerpo.',
          order: 1,
          required: true,
          options: [
            { value: 0, label: 'Nunca', score: 0 },
            { value: 1, label: 'Raramente', score: 1 },
            { value: 2, label: 'A veces', score: 2 },
            { value: 3, label: 'Frecuentemente', score: 3 },
            { value: 4, label: 'Siempre', score: 4 }
          ],
          scoring: {
            type: 'direct',
            points: 0
          },
          metadata: {
            symptomType: 'tremor',
            motorSymptom: true,
            cardinalSign: true
          }
        },
        {
          id: 'parkinsons_rigidity',
          type: 'likert_scale',
          text: '¿Ha notado rigidez o tensión en sus músculos, especialmente en brazos, piernas o cuello?',
          instructions: 'Piense en sensación de músculos tensos o rígidos que dificultan el movimiento.',
          order: 2,
          required: true,
          options: [
            { value: 0, label: 'Nunca', score: 0 },
            { value: 1, label: 'Raramente', score: 1 },
            { value: 2, label: 'A veces', score: 2 },
            { value: 3, label: 'Frecuentemente', score: 3 },
            { value: 4, label: 'Siempre', score: 4 }
          ],
          scoring: {
            type: 'direct',
            points: 0
          },
          metadata: {
            symptomType: 'rigidity',
            motorSymptom: true,
            cardinalSign: true
          }
        },
        {
          id: 'parkinsons_bradykinesia',
          type: 'likert_scale',
          text: '¿Ha notado que sus movimientos se han vuelto más lentos de lo normal?',
          instructions: 'Considere lentitud para iniciar movimientos o realizar tareas cotidianas.',
          order: 3,
          required: true,
          options: [
            { value: 0, label: 'Nunca', score: 0 },
            { value: 1, label: 'Raramente', score: 1 },
            { value: 2, label: 'A veces', score: 2 },
            { value: 3, label: 'Frecuentemente', score: 3 },
            { value: 4, label: 'Siempre', score: 4 }
          ],
          scoring: {
            type: 'direct',
            points: 0
          },
          metadata: {
            symptomType: 'bradykinesia',
            motorSymptom: true,
            cardinalSign: true
          }
        },
        {
          id: 'parkinsons_balance',
          type: 'likert_scale',
          text: '¿Ha tenido problemas de equilibrio o inestabilidad al caminar?',
          instructions: 'Incluya sensación de inestabilidad, tropiezos o dificultad para mantener el equilibrio.',
          order: 4,
          required: true,
          options: [
            { value: 0, label: 'Nunca', score: 0 },
            { value: 1, label: 'Raramente', score: 1 },
            { value: 2, label: 'A veces', score: 2 },
            { value: 3, label: 'Frecuentemente', score: 3 },
            { value: 4, label: 'Siempre', score: 4 }
          ],
          scoring: {
            type: 'direct',
            points: 0
          },
          metadata: {
            symptomType: 'postural_instability',
            motorSymptom: true,
            cardinalSign: true
          }
        },
        {
          id: 'parkinsons_gait',
          type: 'likert_scale',
          text: '¿Ha notado cambios en su forma de caminar (pasos más cortos, arrastrando los pies, dificultad para iniciar la marcha)?',
          instructions: 'Considere cualquier cambio en su patrón normal de caminar.',
          order: 5,
          required: true,
          options: [
            { value: 0, label: 'Nunca', score: 0 },
            { value: 1, label: 'Raramente', score: 1 },
            { value: 2, label: 'A veces', score: 2 },
            { value: 3, label: 'Frecuentemente', score: 3 },
            { value: 4, label: 'Siempre', score: 4 }
          ],
          scoring: {
            type: 'direct',
            points: 0
          },
          metadata: {
            symptomType: 'gait_disturbance',
            motorSymptom: true
          }
        }
      ]
    },
    {
      id: 'non_motor_symptoms',
      name: 'Síntomas No Motores',
      description: 'Evaluación de síntomas no motores del Parkinson',
      order: 2,
      timeLimit: 180, // 3 minutes
      instructions: 'Estas preguntas se refieren a otros síntomas que pueden estar relacionados con el Parkinson.',
      questions: [
        {
          id: 'parkinsons_smell',
          type: 'likert_scale',
          text: '¿Ha notado pérdida o disminución del sentido del olfato?',
          instructions: 'Considere si ha perdido la capacidad de oler alimentos, perfumes u otros olores.',
          order: 1,
          required: true,
          options: [
            { value: 0, label: 'No he notado cambios', score: 0 },
            { value: 1, label: 'Ligera disminución', score: 1 },
            { value: 2, label: 'Disminución moderada', score: 2 },
            { value: 3, label: 'Pérdida severa', score: 3 }
          ],
          scoring: {
            type: 'direct',
            points: 0
          },
          metadata: {
            symptomType: 'hyposmia',
            nonMotorSymptom: true,
            earlySign: true
          }
        },
        {
          id: 'parkinsons_sleep',
          type: 'likert_scale',
          text: '¿Ha tenido problemas para dormir, incluyendo movimientos violentos durante los sueños?',
          instructions: 'Incluya insomnio, pesadillas vívidas, o movimientos bruscos que despierten a su pareja.',
          order: 2,
          required: true,
          options: [
            { value: 0, label: 'Nunca', score: 0 },
            { value: 1, label: 'Raramente', score: 1 },
            { value: 2, label: 'A veces', score: 2 },
            { value: 3, label: 'Frecuentemente', score: 3 }
          ],
          scoring: {
            type: 'direct',
            points: 0
          },
          metadata: {
            symptomType: 'sleep_disorder',
            nonMotorSymptom: true,
            includesRBD: true
          }
        },
        {
          id: 'parkinsons_constipation',
          type: 'likert_scale',
          text: '¿Ha experimentado estreñimiento crónico (menos de 3 evacuaciones por semana)?',
          instructions: 'Considere cambios en sus hábitos intestinales normales.',
          order: 3,
          required: true,
          options: [
            { value: 0, label: 'Nunca', score: 0 },
            { value: 1, label: 'Ocasionalmente', score: 1 },
            { value: 2, label: 'Frecuentemente', score: 2 },
            { value: 3, label: 'Constantemente', score: 3 }
          ],
          scoring: {
            type: 'direct',
            points: 0
          },
          metadata: {
            symptomType: 'constipation',
            nonMotorSymptom: true,
            autonomicSymptom: true
          }
        },
        {
          id: 'parkinsons_mood',
          type: 'likert_scale',
          text: '¿Ha experimentado cambios en su estado de ánimo, incluyendo depresión, ansiedad o apatía?',
          instructions: 'Considere cambios emocionales que han persistido por varias semanas.',
          order: 4,
          required: true,
          options: [
            { value: 0, label: 'No he notado cambios', score: 0 },
            { value: 1, label: 'Cambios leves', score: 1 },
            { value: 2, label: 'Cambios moderados', score: 2 },
            { value: 3, label: 'Cambios severos', score: 3 }
          ],
          scoring: {
            type: 'direct',
            points: 0
          },
          metadata: {
            symptomType: 'mood_changes',
            nonMotorSymptom: true,
            neuropsychiatricSymptom: true
          }
        }
      ]
    },
    {
      id: 'daily_activities',
      name: 'Actividades Diarias',
      description: 'Impacto en las actividades de la vida diaria',
      order: 3,
      timeLimit: 120, // 2 minutes
      instructions: 'Estas preguntas evalúan cómo los síntomas pueden estar afectando sus actividades diarias.',
      questions: [
        {
          id: 'parkinsons_handwriting',
          type: 'likert_scale',
          text: '¿Ha notado que su letra se ha vuelto más pequeña o más difícil de leer?',
          instructions: 'Compare su escritura actual con la de hace algunos años.',
          order: 1,
          required: true,
          options: [
            { value: 0, label: 'No he notado cambios', score: 0 },
            { value: 1, label: 'Ligeramente más pequeña', score: 1 },
            { value: 2, label: 'Notablemente más pequeña', score: 2 },
            { value: 3, label: 'Muy difícil de leer', score: 3 }
          ],
          scoring: {
            type: 'direct',
            points: 0
          },
          metadata: {
            symptomType: 'micrographia',
            functionalImpact: true
          }
        },
        {
          id: 'parkinsons_voice',
          type: 'likert_scale',
          text: '¿Ha notado cambios en su voz (más suave, ronca o monótona)?',
          instructions: 'Considere si otros le han comentado sobre cambios en su voz.',
          order: 2,
          required: true,
          options: [
            { value: 0, label: 'No he notado cambios', score: 0 },
            { value: 1, label: 'Cambios leves', score: 1 },
            { value: 2, label: 'Cambios moderados', score: 2 },
            { value: 3, label: 'Cambios severos', score: 3 }
          ],
          scoring: {
            type: 'direct',
            points: 0
          },
          metadata: {
            symptomType: 'hypophonia',
            functionalImpact: true
          }
        },
        {
          id: 'parkinsons_facial_expression',
          type: 'likert_scale',
          text: '¿Le han dicho que su expresión facial parece menos animada o que parece triste/enojado sin estarlo?',
          instructions: 'Considere comentarios de familiares o amigos sobre su expresión facial.',
          order: 3,
          required: true,
          options: [
            { value: 0, label: 'Nunca', score: 0 },
            { value: 1, label: 'Ocasionalmente', score: 1 },
            { value: 2, label: 'Frecuentemente', score: 2 },
            { value: 3, label: 'Constantemente', score: 3 }
          ],
          scoring: {
            type: 'direct',
            points: 0
          },
          metadata: {
            symptomType: 'masked_facies',
            functionalImpact: true,
            socialImpact: true
          }
        }
      ]
    }
  ],
  scoringConfig: {
    maxScore: 44, // 5*4 + 4*3 + 3*3 = 20 + 12 + 9 = 41, rounded to 44 for flexibility
    minScore: 0,
    sections: [
      { sectionId: 'motor_symptoms', maxScore: 20, weight: 2 }, // Motor symptoms weighted more heavily
      { sectionId: 'non_motor_symptoms', maxScore: 12, weight: 1.5 },
      { sectionId: 'daily_activities', maxScore: 9, weight: 1 }
    ],
    formula: 'weighted_sum'
  },
  riskMapping: {
    ranges: [
      {
        category: 'low',
        scoreRange: { min: 0, max: 8 },
        riskRange: { min: 0, max: 10 },
        description: 'Riesgo bajo de Parkinson',
        recommendations: [
          'Mantener actividad física regular',
          'Dieta rica en antioxidantes',
          'Evitar exposición a toxinas',
          'Monitoreo anual de rutina'
        ]
      },
      {
        category: 'moderate',
        scoreRange: { min: 9, max: 18 },
        riskRange: { min: 10, max: 50 },
        description: 'Síntomas que requieren evaluación médica',
        recommendations: [
          'Consulta con neurólogo',
          'Evaluación clínica detallada',
          'Considerar DaTscan si está disponible',
          'Monitoreo cada 6 meses',
          'Mantener actividad física'
        ]
      },
      {
        category: 'high',
        scoreRange: { min: 19, max: 44 },
        riskRange: { min: 50, max: 90 },
        description: 'Síntomas sugestivos de Parkinson - evaluación urgente',
        recommendations: [
          'Evaluación neurológica especializada inmediata',
          'Estudios de neuroimagen (DaTscan)',
          'Evaluación de respuesta a levodopa',
          'Considerar inicio de tratamiento',
          'Fisioterapia y terapia ocupacional',
          'Apoyo psicológico y familiar'
        ]
      }
    ],
    algorithm: 'weighted_threshold'
  },
  metadata: {
    version: '1.0',
    language: 'es',
    validatedPopulation: ['mexican', 'latin_american', 'spanish_speaking', 'adult', 'elderly'],
    clinicalReferences: [
      'Postuma, R. B., Berg, D., Stern, M., Poewe, W., Olanow, C. W., Oertel, W., ... & Deuschl, G. (2015). MDS clinical diagnostic criteria for Parkinson\'s disease. Movement Disorders, 30(12), 1591-1601.',
      'Siderowf, A., & Lang, A. E. (2012). Premotor Parkinson\'s disease: concepts and definitions. Movement Disorders, 27(5), 608-616.',
      'Rodríguez-Violante, M., Velásquez-Pérez, L., Cervantes-Arriaga, A., & Corona, T. (2013). Prevalence of Parkinson\'s disease in Mexico: A door-to-door survey in Junín, Yucatán state. Movement Disorders, 28(3), 348-351.'
    ],
    lastUpdated: new Date('2024-01-15'),
    author: 'NeuralHack Cognitive AI Team',
    license: 'Clinical Use - Research and Educational Purposes',
    notes: [
      'Esta herramienta es para detección temprana, no para diagnóstico definitivo',
      'Los síntomas no motores pueden aparecer años antes que los motores',
      'La evaluación clínica por un neurólogo es esencial para el diagnóstico',
      'El diagnóstico de Parkinson requiere al menos 2 de los 4 síntomas cardinales'
    ]
  }
};