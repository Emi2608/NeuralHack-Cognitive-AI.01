// MoCA Test Definition - Montreal Cognitive Assessment
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
export const mocaDefinition: TestDefinition = {
  id: 'moca',
  name: 'MoCA',
  fullName: 'Evaluación Cognitiva de Montreal',
  description: 'Evaluación cognitiva breve diseñada para detectar deterioro cognitivo leve',
  duration: 15, // 15 minutes
  sections: [
    {
      id: 'visuospatial',
      name: 'Habilidades Visuoespaciales/Ejecutivas',
      description: 'Evaluación de habilidades visuoespaciales y funciones ejecutivas',
      order: 1,
      timeLimit: 300, // 5 minutes
      instructions: 'En esta sección evaluaremos sus habilidades visuoespaciales y ejecutivas a través de tareas de dibujo y conexión.',
      questions: [
        {
          id: 'moca_trail_making',
          type: 'attention_task',
          text: 'Conecte los números y letras alternando en orden ascendente',
          instructions: 'Dibuje líneas para conectar los círculos alternando entre números y letras: 1-A-2-B-3-C-4-D-5',
          order: 1,
          required: true,
          timeLimit: 120,
          scoring: {
            type: 'direct',
            points: 1
          },
          metadata: {
            taskType: 'trail_making_b',
            maxErrors: 2
          }
        },
        {
          id: 'moca_cube_copy',
          type: 'drawing_task',
          text: 'Copie este cubo exactamente como lo ve',
          instructions: 'Dibuje el cubo en el espacio proporcionado. Trate de mantener las proporciones y la perspectiva 3D.',
          order: 2,
          required: true,
          timeLimit: 180,
          scoring: {
            type: 'custom',
            customScorer: (answer: any) => {
              // Scoring based on 3D perspective, parallel lines, etc.
              return 1; // Placeholder - will be implemented with drawing analysis
            }
          },
          metadata: {
            drawingType: 'cube',
            scoringCriteria: ['3d_perspective', 'parallel_lines', 'depth', 'proportions']
          }
        },
        {
          id: 'moca_clock_drawing',
          type: 'drawing_task',
          text: 'Dibuje un reloj que marque las 11:10',
          instructions: 'Dibuje un reloj completo con números y manecillas que marquen las 11:10 (diez minutos después de las once).',
          order: 3,
          required: true,
          timeLimit: 180,
          scoring: {
            type: 'custom',
            customScorer: (answer: any) => {
              // Clock drawing scoring: circle, numbers, hands, time
              return 3; // Placeholder - max 3 points
            }
          },
          metadata: {
            drawingType: 'clock',
            targetTime: '11:10',
            scoringCriteria: ['circle', 'numbers', 'hands', 'time_accuracy']
          }
        }
      ]
    },
    {
      id: 'naming',
      name: 'Denominación',
      description: 'Capacidad para nombrar objetos',
      order: 2,
      timeLimit: 120,
      instructions: 'Se le mostrarán imágenes de animales. Diga el nombre de cada animal.',
      questions: [
        {
          id: 'moca_naming_lion',
          type: 'text_input',
          text: '¿Cómo se llama este animal?',
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
          metadata: {
            image: 'lion.jpg',
            acceptedAnswers: ['león', 'leon', 'leona']
          }
        },
        {
          id: 'moca_naming_rhino',
          type: 'text_input',
          text: '¿Cómo se llama este animal?',
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
          metadata: {
            image: 'rhino.jpg',
            acceptedAnswers: ['rinoceronte', 'rino']
          }
        },
        {
          id: 'moca_naming_camel',
          type: 'text_input',
          text: '¿Cómo se llama este animal?',
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
          metadata: {
            image: 'camel.jpg',
            acceptedAnswers: ['camello', 'dromedario']
          }
        }
      ]
    },
    {
      id: 'memory',
      name: 'Memoria',
      description: 'Registro de memoria inmediata',
      order: 3,
      timeLimit: 180,
      instructions: 'Le voy a leer una lista de palabras. Escuche atentamente y trate de recordarlas.',
      questions: [
        {
          id: 'moca_memory_registration',
          type: 'memory_task',
          text: 'Memorice estas 5 palabras. Las necesitará más tarde.',
          instructions: 'Escuche y repita estas palabras. Trate de recordarlas porque se las preguntaré al final.',
          order: 1,
          required: true,
          scoring: {
            type: 'direct',
            points: 0 // No points for registration, points given in delayed recall
          },
          metadata: {
            words: ['CARA', 'SEDA', 'IGLESIA', 'CLAVEL', 'ROJO'],
            memorizationTime: 30,
            distractionTime: 0, // No distraction in registration
            maxAttempts: 2
          }
        }
      ]
    },
    {
      id: 'attention',
      name: 'Atención',
      description: 'Evaluación de atención y concentración',
      order: 4,
      timeLimit: 300,
      instructions: 'En esta sección evaluaremos su capacidad de atención y concentración.',
      questions: [
        {
          id: 'moca_digit_span_forward',
          type: 'attention_task',
          text: 'Repita estos números en el mismo orden',
          instructions: 'Escuche la secuencia de números y repítala exactamente en el mismo orden.',
          order: 1,
          required: true,
          scoring: {
            type: 'direct',
            points: 1
          },
          metadata: {
            taskType: 'digit_span',
            direction: 'forward',
            startLevel: 5,
            maxLevel: 8,
            sequences: [
              [2, 1, 8, 5, 4],
              [7, 4, 2],
              [9, 4, 3, 7, 6, 2]
            ]
          }
        },
        {
          id: 'moca_digit_span_backward',
          type: 'attention_task',
          text: 'Repita estos números en orden inverso',
          instructions: 'Escuche la secuencia de números y repítala en orden inverso (del último al primero).',
          order: 2,
          required: true,
          scoring: {
            type: 'direct',
            points: 1
          },
          metadata: {
            taskType: 'digit_span',
            direction: 'backward',
            startLevel: 4,
            maxLevel: 7,
            sequences: [
              [7, 4, 2],
              [5, 8, 2],
              [6, 2, 9, 7]
            ]
          }
        },
        {
          id: 'moca_vigilance',
          type: 'attention_task',
          text: 'Toque cuando escuche la letra A',
          instructions: 'Le voy a leer una serie de letras. Toque la pantalla cada vez que escuche la letra A.',
          order: 3,
          required: true,
          scoring: {
            type: 'calculated',
            formula: 'correct_responses >= 3 ? 1 : 0'
          },
          metadata: {
            taskType: 'vigilance',
            targetLetter: 'A',
            sequence: ['F', 'B', 'A', 'C', 'M', 'N', 'A', 'A', 'J', 'K', 'L', 'B', 'A', 'F', 'A', 'K', 'D', 'E', 'A', 'A', 'A', 'J', 'A', 'M', 'O', 'F', 'A', 'A', 'B'],
            targetCount: 10
          }
        },
        {
          id: 'moca_serial_7s',
          type: 'numeric_input',
          text: 'Reste 7 de 100, y siga restando 7 del resultado',
          instructions: 'Comience con 100 y reste 7. Luego reste 7 del resultado y continúe. Dé los primeros 5 resultados.',
          order: 4,
          required: true,
          scoring: {
            type: 'custom',
            customScorer: (answer: any) => {
              const expected = [93, 86, 79, 72, 65];
              const userAnswers = Array.isArray(answer) ? answer : [answer];
              let correct = 0;
              for (let i = 0; i < Math.min(5, userAnswers.length); i++) {
                if (userAnswers[i] === expected[i]) correct++;
              }
              return correct >= 3 ? 1 : 0;
            }
          },
          metadata: {
            expectedAnswers: [93, 86, 79, 72, 65],
            minCorrect: 3
          }
        }
      ]
    },
    {
      id: 'language',
      name: 'Lenguaje',
      description: 'Evaluación de habilidades del lenguaje',
      order: 5,
      timeLimit: 240,
      instructions: 'En esta sección evaluaremos sus habilidades del lenguaje.',
      questions: [
        {
          id: 'moca_sentence_repetition_1',
          type: 'text_input',
          text: 'Repita exactamente esta frase: "El gato siempre se esconde bajo el sofá cuando hay visitas"',
          instructions: 'Escuche atentamente y repita la frase exactamente como la escuchó.',
          order: 1,
          required: true,
          scoring: {
            type: 'lookup',
            lookup: {
              'el gato siempre se esconde bajo el sofá cuando hay visitas': 1,
              'el gato siempre se esconde bajo el sofa cuando hay visitas': 1
            }
          },
          metadata: {
            exactMatch: true,
            targetSentence: 'El gato siempre se esconde bajo el sofá cuando hay visitas'
          }
        },
        {
          id: 'moca_sentence_repetition_2',
          type: 'text_input',
          text: 'Repita exactamente esta frase: "Espero que él le entregue el mensaje una vez que ella se lo pida"',
          instructions: 'Escuche atentamente y repita la frase exactamente como la escuchó.',
          order: 2,
          required: true,
          scoring: {
            type: 'lookup',
            lookup: {
              'espero que él le entregue el mensaje una vez que ella se lo pida': 1,
              'espero que el le entregue el mensaje una vez que ella se lo pida': 1
            }
          },
          metadata: {
            exactMatch: true,
            targetSentence: 'Espero que él le entregue el mensaje una vez que ella se lo pida'
          }
        },
        {
          id: 'moca_fluency',
          type: 'text_input',
          text: 'Diga todas las palabras que pueda que comiencen con la letra F en un minuto',
          instructions: 'Tiene un minuto para decir todas las palabras que se le ocurran que comiencen con la letra F. No incluya nombres propios.',
          order: 3,
          required: true,
          timeLimit: 60,
          scoring: {
            type: 'custom',
            customScorer: (answer: any) => {
              const words = typeof answer === 'string' ? answer.split(/\s+/).filter(w => w.length > 0) : [];
              return words.length >= 11 ? 1 : 0;
            }
          },
          metadata: {
            letter: 'F',
            minWords: 11,
            excludeProperNouns: true
          }
        }
      ]
    },
    {
      id: 'abstraction',
      name: 'Abstracción',
      description: 'Capacidad de pensamiento abstracto',
      order: 6,
      timeLimit: 180,
      instructions: 'Le voy a dar pares de palabras. Dígame qué tienen en común.',
      questions: [
        {
          id: 'moca_abstraction_1',
          type: 'text_input',
          text: '¿En qué se parecen un tren y una bicicleta?',
          instructions: 'Piense en qué tienen en común estos dos objetos.',
          order: 1,
          required: true,
          scoring: {
            type: 'lookup',
            lookup: {
              'transporte': 1,
              'medios de transporte': 1,
              'vehículos': 1,
              'vehiculos': 1,
              'se mueven': 1,
              'sirven para moverse': 1,
              'para transportarse': 1
            }
          },
          metadata: {
            acceptedCategories: ['transporte', 'vehículos', 'movilidad']
          }
        },
        {
          id: 'moca_abstraction_2',
          type: 'text_input',
          text: '¿En qué se parecen un reloj y una regla?',
          instructions: 'Piense en qué tienen en común estos dos objetos.',
          order: 2,
          required: true,
          scoring: {
            type: 'lookup',
            lookup: {
              'instrumentos de medición': 1,
              'instrumentos de medicion': 1,
              'miden': 1,
              'sirven para medir': 1,
              'herramientas de medición': 1,
              'herramientas de medicion': 1
            }
          },
          metadata: {
            acceptedCategories: ['medición', 'instrumentos', 'herramientas']
          }
        }
      ]
    },
    {
      id: 'delayed_recall',
      name: 'Recuerdo Diferido',
      description: 'Memoria a largo plazo',
      order: 7,
      timeLimit: 180,
      instructions: 'Ahora trate de recordar las 5 palabras que le dije al principio.',
      questions: [
        {
          id: 'moca_delayed_recall',
          type: 'memory_task',
          text: 'Recuerde las 5 palabras que memorizó al principio',
          instructions: 'Sin ayuda, trate de recordar las 5 palabras que le dije al principio de la evaluación.',
          order: 1,
          required: true,
          scoring: {
            type: 'custom',
            customScorer: (answer: any) => {
              const targetWords = ['CARA', 'SEDA', 'IGLESIA', 'CLAVEL', 'ROJO'];
              const recalledWords = answer?.recalledWords || [];
              let score = 0;
              targetWords.forEach(word => {
                if (recalledWords.some((recalled: string) => 
                  recalled.toUpperCase() === word.toUpperCase())) {
                  score++;
                }
              });
              return score; // 0-5 points
            }
          },
          metadata: {
            words: ['CARA', 'SEDA', 'IGLESIA', 'CLAVEL', 'ROJO'],
            phase: 'recall',
            withCues: false,
            maxPoints: 5
          }
        }
      ]
    },
    {
      id: 'orientation',
      name: 'Orientación',
      description: 'Orientación temporal y espacial',
      order: 8,
      timeLimit: 120,
      instructions: 'Le voy a hacer algunas preguntas sobre la fecha y el lugar.',
      questions: [
        {
          id: 'moca_orientation_date',
          type: 'text_input',
          text: '¿Qué fecha es hoy? (día, mes, año)',
          instructions: 'Dígame la fecha completa de hoy.',
          order: 1,
          required: true,
          scoring: {
            type: 'custom',
            customScorer: (answer: any) => {
              // Score based on accuracy of date components
              const today = new Date();
              // Implementation would check day, month, year
              return 1; // Placeholder
            }
          },
          metadata: {
            components: ['day', 'month', 'year'],
            maxPoints: 1
          }
        },
        {
          id: 'moca_orientation_day',
          type: 'text_input',
          text: '¿Qué día de la semana es hoy?',
          instructions: 'Dígame qué día de la semana es hoy.',
          order: 2,
          required: true,
          scoring: {
            type: 'custom',
            customScorer: (answer: any) => {
              const today = new Date();
              const days = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
              const correctDay = days[today.getDay()];
              return answer?.toLowerCase() === correctDay ? 1 : 0;
            }
          }
        },
        {
          id: 'moca_orientation_place',
          type: 'text_input',
          text: '¿En qué lugar estamos?',
          instructions: 'Dígame el nombre del lugar donde estamos ahora.',
          order: 3,
          required: true,
          scoring: {
            type: 'direct',
            points: 1
          },
          metadata: {
            acceptGeneral: true
          }
        },
        {
          id: 'moca_orientation_city',
          type: 'text_input',
          text: '¿En qué ciudad estamos?',
          instructions: 'Dígame el nombre de la ciudad donde estamos.',
          order: 4,
          required: true,
          scoring: {
            type: 'direct',
            points: 1
          }
        }
      ]
    }
  ],
  scoringConfig: {
    maxScore: 30,
    minScore: 0,
    sections: [
      { sectionId: 'visuospatial', maxScore: 5, weight: 1 },
      { sectionId: 'naming', maxScore: 3, weight: 1 },
      { sectionId: 'memory', maxScore: 0, weight: 1 }, // No points in registration
      { sectionId: 'attention', maxScore: 6, weight: 1 },
      { sectionId: 'language', maxScore: 3, weight: 1 },
      { sectionId: 'abstraction', maxScore: 2, weight: 1 },
      { sectionId: 'delayed_recall', maxScore: 5, weight: 1 },
      { sectionId: 'orientation', maxScore: 6, weight: 1 }
    ],
    adjustments: [
      {
        type: 'education',
        condition: { field: 'educationLevel', operator: '<=', value: 12 },
        adjustment: 1,
        description: 'Ajuste por educación ≤12 años: +1 punto'
      }
    ]
  },
  riskMapping: {
    ranges: [
      {
        category: 'high',
        scoreRange: { min: 0, max: 17 },
        riskRange: { min: 70, max: 95 },
        description: 'Puntuación que sugiere deterioro cognitivo significativo',
        recommendations: [
          'Consulte con un neurólogo o geriatra inmediatamente',
          'Realice estudios neuropsicológicos completos',
          'Considere estudios de neuroimagen'
        ]
      },
      {
        category: 'moderate',
        scoreRange: { min: 18, max: 25 },
        riskRange: { min: 30, max: 69 },
        description: 'Puntuación que sugiere deterioro cognitivo leve',
        recommendations: [
          'Consulte con su médico de cabecera',
          'Considere evaluación neuropsicológica',
          'Mantenga actividad física y mental regular'
        ]
      },
      {
        category: 'low',
        scoreRange: { min: 26, max: 30 },
        riskRange: { min: 5, max: 29 },
        description: 'Puntuación normal',
        recommendations: [
          'Mantenga un estilo de vida saludable',
          'Continúe con actividad física regular',
          'Mantenga actividad mental estimulante'
        ]
      }
    ],
    algorithm: 'threshold'
  },
  metadata: {
    version: '8.1',
    language: 'es',
    validatedPopulation: ['mexican', 'latin_american', 'spanish_speaking'],
    clinicalReferences: [
      'Nasreddine, Z. S., et al. (2005). The Montreal Cognitive Assessment, MoCA: a brief screening tool for mild cognitive impairment. Journal of the American Geriatrics Society, 53(4), 695-699.',
      'Aguilar-Navarro, S. G., et al. (2018). Validity and reliability of the Spanish version of the Montreal Cognitive Assessment (MoCA) for the detection of cognitive impairment in Mexico. Revista Colombiana de Psiquiatría, 47(4), 237-243.'
    ],
    lastUpdated: new Date('2024-01-15'),
    author: 'NeuralHack Cognitive AI Team',
    license: 'Clinical Use - MoCA© Official Spanish Version'
  }
};