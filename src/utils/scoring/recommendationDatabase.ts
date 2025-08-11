import type { Recommendation, RiskCategory, TestType } from '../../types/assessment';

/**
 * Structured database of recommendations organized by test type, risk level, and category
 */
export class RecommendationDatabase {

    /**
     * Medical recommendations by test type and risk level
     */
    private static readonly MEDICAL_RECOMMENDATIONS: Record<TestType, Record<RiskCategory, Recommendation[]>> = {
        moca: {
            low: [
                {
                testType: testType,
                riskLevel: riskCategory,
                    testType: testType,
                    riskLevel: riskCategory,
                    id: 'moca_low_routine_checkup',
                    type: 'medical',
                    category: 'long_term',
                    title: 'Chequeo Médico de Rutina',
                    description: 'Mantenga revisiones médicas regulares para monitorear su salud cognitiva.',
                    priority: 'low',
                    actionSteps: [
                        'Chequeo médico anual',
                        'Evaluación cognitiva cada 2 años',
                        'Control de factores de riesgo cardiovascular',
                        'Vacunación según calendario'
                    ],
                    followUpDays: 365
                }
            ],
            moderate: [
                {
                testType: testType,
                riskLevel: riskCategory,
                    testType: testType,
                    riskLevel: riskCategory,
                    id: 'moca_moderate_specialist',
                    type: 'medical',
                    category: 'short_term',
                    title: 'Consulta con Especialista',
                    description: 'Su puntuación sugiere la necesidad de evaluación especializada.',
                    priority: 'high',
                    actionSteps: [
                        'Consulta con neurólogo o geriatra',
                        'Evaluación neuropsicológica',
                        'Estudios de laboratorio completos',
                        'Revisión de medicamentos actuales'
                    ],
                    resources: [
                        {
                testType: testType,
                riskLevel: riskCategory,
                    testType: testType,
                    riskLevel: riskCategory,
                            type: 'contact',
                            title: 'Red de Neurólogos IMSS',
                            description: 'Directorio de especialistas disponibles'
                        }
                    ],
                    followUpDays: 30
                }
            ],
            high: [
                {
                testType: testType,
                riskLevel: riskCategory,
                    testType: testType,
                    riskLevel: riskCategory,
                    id: 'moca_high_urgent_evaluation',
                    type: 'medical',
                    category: 'immediate',
                    title: 'Evaluación Neurológica Urgente',
                    description: 'Su puntuación indica deterioro cognitivo significativo que requiere atención inmediata.',
                    priority: 'urgent',
                    actionSteps: [
                        'Consulta neurológica en 48-72 horas',
                        'Neuroimagen (RM o TAC cerebral)',
                        'Evaluación de causas reversibles',
                        'Planificación de cuidados'
                    ],
                    resources: [
                        {
                testType: testType,
                riskLevel: riskCategory,
                    testType: testType,
                    riskLevel: riskCategory,
                            type: 'contact',
                            title: 'Urgencias Neurológicas',
                            description: 'Servicios de emergencia neurológica 24/7'
                        }
                    ],
                    followUpDays: 3
                }
            ]
        },

        phq9: {
            low: [
                {
                testType: testType,
                riskLevel: riskCategory,
                    testType: testType,
                    riskLevel: riskCategory,
                    id: 'phq9_low_wellness',
                    type: 'medical',
                    category: 'long_term',
                    title: 'Bienestar Mental',
                    description: 'Mantenga estrategias de bienestar mental para prevenir la depresión.',
                    priority: 'low',
                    actionSteps: [
                        'Chequeo de salud mental anual',
                        'Mantenga rutinas saludables',
                        'Técnicas de manejo del estrés',
                        'Red de apoyo social activa'
                    ],
                    followUpDays: 180
                }
            ],
            moderate: [
                {
                testType: testType,
                riskLevel: riskCategory,
                    testType: testType,
                    riskLevel: riskCategory,
                    id: 'phq9_moderate_counseling',
                    type: 'medical',
                    category: 'short_term',
                    title: 'Consejería Psicológica',
                    description: 'Su nivel de síntomas depresivos se beneficiaría de apoyo profesional.',
                    priority: 'high',
                    actionSteps: [
                        'Consulta con psicólogo clínico',
                        'Terapia cognitivo-conductual',
                        'Evaluación para medicación',
                        'Seguimiento regular'
                    ],
                    followUpDays: 14
                }
            ],
            high: [
                {
                testType: testType,
                riskLevel: riskCategory,
                    testType: testType,
                    riskLevel: riskCategory,
                    id: 'phq9_high_psychiatric_care',
                    type: 'medical',
                    category: 'immediate',
                    title: 'Atención Psiquiátrica Especializada',
                    description: 'Su nivel de depresión requiere atención psiquiátrica inmediata.',
                    priority: 'urgent',
                    actionSteps: [
                        'Consulta psiquiátrica urgente',
                        'Evaluación de riesgo suicida',
                        'Tratamiento farmacológico',
                        'Hospitalización si es necesario'
                    ],
                    resources: [
                        {
                testType: testType,
                riskLevel: riskCategory,
                    testType: testType,
                    riskLevel: riskCategory,
                            type: 'contact',
                            title: 'Línea de Crisis 24/7',
                            description: '800-290-0024 - Atención inmediata'
                        }
                    ],
                    followUpDays: 1
                }
            ]
        },

        mmse: {
            low: [
                {
                testType: testType,
                riskLevel: riskCategory,
                    testType: testType,
                    riskLevel: riskCategory,
                    id: 'mmse_low_cognitive_health',
                    type: 'medical',
                    category: 'long_term',
                    title: 'Salud Cognitiva Preventiva',
                    description: 'Mantenga estrategias para preservar la función cognitiva.',
                    priority: 'low',
                    actionSteps: [
                        'Evaluación cognitiva cada 2 años',
                        'Control de factores de riesgo',
                        'Actividad cognitiva regular',
                        'Ejercicio físico constante'
                    ],
                    followUpDays: 730
                }
            ],
            moderate: [
                {
                testType: testType,
                riskLevel: riskCategory,
                    testType: testType,
                    riskLevel: riskCategory,
                    id: 'mmse_moderate_geriatric_eval',
                    type: 'medical',
                    category: 'short_term',
                    title: 'Evaluación Geriátrica',
                    description: 'Su puntuación sugiere deterioro cognitivo que requiere evaluación.',
                    priority: 'high',
                    actionSteps: [
                        'Consulta geriátrica integral',
                        'Evaluación neuropsicológica',
                        'Descarte causas reversibles',
                        'Plan de cuidados personalizado'
                    ],
                    followUpDays: 21
                }
            ],
            high: [
                {
                testType: testType,
                riskLevel: riskCategory,
                    testType: testType,
                    riskLevel: riskCategory,
                    id: 'mmse_high_dementia_workup',
                    type: 'medical',
                    category: 'immediate',
                    title: 'Evaluación de Demencia',
                    description: 'Su puntuación indica deterioro cognitivo severo que requiere evaluación completa.',
                    priority: 'urgent',
                    actionSteps: [
                        'Evaluación neurológica completa',
                        'Estudios de neuroimagen',
                        'Evaluación de seguridad',
                        'Planificación de cuidados a largo plazo'
                    ],
                    followUpDays: 7
                }
            ]
        },

        ad8: {
            low: [
                {
                testType: testType,
                riskLevel: riskCategory,
                    testType: testType,
                    riskLevel: riskCategory,
                    id: 'ad8_low_monitoring',
                    type: 'monitoring',
                    category: 'long_term',
                    title: 'Monitoreo Cognitivo',
                    description: 'Mantenga vigilancia sobre cambios cognitivos futuros.',
                    priority: 'low',
                    actionSteps: [
                        'Autoevaluación anual',
                        'Reporte cambios a familiares',
                        'Mantenga actividad mental',
                        'Control de factores de riesgo'
                    ],
                    followUpDays: 365
                }
            ],
            moderate: [
                {
                testType: testType,
                riskLevel: riskCategory,
                    testType: testType,
                    riskLevel: riskCategory,
                    id: 'ad8_moderate_memory_clinic',
                    type: 'medical',
                    category: 'short_term',
                    title: 'Clínica de Memoria',
                    description: 'Los cambios reportados sugieren evaluación en clínica especializada.',
                    priority: 'high',
                    actionSteps: [
                        'Referencia a clínica de memoria',
                        'Evaluación neuropsicológica',
                        'Involucrar a familiares',
                        'Seguimiento cada 6 meses'
                    ],
                    followUpDays: 30
                }
            ],
            high: [
                {
                testType: testType,
                riskLevel: riskCategory,
                    testType: testType,
                    riskLevel: riskCategory,
                    id: 'ad8_high_dementia_evaluation',
                    type: 'medical',
                    category: 'immediate',
                    title: 'Evaluación de Demencia Urgente',
                    description: 'Los cambios cognitivos reportados requieren evaluación inmediata.',
                    priority: 'urgent',
                    actionSteps: [
                        'Evaluación neurológica urgente',
                        'Estudios de laboratorio completos',
                        'Neuroimagen estructural',
                        'Evaluación funcional'
                    ],
                    followUpDays: 14
                }
            ]
        },

        parkinsons: {
            low: [
                {
                testType: testType,
                riskLevel: riskCategory,
                    testType: testType,
                    riskLevel: riskCategory,
                    id: 'parkinsons_low_prevention',
                    type: 'medical',
                    category: 'long_term',
                    title: 'Prevención de Parkinson',
                    description: 'Estrategias para mantener la salud neurológica.',
                    priority: 'low',
                    actionSteps: [
                        'Chequeo neurológico anual',
                        'Evaluación de factores de riesgo',
                        'Monitoreo de síntomas tempranos',
                        'Consulta preventiva si hay antecedentes familiares'
                    ],
                    followUpDays: 365
                }
            ],
            moderate: [
                {
                testType: testType,
                riskLevel: riskCategory,
                    testType: testType,
                    riskLevel: riskCategory,
                    id: 'parkinsons_moderate_neurology',
                    type: 'medical',
                    category: 'short_term',
                    title: 'Evaluación Neurológica',
                    description: 'Sus síntomas sugieren la necesidad de evaluación neurológica.',
                    priority: 'high',
                    actionSteps: [
                        'Consulta con neurólogo',
                        'Evaluación de síntomas motores',
                        'Descarte otras condiciones',
                        'Plan de seguimiento'
                    ],
                    followUpDays: 30
                }
            ],
            high: [
                {
                testType: testType,
                riskLevel: riskCategory,
                    testType: testType,
                    riskLevel: riskCategory,
                    id: 'parkinsons_high_movement_specialist',
                    type: 'medical',
                    category: 'immediate',
                    title: 'Especialista en Trastornos del Movimiento',
                    description: 'Sus síntomas sugieren posible Parkinson que requiere evaluación especializada.',
                    priority: 'urgent',
                    actionSteps: [
                        'Consulta con especialista en movimiento',
                        'Evaluación con DaTscan si disponible',
                        'Prueba terapéutica con levodopa',
                        'Inicio de fisioterapia'
                    ],
                    resources: [
                        {
                testType: testType,
                riskLevel: riskCategory,
                    testType: testType,
                    riskLevel: riskCategory,
                            type: 'contact',
                            title: 'Especialistas en Parkinson México',
                            description: 'Red de especialistas en trastornos del movimiento'
                        }
                    ],
                    followUpDays: 14
                }
            ]
        }
    };

