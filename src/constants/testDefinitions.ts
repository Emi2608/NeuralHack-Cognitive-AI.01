import type { TestDefinition, TestType } from '../types/assessment';
import { mocaDefinition } from './moca.definition';
import { phq9Definition } from './phq9.definition';
import { mmseDefinition } from './mmse.definition';
import { ad8Definition } from './ad8.definition';
import { parkinsonsDefinition } from './parkinsons.definition';

// MoCA Test Definition
export const MOCA_DEFINITION: TestDefinition = {
  id: 'moca',
  name: 'MoCA',
  fullName: 'Evaluación Cognitiva de Montreal',
  description: 'Herramienta de detección para deterioro cognitivo leve que evalúa diferentes dominios cognitivos.',
  duration: 15,
  sections: [
    {
      id: 'visuospatial',
      name: 'Habilidades Visuoespaciales',
      description: 'Evaluación de habilidades visuoespaciales y ejecutivas',
      order: 1,
      timeLimit: 300, // 5 minutes
      instructions: 'Complete las siguientes tareas de dibujo y conexión.',
      questions: [
        {
          id: 'moca_trail_making',
          type: 'drawing_task',
          text: 'Conecte los números y letras alternando: 1-A-2-B-3-C-4-D-5',
          instructions: 'Dibuje líneas para conectar los círculos en orden alternando números y letras.',
          order: 1,
          required: true,
          timeLimit: 120,
          scoring: {
            type: 'direct',
            points: 1
          },
          section: 'visuospatial'
        },
        {
          id: 'moca_cube_copy',
          type: 'drawing_task',
          text: 'Copie el cubo exactamente como se muestra',
          instructions: 'Dibuje el cubo tridimensional manteniendo todas las líneas y proporciones.',
          order: 2,
          required: true,
          timeLimit: 120,
          scoring: {
            type: 'direct',
            points: 1
          },
          section: 'visuospatial'
        },
        {
          id: 'moca_clock_drawing',
          type: 'drawing_task',
          text: 'Dibuje un reloj que marque las 11:10',
          instructions: 'Dibuje un círculo, coloque los números y las manecillas para mostrar las 11:10.',
          order: 3,
          required: true,
          timeLimit: 180,
          scoring: {
            type: 'calculated',
            formula: 'contour + numbers + hands'
          },
          section: 'visuospatial'
        }
      ]
    },
    {
      id: 'naming',
      name: 'Denominación',
      description: 'Capacidad para nombrar objetos',
      order: 2,
      instructions: 'Nombre los siguientes animales.',
      questions: [
        {
          id: 'moca_naming_lion',
          type: 'text_input',
          text: '¿Qué animal es este?',
          instructions: 'Escriba el nombre del animal que ve en la imagen.',
          order: 1,
          required: true,
          scoring: {
            type: 'lookup',
            lookup: {
              'león': 1,
              'leon': 1,
              'leona': 1
            }
          },
          section: 'naming'
        },
        {
          id: 'moca_naming_rhino',
          type: 'text_input',
          text: '¿Qué animal es este?',
          instructions: 'Escriba el nombre del animal que ve en la imagen.',
          order: 2,
          required: true,
          scoring: {
            type: 'lookup',
            lookup: {
              'rinoceronte': 1,
              'rino': 1
            }
          },
          section: 'naming'
        },
        {
          id: 'moca_naming_camel',
          type: 'text_input',
          text: '¿Qué animal es este?',
          instructions: 'Escriba el nombre del animal que ve en la imagen.',
          order: 3,
          required: true,
          scoring: {
            type: 'lookup',
            lookup: {
              'camello': 1,
              'dromedario': 1
            }
          },
          section: 'naming'
        }
      ]
    },
    {
      id: 'memory',
      name: 'Memoria',
      description: 'Registro de palabras para recordar más tarde',
      order: 3,
      instructions: 'Voy a leer una lista de palabras. Escuche atentamente y repítalas.',
      questions: [
        {
          id: 'moca_memory_registration',
          type: 'memory_task',
          text: 'Repita estas palabras: CARA, SEDA, IGLESIA, CLAVEL, ROJO',
          instructions: 'Escuche las palabras y repítalas en el mismo orden.',
          order: 1,
          required: true,
          scoring: {
            type: 'direct',
            points: 0 // No points for registration, only for recall
          },
          section: 'memory',
          metadata: {
            words: ['CARA', 'SEDA', 'IGLESIA', 'CLAVEL', 'ROJO'],
            trials: 2
          }
        }
      ]
    },
    {
      id: 'attention',
      name: 'Atención',
      description: 'Evaluación de atención y concentración',
      order: 4,
      instructions: 'Realice las siguientes tareas de atención.',
      questions: [
        {
          id: 'moca_digit_span',
          type: 'attention_task',
          text: 'Repita los números en orden directo: 2-1-8-5-4',
          instructions: 'Escuche los números y repítalos en el mismo orden.',
          order: 1,
          required: true,
          scoring: {
            type: 'direct',
            points: 1
          },
          section: 'attention'
        },
        {
          id: 'moca_digit_span_backward',
          type: 'attention_task',
          text: 'Repita los números en orden inverso: 7-4-2',
          instructions: 'Escuche los números y repítalos en orden inverso.',
          order: 2,
          required: true,
          scoring: {
            type: 'direct',
            points: 1
          },
          section: 'attention'
        },
        {
          id: 'moca_vigilance',
          type: 'attention_task',
          text: 'Toque cuando escuche la letra A: F-B-A-C-M-N-A-A-J-K-L-B-A-F-A-K-D-E-A-A-A-J-A-M-O-F-A-A-B',
          instructions: 'Escuche atentamente y toque la pantalla cada vez que escuche la letra A.',
          order: 3,
          required: true,
          scoring: {
            type: 'calculated',
            formula: 'correct_taps - incorrect_taps'
          },
          section: 'attention'
        },
        {
          id: 'moca_serial_7s',
          type: 'numeric_input',
          text: 'Reste 7 de 100, y siga restando 7 de cada resultado',
          instructions: 'Comience con 100 y reste 7. Luego reste 7 del resultado y continúe.',
          order: 4,
          required: true,
          scoring: {
            type: 'calculated',
            formula: 'correct_subtractions'
          },
          section: 'attention',
          metadata: {
            expectedSequence: [93, 86, 79, 72, 65]
          }
        }
      ]
    },
    {
      id: 'language',
      name: 'Lenguaje',
      description: 'Evaluación de habilidades del lenguaje',
      order: 5,
      instructions: 'Complete las siguientes tareas de lenguaje.',
      questions: [
        {
          id: 'moca_sentence_repetition_1',
          type: 'text_input',
          text: 'Repita esta oración: "El gato siempre se esconde bajo el sofá cuando hay visitas"',
          instructions: 'Escuche atentamente y repita la oración exactamente como la escuchó.',
          order: 1,
          required: true,
          scoring: {
            type: 'direct',
            points: 1
          },
          section: 'language'
        },
        {
          id: 'moca_sentence_repetition_2',
          type: 'text_input',
          text: 'Repita esta oración: "Espero que él le entregue el mensaje una vez que ella regrese"',
          instructions: 'Escuche atentamente y repita la oración exactamente como la escuchó.',
          order: 2,
          required: true,
          scoring: {
            type: 'direct',
            points: 1
          },
          section: 'language'
        },
        {
          id: 'moca_verbal_fluency',
          type: 'text_input',
          text: 'Diga todas las palabras que pueda que comiencen con la letra F (en 1 minuto)',
          instructions: 'Tiene 60 segundos para decir todas las palabras que se le ocurran que comiencen con F.',
          order: 3,
          required: true,
          timeLimit: 60,
          scoring: {
            type: 'calculated',
            formula: 'words_count >= 11 ? 1 : 0'
          },
          section: 'language'
        }
      ]
    },
    {
      id: 'abstraction',
      name: 'Abstracción',
      description: 'Capacidad de pensamiento abstracto',
      order: 6,
      instructions: 'Explique en qué se parecen los siguientes pares de palabras.',
      questions: [
        {
          id: 'moca_similarities_1',
          type: 'text_input',
          text: '¿En qué se parecen un tren y una bicicleta?',
          instructions: 'Piense en qué tienen en común estos dos objetos.',
          order: 1,
          required: true,
          scoring: {
            type: 'lookup',
            lookup: {
              'transporte': 1,
              'vehiculos': 1,
              'vehículos': 1,
              'medios de transporte': 1,
              'se mueven': 1,
              'para moverse': 1
            }
          },
          section: 'abstraction'
        },
        {
          id: 'moca_similarities_2',
          type: 'text_input',
          text: '¿En qué se parecen un reloj y una regla?',
          instructions: 'Piense en qué tienen en común estos dos objetos.',
          order: 2,
          required: true,
          scoring: {
            type: 'lookup',
            lookup: {
              'miden': 1,
              'instrumentos de medida': 1,
              'para medir': 1,
              'medición': 1,
              'herramientas de medida': 1
            }
          },
          section: 'abstraction'
        }
      ]
    },
    {
      id: 'delayed_recall',
      name: 'Recuerdo Diferido',
      description: 'Recuerdo de las palabras aprendidas anteriormente',
      order: 7,
      instructions: 'Ahora trate de recordar las palabras que le dije al principio.',
      questions: [
        {
          id: 'moca_delayed_recall',
          type: 'memory_task',
          text: '¿Cuáles eran las 5 palabras que le dije al principio?',
          instructions: 'Trate de recordar las 5 palabras sin ayuda. Si no puede recordar alguna, le daré pistas.',
          order: 1,
          required: true,
          scoring: {
            type: 'calculated',
            formula: 'free_recall + cued_recall'
          },
          section: 'delayed_recall',
          metadata: {
            targetWords: ['CARA', 'SEDA', 'IGLESIA', 'CLAVEL', 'ROJO'],
            cues: {
              'CARA': 'parte del cuerpo',
              'SEDA': 'tipo de tela',
              'IGLESIA': 'edificio religioso',
              'CLAVEL': 'tipo de flor',
              'ROJO': 'color'
            }
          }
        }
      ]
    },
    {
      id: 'orientation',
      name: 'Orientación',
      description: 'Orientación en tiempo y espacio',
      order: 8,
      instructions: 'Responda las siguientes preguntas sobre la fecha y el lugar.',
      questions: [
        {
          id: 'moca_date',
          type: 'text_input',
          text: '¿Qué fecha es hoy?',
          instructions: 'Diga la fecha completa de hoy.',
          order: 1,
          required: true,
          scoring: {
            type: 'direct',
            points: 1
          },
          section: 'orientation'
        },
        {
          id: 'moca_month',
          type: 'text_input',
          text: '¿En qué mes estamos?',
          instructions: 'Diga el mes actual.',
          order: 2,
          required: true,
          scoring: {
            type: 'direct',
            points: 1
          },
          section: 'orientation'
        },
        {
          id: 'moca_year',
          type: 'text_input',
          text: '¿En qué año estamos?',
          instructions: 'Diga el año actual.',
          order: 3,
          required: true,
          scoring: {
            type: 'direct',
            points: 1
          },
          section: 'orientation'
        },
        {
          id: 'moca_day',
          type: 'text_input',
          text: '¿Qué día de la semana es hoy?',
          instructions: 'Diga qué día de la semana es hoy.',
          order: 4,
          required: true,
          scoring: {
            type: 'direct',
            points: 1
          },
          section: 'orientation'
        },
        {
          id: 'moca_place',
          type: 'text_input',
          text: '¿En qué lugar estamos?',
          instructions: 'Diga el nombre del lugar donde se encuentra.',
          order: 5,
          required: true,
          scoring: {
            type: 'direct',
            points: 1
          },
          section: 'orientation'
        },
        {
          id: 'moca_city',
          type: 'text_input',
          text: '¿En qué ciudad estamos?',
          instructions: 'Diga el nombre de la ciudad donde se encuentra.',
          order: 6,
          required: true,
          scoring: {
            type: 'direct',
            points: 1
          },
          section: 'orientation'
        }
      ]
    }
  ],
  scoringConfig: {
    maxScore: 30,
    minScore: 0,
    sections: [
      { sectionId: 'visuospatial', maxScore: 5 },
      { sectionId: 'naming', maxScore: 3 },
      { sectionId: 'memory', maxScore: 0 }, // No points for registration
      { sectionId: 'attention', maxScore: 6 },
      { sectionId: 'language', maxScore: 3 },
      { sectionId: 'abstraction', maxScore: 2 },
      { sectionId: 'delayed_recall', maxScore: 5 },
      { sectionId: 'orientation', maxScore: 6 }
    ],
    adjustments: [
      {
        type: 'education',
        condition: { field: 'educationLevel', operator: '<=', value: 12 },
        adjustment: 1,
        description: 'Ajuste por educación ≤12 años'
      }
    ]
  },
  riskMapping: {
    algorithm: 'threshold',
    ranges: [
      {
        category: 'low',
        scoreRange: { min: 26, max: 30 },
        riskRange: { min: 0, max: 5 },
        description: 'Cognición normal',
        recommendations: [
          'Mantener estilo de vida saludable',
          'Ejercicio regular',
          'Dieta mediterránea',
          'Actividades cognitivamente estimulantes'
        ]
      },
      {
        category: 'moderate',
        scoreRange: { min: 18, max: 25 },
        riskRange: { min: 5, max: 40 },
        description: 'Posible deterioro cognitivo leve',
        recommendations: [
          'Consulta con especialista en neurología',
          'Evaluación neuropsicológica completa',
          'Monitoreo regular',
          'Intervenciones de estilo de vida'
        ]
      },
      {
        category: 'high',
        scoreRange: { min: 0, max: 17 },
        riskRange: { min: 40, max: 100 },
        description: 'Probable deterioro cognitivo significativo',
        recommendations: [
          'Consulta urgente con neurólogo',
          'Evaluación diagnóstica completa',
          'Neuroimagen (RM cerebral)',
          'Evaluación de causas reversibles'
        ]
      }
    ]
  },
  metadata: {
    version: '7.1',
    language: 'es-MX',
    validatedPopulation: ['Mexican', 'Latin American', 'Spanish-speaking'],
    clinicalReferences: [
      'Nasreddine ZS, et al. The Montreal Cognitive Assessment, MoCA: a brief screening tool for mild cognitive impairment. J Am Geriatr Soc. 2005;53(4):695-699.',
      'Adaptación mexicana: Aguilar-Navarro SG, et al. Validity and reliability of the Spanish version of the Montreal Cognitive Assessment (MoCA) for the detection of cognitive impairment in Mexico. Rev Colomb Psiquiatr. 2018;47(4):237-243.'
    ],
    lastUpdated: new Date('2024-01-15'),
    author: 'NeuralHack Team',
    license: 'Clinical Use License'
  }
};

