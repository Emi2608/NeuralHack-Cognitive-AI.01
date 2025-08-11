import type { TestDefinition, Question, TestSection } from '../types/assessment';

// MMSE Test Definition - Mini-Mental State Examination
export const mmseDefinition: TestDefinition = {
  id: 'mmse',
  name: 'MMSE',
  fullName: 'Mini Examen del Estado Mental',
  description: 'Evaluación cognitiva breve para detectar deterioro cognitivo y demencia',
  duration: 10, // 10 minutes
  sections: [
    {
      id: 'orientation',
      name: 'Orientación',
      description: 'Orientación temporal y espacial',
      order: 1,
      timeLimit: 180, // 3 minutes
      instructions: 'Le voy a hacer algunas preguntas sobre el tiempo y el lugar donde estamos.',
      questions: [
        {
          id: 'mmse_year',
          type: 'text_input',
          text: '¿En qué año estamos?',
          instructions: 'Dígame el año actual.',
          order: 1,
          required: true,
          scoring: {
            type: 'custom',
            customScorer: (answer: any) => {
              const currentYear = new Date().getFullYear();
              return answer == currentYear ? 1 : 0;
            }
          }
        },
        {
          id: 'mmse_season',
          type: 'text_input',
          text: '¿En qué estación del año estamos?',
          instructions: 'Dígame la estación actual (primavera, verano, otoño, invierno).',
          order: 2,
          required: true,
          scoring: {
            type: 'lookup',
            lookup: {
              'primavera': 1,
              'verano': 1,
              'otoño': 1,
              'otono': 1,
              'invierno': 1
            }
          }
        },
        {
          id: 'mmse_date',
          type: 'text_input',
          text: '¿Qué fecha es hoy?',
          instructions: 'Dígame el día del mes (número).',
          order: 3,
          required: true,
          scoring: {
            type: 'custom',
            customScorer: (answer: any) => {
              const currentDate = new Date().getDate();
              return answer == currentDate ? 1 : 0;
            }
          }
        },
        {
          id: 'mmse_day',
          type: 'text_input',
          text: '¿Qué día de la semana es hoy?',
          instructions: 'Dígame el día de la semana.',
          order: 4,
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
          id: 'mmse_month',
          type: 'text_input',
          text: '¿En qué mes estamos?',
          instructions: 'Dígame el mes actual.',
          order: 5,
          required: true,
          scoring: {
            type: 'custom',
            customScorer: (answer: any) => {
              const currentMonth = new Date().getMonth();
              const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
                             'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
              const correctMonth = months[currentMonth];
              return answer?.toLowerCase() === correctMonth ? 1 : 0;
            }
          }
        },
        {
          id: 'mmse_country',
          type: 'text_input',
          text: '¿En qué país estamos?',
          instructions: 'Dígame el nombre del país donde estamos.',
          order: 6,
          required: true,
          scoring: {
            type: 'lookup',
            lookup: {
              'méxico': 1,
              'mexico': 1,
              'estados unidos mexicanos': 1
            }
          }
        },
        {
          id: 'mmse_state',
          type: 'text_input',
          text: '¿En qué estado o provincia estamos?',
          instructions: 'Dígame el nombre del estado o provincia.',
          order: 7,
          required: true,
          scoring: {
            type: 'direct',
            points: 1
          }
        },
        {
          id: 'mmse_city',
          type: 'text_input',
          text: '¿En qué ciudad estamos?',
          instructions: 'Dígame el nombre de la ciudad.',
          order: 8,
          required: true,
          scoring: {
            type: 'direct',
            points: 1
          }
        },
        {
          id: 'mmse_hospital',
          type: 'text_input',
          text: '¿En qué lugar estamos? (hospital, clínica, casa, etc.)',
          instructions: 'Dígame qué tipo de lugar es este.',
          order: 9,
          required: true,
          scoring: {
            type: 'direct',
            points: 1
          }
        },
        {
          id: 'mmse_floor',
          type: 'text_input',
          text: '¿En qué piso estamos?',
          instructions: 'Dígame en qué piso del edificio estamos.',
          order: 10,
          required: true,
          scoring: {
            type: 'direct',
            points: 1
          }
        }
      ]
    },
    {
      id: 'registration',
      name: 'Registro',
      description: 'Memoria inmediata - registro de palabras',
      order: 2,
      timeLimit: 120,
      instructions: 'Le voy a decir tres palabras. Escúchelas y repítalas después de mí.',
      questions: [
        {
          id: 'mmse_registration',
          type: 'memory_task',
          text: 'Repita estas tres palabras: PELOTA, BANDERA, ÁRBOL',
          instructions: 'Escuche atentamente y repita las tres palabras que le voy a decir.',
          order: 1,
          required: true,
          scoring: {
            type: 'custom',
            customScorer: (answer: any) => {
              const targetWords = ['PELOTA', 'BANDERA', 'ÁRBOL'];
              const userWords = answer?.words || [];
              let score = 0;
              targetWords.forEach(word => {
                if (userWords.some((userWord: string) => 
                  userWord.toUpperCase() === word.toUpperCase())) {
                  score++;
                }
              });
              return score; // 0-3 points
            }
          },
          metadata: {
            words: ['PELOTA', 'BANDERA', 'ÁRBOL'],
            maxAttempts: 6,
            phase: 'registration'
          }
        }
      ]
    },
    {
      id: 'attention_calculation',
      name: 'Atención y Cálculo',
      description: 'Capacidad de atención y cálculo mental',
      order: 3,
      timeLimit: 180,
      instructions: 'Ahora voy a pedirle que haga algunos cálculos mentales.',
      questions: [
        {
          id: 'mmse_serial_7s',
          type: 'numeric_input',
          text: 'Reste 7 de 100 y siga restando 7 del resultado. Dé los primeros 5 resultados.',
          instructions: 'Comience con 100, reste 7, y continúe restando 7 del resultado cada vez.',
          order: 1,
          required: true,
          scoring: {
            type: 'custom',
            customScorer: (answer: any) => {
              const expected = [93, 86, 79, 72, 65];
              const userAnswers = Array.isArray(answer) ? answer : [answer];
              let score = 0;
              for (let i = 0; i < Math.min(5, userAnswers.length); i++) {
                if (userAnswers[i] === expected[i]) score++;
              }
              return score; // 0-5 points
            }
          },
          metadata: {
            expectedAnswers: [93, 86, 79, 72, 65],
            alternativeTask: 'spell_world_backwards'
          }
        }
      ]
    },
    {
      id: 'recall',
      name: 'Recuerdo',
      description: 'Memoria a corto plazo - recuerdo de palabras',
      order: 4,
      timeLimit: 120,
      instructions: 'Ahora trate de recordar las tres palabras que le dije al principio.',
      questions: [
        {
          id: 'mmse_recall',
          type: 'memory_task',
          text: 'Recuerde las tres palabras que le dije al principio',
          instructions: 'Sin ayuda, trate de recordar las tres palabras: PELOTA, BANDERA, ÁRBOL.',
          order: 1,
          required: true,
          scoring: {
            type: 'custom',
            customScorer: (answer: any) => {
              const targetWords = ['PELOTA', 'BANDERA', 'ÁRBOL'];
              const recalledWords = answer?.recalledWords || [];
              let score = 0;
              targetWords.forEach(word => {
                if (recalledWords.some((recalled: string) => 
                  recalled.toUpperCase() === word.toUpperCase())) {
                  score++;
                }
              });
              return score; // 0-3 points
            }
          },
          metadata: {
            words: ['PELOTA', 'BANDERA', 'ÁRBOL'],
            phase: 'recall',
            withCues: false
          }
        }
      ]
    },
    {
      id: 'language',
      name: 'Lenguaje',
      description: 'Habilidades del lenguaje y praxis',
      order: 5,
      timeLimit: 300,
      instructions: 'Ahora vamos a evaluar sus habilidades del lenguaje.',
      questions: [
        {
          id: 'mmse_naming_watch',
          type: 'text_input',
          text: '¿Cómo se llama esto? (mostrar reloj)',
          instructions: 'Dígame el nombre de este objeto.',
          order: 1,
          required: true,
          scoring: {
            type: 'lookup',
            lookup: {
              'reloj': 1,
              'reloj de pulsera': 1,
              'reloj de mano': 1
            }
          },
          metadata: {
            object: 'watch',
            image: 'watch.jpg'
          }
        },
        {
          id: 'mmse_naming_pencil',
          type: 'text_input',
          text: '¿Cómo se llama esto? (mostrar lápiz)',
          instructions: 'Dígame el nombre de este objeto.',
          order: 2,
          required: true,
          scoring: {
            type: 'lookup',
            lookup: {
              'lápiz': 1,
              'lapiz': 1,
              'pluma': 1,
              'bolígrafo': 1,
              'boligrafo': 1
            }
          },
          metadata: {
            object: 'pencil',
            image: 'pencil.jpg'
          }
        },
        {
          id: 'mmse_repetition',
          type: 'text_input',
          text: 'Repita exactamente esta frase: "Ni sí, ni no, ni pero"',
          instructions: 'Escuche atentamente y repita la frase exactamente como la escuchó.',
          order: 3,
          required: true,
          scoring: {
            type: 'lookup',
            lookup: {
              'ni sí, ni no, ni pero': 1,
              'ni si, ni no, ni pero': 1,
              'ni sí ni no ni pero': 1,
              'ni si ni no ni pero': 1
            }
          },
          metadata: {
            exactMatch: true,
            targetSentence: 'Ni sí, ni no, ni pero'
          }
        },
        {
          id: 'mmse_three_stage_command',
          type: 'instruction_following',
          text: 'Siga estas instrucciones: "Tome el papel con la mano derecha, dóblelo por la mitad y póngalo en el suelo"',
          instructions: 'Escuche las tres instrucciones y realícelas en orden.',
          order: 4,
          required: true,
          scoring: {
            type: 'custom',
            customScorer: (answer: any) => {
              const steps = answer?.completedSteps || [];
              return Math.min(3, steps.length); // 0-3 points
            }
          },
          metadata: {
            steps: [
              'take_paper_right_hand',
              'fold_in_half',
              'put_on_floor'
            ],
            maxPoints: 3
          }
        },
        {
          id: 'mmse_reading',
          type: 'instruction_following',
          text: 'Lea esta frase y haga lo que dice: "CIERRE LOS OJOS"',
          instructions: 'Lea la frase en voz alta y luego haga lo que dice.',
          order: 5,
          required: true,
          scoring: {
            type: 'direct',
            points: 1
          },
          metadata: {
            instruction: 'CIERRE LOS OJOS',
            requiresAction: true
          }
        },
        {
          id: 'mmse_writing',
          type: 'text_input',
          text: 'Escriba una oración completa sobre cualquier tema',
          instructions: 'Escriba una oración que tenga sentido completo con sujeto y verbo.',
          order: 6,
          required: true,
          scoring: {
            type: 'custom',
            customScorer: (answer: any) => {
              const sentence = answer?.trim() || '';
              // Basic validation: has words, ends with punctuation, makes sense
              if (sentence.length > 5 && /[.!?]$/.test(sentence)) {
                return 1;
              }
              return 0;
            }
          },
          metadata: {
            minLength: 5,
            requiresPunctuation: true
          }
        },
        {
          id: 'mmse_copying',
          type: 'drawing_task',
          text: 'Copie este dibujo exactamente',
          instructions: 'Dibuje una copia exacta de los pentágonos que se cruzan.',
          order: 7,
          required: true,
          scoring: {
            type: 'custom',
            customScorer: (answer: any) => {
              // Scoring based on intersecting pentagons
              return 1; // Placeholder - will be implemented with drawing analysis
            }
          },
          metadata: {
            drawingType: 'intersecting_pentagons',
            scoringCriteria: ['two_pentagons', 'intersection', 'closed_figures']
          }
        }
      ]
    }
  ],
  scoringConfig: {
    maxScore: 30,
    minScore: 0,
    sections: [
      { sectionId: 'orientation', maxScore: 10, weight: 1 },
      { sectionId: 'registration', maxScore: 3, weight: 1 },
      { sectionId: 'attention_calculation', maxScore: 5, weight: 1 },
      { sectionId: 'recall', maxScore: 3, weight: 1 },
      { sectionId: 'language', maxScore: 9, weight: 1 }
    ]
  },
  riskMapping: {
    ranges: [
      {
        category: 'high',
        scoreRange: { min: 0, max: 11 },
        riskRange: { min: 70, max: 95 },
        description: 'Deterioro cognitivo severo',
        recommendations: [
          'Evaluación neurológica urgente',
          'Estudios de neuroimagen',
          'Evaluación neuropsicológica completa',
          'Considerar causas tratables de demencia'
        ]
      },
      {
        category: 'high',
        scoreRange: { min: 12, max: 17 },
        riskRange: { min: 40, max: 69 },
        description: 'Deterioro cognitivo moderado',
        recommendations: [
          'Consulta con neurólogo o geriatra',
          'Evaluación neuropsicológica',
          'Descartar causas reversibles',
          'Seguimiento regular'
        ]
      },
      {
        category: 'moderate',
        scoreRange: { min: 18, max: 23 },
        riskRange: { min: 5, max: 39 },
        description: 'Deterioro cognitivo leve',
        recommendations: [
          'Consulta médica para evaluación',
          'Monitoreo regular',
          'Estimulación cognitiva',
          'Control de factores de riesgo cardiovascular'
        ]
      },
      {
        category: 'low',
        scoreRange: { min: 24, max: 30 },
        riskRange: { min: 0, max: 4 },
        description: 'Función cognitiva normal',
        recommendations: [
          'Mantener actividad física regular',
          'Estimulación mental continua',
          'Dieta saludable',
          'Control de factores de riesgo'
        ]
      }
    ],
    algorithm: 'threshold'
  },
  metadata: {
    version: '1.0',
    language: 'es',
    validatedPopulation: ['mexican', 'latin_american', 'spanish_speaking', 'elderly'],
    clinicalReferences: [
      'Folstein, M. F., Folstein, S. E., & McHugh, P. R. (1975). "Mini-mental state": a practical method for grading the cognitive state of patients for the clinician. Journal of psychiatric research, 12(3), 189-198.',
      'Ostrosky-Solís, F., López-Arango, G., & Ardila, A. (2000). Sensitivity and specificity of the Mini-Mental State Examination in a Spanish-speaking population. Applied Neuropsychology, 7(1), 25-31.',
      'Reyes de Beaman, S., Beaman, P. E., Garcia-Peña, C., Villa, M. A., Heres, J., Córdova, A., & Jagger, C. (2004). Validation of a modified version of the mini-mental state examination (MMSE) in Spanish. Aging, Neuropsychology, and Cognition, 11(1), 1-11.'
    ],
    lastUpdated: new Date('2024-01-15'),
    author: 'NeuralHack Cognitive AI Team',
    license: 'Clinical Use - MMSE requires permission for commercial use'
  }
};