    /**
     * Lifestyle recommendations by category
     */
    private static readonly LIFESTYLE_RECOMMENDATIONS: Record<string, Recommendation[]> = {
        exercise: [
            {
                testType: testType,
                riskLevel: riskCategory,
                id: 'lifestyle_aerobic_exercise',
                type: 'lifestyle',
                category: 'long_term',
                title: 'Ejercicio Aeróbico',
                description: 'El ejercicio aeróbico regular mejora la salud cerebral y cardiovascular.',
                priority: 'medium',
                actionSteps: [
                    'Camine 30 minutos diarios',
                    'Natación 2-3 veces por semana',
                    'Baile o actividades grupales',
                    'Incremente intensidad gradualmente'
                ],
                resources: [
                    {
                testType: testType,
                riskLevel: riskCategory,
                    testType: testType,
                    riskLevel: riskCategory,
                        type: 'video',
                        title: 'Rutinas de Ejercicio para Adultos Mayores',
                        description: 'Videos guiados de ejercicio seguro'
                    }
                ],
                followUpDays: 30
            },
            {
                testType: testType,
                riskLevel: riskCategory,
                id: 'lifestyle_strength_training',
                type: 'lifestyle',
                category: 'long_term',
                title: 'Entrenamiento de Fuerza',
                description: 'El entrenamiento de resistencia mantiene la masa muscular y la función.',
                priority: 'medium',
                actionSteps: [
                    'Ejercicios con pesas ligeras 2 veces/semana',
                    'Ejercicios con peso corporal',
                    'Bandas de resistencia',
                    'Supervisión inicial recomendada'
                ],
                followUpDays: 30
            }
        ],

        nutrition: [
            {
                testType: testType,
                riskLevel: riskCategory,
                id: 'lifestyle_mediterranean_diet',
                type: 'lifestyle',
                category: 'long_term',
                title: 'Dieta Mediterránea',
                description: 'La dieta mediterránea protege la salud cerebral y cardiovascular.',
                priority: 'medium',
                actionSteps: [
                    'Aceite de oliva como grasa principal',
                    'Pescado graso 2-3 veces por semana',
                    '5 porciones de frutas y verduras diarias',
                    'Nueces y semillas regularmente'
                ],
                resources: [
                    {
                testType: testType,
                riskLevel: riskCategory,
                    testType: testType,
                    riskLevel: riskCategory,
                        type: 'guide',
                        title: 'Guía de Dieta Mediterránea',
                        description: 'Recetas y plan de alimentación'
                    }
                ],
                followUpDays: 30
            },
            {
                testType: testType,
                riskLevel: riskCategory,
                id: 'lifestyle_brain_foods',
                type: 'lifestyle',
                category: 'long_term',
                title: 'Alimentos para el Cerebro',
                description: 'Ciertos alimentos tienen propiedades neuroprotectoras.',
                priority: 'medium',
                actionSteps: [
                    'Arándanos y frutos rojos',
                    'Verduras de hoja verde',
                    'Chocolate oscuro (70% cacao)',
                    'Té verde y café con moderación'
                ],
                followUpDays: 30
            }
        ],

        cognitive: [
            {
                testType: testType,
                riskLevel: riskCategory,
                id: 'lifestyle_mental_stimulation',
                type: 'lifestyle',
                category: 'long_term',
                title: 'Estimulación Mental',
                description: 'Las actividades cognitivamente desafiantes mantienen la función cerebral.',
                priority: 'medium',
                actionSteps: [
                    'Lectura diaria variada',
                    'Juegos de mesa y rompecabezas',
                    'Aprender nuevas habilidades',
                    'Conversaciones estimulantes'
                ],
                resources: [
                    {
                testType: testType,
                riskLevel: riskCategory,
                    testType: testType,
                    riskLevel: riskCategory,
                        type: 'app',
                        title: 'Aplicaciones de Entrenamiento Cerebral',
                        description: 'Ejercicios cognitivos personalizados'
                    }
                ],
                followUpDays: 30
            },
            {
                testType: testType,
                riskLevel: riskCategory,
                id: 'lifestyle_lifelong_learning',
                type: 'lifestyle',
                category: 'long_term',
                title: 'Aprendizaje Continuo',
                description: 'Aprender cosas nuevas crea nuevas conexiones neuronales.',
                priority: 'medium',
                actionSteps: [
                    'Tome clases o cursos',
                    'Aprenda un nuevo idioma',
                    'Practique un instrumento musical',
                    'Desarrolle nuevos hobbies'
                ],
                followUpDays: 90
            }
        ],

        sleep: [
            {
                testType: testType,
                riskLevel: riskCategory,
                id: 'lifestyle_sleep_hygiene',
                type: 'lifestyle',
                category: 'short_term',
                title: 'Higiene del Sueño',
                description: 'Un sueño de calidad es esencial para la salud cerebral.',
                priority: 'medium',
                actionSteps: [
                    'Horario regular de sueño',
                    '7-9 horas de sueño nocturno',
                    'Ambiente oscuro y silencioso',
                    'Evitar pantallas antes de dormir'
                ],
                followUpDays: 14
            }
        ],

        social: [
            {
                testType: testType,
                riskLevel: riskCategory,
                id: 'lifestyle_social_engagement',
                type: 'lifestyle',
                category: 'long_term',
                title: 'Participación Social',
                description: 'Las conexiones sociales protegen contra el deterioro cognitivo.',
                priority: 'medium',
                actionSteps: [
                    'Mantenga contacto con familiares y amigos',
                    'Participe en actividades comunitarias',
                    'Únase a grupos de interés',
                    'Considere trabajo voluntario'
                ],
                followUpDays: 30
            }
        ]
    };