// PHQ-9 Test Definition
export const PHQ9_DEFINITION: TestDefinition = {
  id: 'phq9',
  name: 'PHQ-9',
  fullName: 'Cuestionario de Salud del Paciente-9',
  description: 'Herramienta de detección y evaluación de la gravedad de la depresión.',
  duration: 5,
  sections: [
    {
      id: 'depression_symptoms',
      name: 'Síntomas Depresivos',
      description: 'Evaluación de síntomas depresivos en las últimas 2 semanas',
      order: 1,
      instructions: 'Durante las últimas 2 semanas, ¿con qué frecuencia ha tenido molestias debido a los siguientes problemas?',
      questions: [
        {
          id: 'phq9_q1',
          type: 'likert_scale',
          text: 'Poco interés o placer en hacer cosas',
          order: 1,
          required: true,
          options: [
            { value: 0, label: 'Para nada', score: 0 },
            { value: 1, label: 'Varios días', score: 1 },
            { value: 2, label: 'Más de la mitad de los días', score: 2 },
            { value: 3, label: 'Casi todos los días', score: 3 }
          ],
          scoring: { type: 'direct' },
          section: 'depression_symptoms'
        },
        {
          id: 'phq9_q2',
          type: 'likert_scale',
          text: 'Se ha sentido decaído(a), deprimido(a) o sin esperanzas',
          order: 2,
          required: true,
          options: [
            { value: 0, label: 'Para nada', score: 0 },
            { value: 1, label: 'Varios días', score: 1 },
            { value: 2, label: 'Más de la mitad de los días', score: 2 },
            { value: 3, label: 'Casi todos los días', score: 3 }
          ],
          scoring: { type: 'direct' },
          section: 'depression_symptoms'
        },
        {
          id: 'phq9_q3',
          type: 'likert_scale',
          text: 'Dificultad para quedarse o permanecer dormido(a), o dormir demasiado',
          order: 3,
          required: true,
          options: [
            { value: 0, label: 'Para nada', score: 0 },
            { value: 1, label: 'Varios días', score: 1 },
            { value: 2, label: 'Más de la mitad de los días', score: 2 },
            { value: 3, label: 'Casi todos los días', score: 3 }
          ],
          scoring: { type: 'direct' },
          section: 'depression_symptoms'
        },
        {
          id: 'phq9_q4',
          type: 'likert_scale',
          text: 'Se ha sentido cansado(a) o con poca energía',
          order: 4,
          required: true,
          options: [
            { value: 0, label: 'Para nada', score: 0 },
            { value: 1, label: 'Varios días', score: 1 },
            { value: 2, label: 'Más de la mitad de los días', score: 2 },
            { value: 3, label: 'Casi todos los días', score: 3 }
          ],
          scoring: { type: 'direct' },
          section: 'depression_symptoms'
        },
        {
          id: 'phq9_q5',
          type: 'likert_scale',
          text: 'Falta de apetito o comer en exceso',
          order: 5,
          required: true,
          options: [
            { value: 0, label: 'Para nada', score: 0 },
            { value: 1, label: 'Varios días', score: 1 },
            { value: 2, label: 'Más de la mitad de los días', score: 2 },
            { value: 3, label: 'Casi todos los días', score: 3 }
          ],
          scoring: { type: 'direct' },
          section: 'depression_symptoms'
        },
        {
          id: 'phq9_q6',
          type: 'likert_scale',
          text: 'Se ha sentido mal con usted mismo(a) — o que es un fracaso o que ha quedado mal con usted mismo(a) o con su familia',
          order: 6,
          required: true,
          options: [
            { value: 0, label: 'Para nada', score: 0 },
            { value: 1, label: 'Varios días', score: 1 },
            { value: 2, label: 'Más de la mitad de los días', score: 2 },
            { value: 3, label: 'Casi todos los días', score: 3 }
          ],
          scoring: { type: 'direct' },
          section: 'depression_symptoms'
        },
        {
          id: 'phq9_q7',
          type: 'likert_scale',
          text: 'Dificultad para concentrarse en cosas, tales como leer el periódico o ver la televisión',
          order: 7,
          required: true,
          options: [
            { value: 0, label: 'Para nada', score: 0 },
            { value: 1, label: 'Varios días', score: 1 },
            { value: 2, label: 'Más de la mitad de los días', score: 2 },
            { value: 3, label: 'Casi todos los días', score: 3 }
          ],
          scoring: { type: 'direct' },
          section: 'depression_symptoms'
        },
        {
          id: 'phq9_q8',
          type: 'likert_scale',
          text: '¿Se ha movido o hablado tan lento que otras personas podrían haberlo(a) notado? O lo contrario — muy inquieto(a) o agitado(a), ha estado moviéndose mucho más de lo normal',
          order: 8,
          required: true,
          options: [
            { value: 0, label: 'Para nada', score: 0 },
            { value: 1, label: 'Varios días', score: 1 },
            { value: 2, label: 'Más de la mitad de los días', score: 2 },
            { value: 3, label: 'Casi todos los días', score: 3 }
          ],
          scoring: { type: 'direct' },
          section: 'depression_symptoms'
        },
        {
          id: 'phq9_q9',
          type: 'likert_scale',
          text: 'Pensamientos de que estaría mejor muerto(a) o de lastimarse de alguna manera',
          order: 9,
          required: true,
          options: [
            { value: 0, label: 'Para nada', score: 0 },
            { value: 1, label: 'Varios días', score: 1 },
            { value: 2, label: 'Más de la mitad de los días', score: 2 },
            { value: 3, label: 'Casi todos los días', score: 3 }
          ],
          scoring: { type: 'direct' },
          section: 'depression_symptoms',
          metadata: {
            suicidalIdeation: true,
            criticalQuestion: true
          }
        }
      ]
    }
  ],
  scoringConfig: {
    maxScore: 27,
    minScore: 0,
    sections: [
      { sectionId: 'depression_symptoms', maxScore: 27 }
    ]
  },
  riskMapping: {
    algorithm: 'threshold',
    ranges: [
      {
        category: 'low',
        scoreRange: { min: 0, max: 4 },
        riskRange: { min: 0, max: 5 },
        description: 'Depresión mínima',
        recommendations: [
          'Mantener rutinas saludables',
          'Ejercicio regular',
          'Técnicas de manejo del estrés',
          'Apoyo social'
        ]
      },
      {
        category: 'low',
        scoreRange: { min: 5, max: 9 },
        riskRange: { min: 5, max: 20 },
        description: 'Depresión leve',
        recommendations: [
          'Monitoreo de síntomas',
          'Intervenciones de autoayuda',
          'Ejercicio y actividad física',
          'Considerar terapia psicológica'
        ]
      },
      {
        category: 'moderate',
        scoreRange: { min: 10, max: 14 },
        riskRange: { min: 20, max: 40 },
        description: 'Depresión moderada',
        recommendations: [
          'Evaluación por profesional de salud mental',
          'Terapia psicológica',
          'Considerar tratamiento farmacológico',
          'Seguimiento regular'
        ]
      },
      {
        category: 'high',
        scoreRange: { min: 15, max: 19 },
        riskRange: { min: 40, max: 70 },
        description: 'Depresión moderadamente severa',
        recommendations: [
          'Tratamiento inmediato con especialista',
          'Terapia psicológica intensiva',
          'Tratamiento farmacológico',
          'Evaluación de riesgo suicida'
        ]
      },
      {
        category: 'high',
        scoreRange: { min: 20, max: 27 },
        riskRange: { min: 70, max: 100 },
        description: 'Depresión severa',
        recommendations: [
          'Atención psiquiátrica urgente',
          'Hospitalización si hay riesgo suicida',
          'Tratamiento farmacológico intensivo',
          'Terapia psicológica especializada'
        ]
      }
    ]
  },
  metadata: {
    version: '1.0',
    language: 'es-MX',
    validatedPopulation: ['Mexican', 'Latin American', 'Spanish-speaking'],
    clinicalReferences: [
      'Kroenke K, Spitzer RL, Williams JB. The PHQ-9: validity of a brief depression severity measure. J Gen Intern Med. 2001;16(9):606-613.',
      'Adaptación mexicana: Familiar I, et al. Mexican version of the Patient Health Questionnaire (PHQ-9): Tool for detection of depression in primary care. Aten Primaria. 2020;52(10):669-676.'
    ],
    lastUpdated: new Date('2024-01-15'),
    author: 'NeuralHack Team',
    license: 'Clinical Use License'
  }
};

// Test definitions registry
export const TEST_DEFINITIONS: Record<TestType, TestDefinition> = {
  moca: mocaDefinition,
  phq9: phq9Definition,
  mmse: mmseDefinition,
  ad8: ad8Definition,
  parkinsons: parkinsonsDefinition
};

// Helper function to get test definition
export function getTestDefinition(testType: TestType): TestDefinition {
  const definition = TEST_DEFINITIONS[testType];
  if (!definition || Object.keys(definition).length === 0) {
    throw new Error(`Test definition not found for ${testType}`);
  }
  return definition;
}

// Helper function to get all available tests
export function getAvailableTests(): TestType[] {
  return Object.keys(TEST_DEFINITIONS) as TestType[];
}