    /**
     * Get medical recommendations for specific test type and risk level
     */
    static getMedicalRecommendations(testType: TestType, riskCategory: RiskCategory): Recommendation[] {
        return this.MEDICAL_RECOMMENDATIONS[testType]?.[riskCategory] || [];
    }

    /**
     * Get lifestyle recommendations by category
     */
    static getLifestyleRecommendations(categories: string[]): Recommendation[] {
        const recommendations: Recommendation[] = [];

        categories.forEach(category => {
            const categoryRecommendations = this.LIFESTYLE_RECOMMENDATIONS[category] || [];
            recommendations.push(...categoryRecommendations);
        });

        return recommendations;
    }

    /**
     * Get all lifestyle recommendations
     */
    static getAllLifestyleRecommendations(): Recommendation[] {
        const allRecommendations: Recommendation[] = [];

        Object.values(this.LIFESTYLE_RECOMMENDATIONS).forEach(categoryRecommendations => {
            allRecommendations.push(...categoryRecommendations);
        });

        return allRecommendations;
    }

    /**
     * Get personalized recommendations based on user profile and risk factors
     */
    static getPersonalizedRecommendations(
        testType: TestType,
        riskCategory: RiskCategory,
        userAge: number,
        riskFactors: string[]
    ): Recommendation[] {
        const recommendations: Recommendation[] = [];

        // Add medical recommendations
        recommendations.push(...this.getMedicalRecommendations(testType, riskCategory));

        // Add lifestyle recommendations based on risk factors and age
        const lifestyleCategories = this.determineLifestyleCategories(testType, riskCategory, userAge, riskFactors);
        recommendations.push(...this.getLifestyleRecommendations(lifestyleCategories));

        return recommendations;
    }

    /**
     * Determine which lifestyle categories are most relevant
     */
    private static determineLifestyleCategories(
        testType: TestType,
        riskCategory: RiskCategory,
        userAge: number,
        riskFactors: string[]
    ): string[] {
        const categories: string[] = [];

        // Always include basic categories
        categories.push('exercise', 'nutrition', 'sleep');

        // Add cognitive stimulation for cognitive tests
        if (['moca', 'mmse', 'ad8'].includes(testType)) {
            categories.push('cognitive');
        }

        // Add social engagement for depression and high-risk cases
        if (testType === 'phq9' || riskCategory === 'high') {
            categories.push('social');
        }

        // Age-specific additions
        if (userAge > 65) {
            categories.push('social'); // Social engagement more important for elderly
        }

        return categories;
    }

    /**
     * Filter recommendations by priority
     */
    static filterByPriority(recommendations: Recommendation[], minPriority: 'low' | 'medium' | 'high' | 'urgent'): Recommendation[] {
        const priorityOrder = { low: 1, medium: 2, high: 3, urgent: 4 };
        const minLevel = priorityOrder[minPriority];

        return recommendations.filter(rec => {
            const recLevel = priorityOrder[rec.priority as keyof typeof priorityOrder] || 0;
            return recLevel >= minLevel;
        });
    }

    /**
     * Get emergency recommendations for crisis situations
     */
    static getEmergencyRecommendations(): Recommendation[] {
        return [
            {
                testType: testType,
                riskLevel: riskCategory,
                id: 'emergency_suicide_risk',
                type: 'medical',
                category: 'immediate',
                title: 'Riesgo de Suicidio - Atención Inmediata',
                description: 'Si tiene pensamientos de autolesión, busque ayuda inmediatamente.',
                priority: 'urgent',
                actionSteps: [
                    'Llame al 911 o vaya a urgencias',
                    'Contacte línea de crisis: 800-290-0024',
                    'No se quede solo',
                    'Retire medios de autolesión'
                ],
                resources: [
                    {
                testType: testType,
                riskLevel: riskCategory,
                    testType: testType,
                    riskLevel: riskCategory,
                        type: 'contact',
                        title: 'Línea Nacional de Prevención del Suicidio',
                        description: '800-290-0024 - Disponible 24/7'
                    }
                ],
                followUpDays: 0
            },
            {
                testType: testType,
                riskLevel: riskCategory,
                id: 'emergency_severe_confusion',
                type: 'medical',
                category: 'immediate',
                title: 'Confusión Severa - Evaluación Urgente',
                description: 'La confusión severa o cambios súbitos requieren evaluación médica inmediata.',
                priority: 'urgent',
                actionSteps: [
                    'Vaya a urgencias inmediatamente',
                    'Traiga lista de medicamentos',
                    'Acompañe con familiar',
                    'Describa cambios recientes'
                ],
                followUpDays: 0
            }
        ];
    }
}
