import { EducationalArticle, EducationalSource } from '../types/education';

// Mexican and Latin American medical resources
export const MEXICAN_MEDICAL_SOURCES: EducationalSource[] = [
  {
    title: 'Instituto Nacional de Neurología y Neurocirugía',
    url: 'https://www.innn.salud.gob.mx',
    type: 'government',
    credibility: 'high'
  },
  {
    title: 'Secretaría de Salud México',
    url: 'https://www.gob.mx/salud',
    type: 'government',
    credibility: 'high'
  },
  {
    title: 'UNAM - Facultad de Medicina',
    url: 'https://www.medicina.unam.mx',
    type: 'university',
    credibility: 'high'
  },
  {
    title: 'Instituto Politécnico Nacional - ENCB',
    url: 'https://www.encb.ipn.mx',
    type: 'university',
    credibility: 'high'
  },
  {
    title: 'Asociación Mexicana de Alzheimer',
    url: 'https://amaac.org.mx',
    type: 'medical_association',
    credibility: 'high'
  },
  {
    title: 'Fundación Alzheimer de México',
    url: 'https://alzheimer.org.mx',
    type: 'medical_association',
    credibility: 'high'
  },
  {
    title: 'Instituto Nacional de Geriatría',
    url: 'https://www.inger.gob.mx',
    type: 'government',
    credibility: 'high'
  }
];

export const EDUCATIONAL_ARTICLES: EducationalArticle[] = [
  {
    id: 'alzheimer-prevention-basics',
    title: 'Prevención del Alzheimer: Fundamentos Básicos',
    summary: 'Conoce los factores de riesgo modificables y las estrategias de prevención basadas en evidencia científica.',
    content: `
# Prevención del Alzheimer: Fundamentos Básicos

## ¿Qué es el Alzheimer?

La enfermedad de Alzheimer es la forma más común de demencia, representando entre 60-80% de todos los casos. Se caracteriza por la pérdida progresiva de memoria y otras funciones cognitivas.

## Factores de Riesgo No Modificables

- **Edad**: El riesgo se duplica cada 5 años después de los 65 años
- **Genética**: Ciertos genes como APOE-e4 aumentan el riesgo
- **Sexo**: Las mujeres tienen mayor riesgo, especialmente después de la menopausia

## Factores de Riesgo Modificables

### 1. Actividad Física
- **Recomendación**: 150 minutos de ejercicio moderado por semana
- **Beneficios**: Mejora el flujo sanguíneo cerebral y promueve la neurogénesis
- **Tipos recomendados**: Caminata, natación, baile, tai chi

### 2. Dieta Mediterránea
- **Componentes clave**: Aceite de oliva, pescado, nueces, frutas y verduras
- **Evidencia**: Reduce el riesgo de deterioro cognitivo en 13-35%
- **Adaptación mexicana**: Incluir aguacate, frijoles, chía y nopales

### 3. Estimulación Cognitiva
- **Actividades**: Lectura, juegos mentales, aprender idiomas
- **Socialización**: Mantener relaciones sociales activas
- **Trabajo**: Actividades laborales complejas protegen el cerebro

### 4. Control de Factores Cardiovasculares
- **Presión arterial**: Mantener <140/90 mmHg
- **Diabetes**: Control glucémico estricto
- **Colesterol**: Niveles óptimos de LDL <100 mg/dL

## Estrategias de Prevención en México

### Recursos Locales
- Centros de salud comunitarios para control de factores de riesgo
- Programas de actividad física en parques públicos
- Grupos de apoyo en centros de adultos mayores

### Alimentación Tradicional Protectora
- **Quelites**: Ricos en antioxidantes y folatos
- **Chía**: Omega-3 para salud cerebral
- **Cacao**: Flavonoides neuroprotectores
- **Nopales**: Control glucémico y antiinflamatorio

## Señales de Alerta Temprana

1. Pérdida de memoria que afecta actividades diarias
2. Dificultad para planificar o resolver problemas
3. Confusión con tiempo o lugar
4. Problemas con palabras al hablar o escribir
5. Cambios en el estado de ánimo o personalidad

## Cuándo Buscar Ayuda Médica

Consulta a un neurólogo si:
- Los síntomas interfieren con actividades diarias
- Familiares notan cambios significativos
- Hay antecedentes familiares de demencia
- Aparecen múltiples síntomas simultáneamente

## Recursos en México

- **Línea de información**: Instituto Nacional de Neurología (55) 5606-3822
- **Consulta especializada**: Centros de memoria en hospitales públicos
- **Apoyo familiar**: Asociación Mexicana de Alzheimer

## Conclusión

La prevención del Alzheimer es posible mediante cambios en el estilo de vida. Nunca es demasiado tarde para comenzar, y los beneficios se acumulan con el tiempo.
    `,
    category: 'alzheimer_prevention',
    tags: ['prevención', 'alzheimer', 'estilo de vida', 'factores de riesgo'],
    readingTime: 8,
    difficulty: 'beginner',
    lastUpdated: new Date('2024-01-15'),
    author: 'Dr. María González, Neuróloga',
    sources: MEXICAN_MEDICAL_SOURCES.slice(0, 3),
    relatedArticles: ['lifestyle-factors-brain-health', 'mediterranean-diet-cognitive-protection']
  },
  {
    id: 'parkinson-early-signs',
    title: 'Parkinson: Señales Tempranas y Prevención',
    summary: 'Identifica los síntomas iniciales del Parkinson y conoce las estrategias de prevención más efectivas.',
    content: `
# Parkinson: Señales Tempranas y Prevención

## ¿Qué es la Enfermedad de Parkinson?

La enfermedad de Parkinson es un trastorno neurodegenerativo que afecta principalmente el movimiento, causado por la pérdida de neuronas productoras de dopamina.

## Síntomas Tempranos (Fase Prodrómica)

### Síntomas No Motores
1. **Pérdida del olfato** (hiposmia)
2. **Trastornos del sueño REM**
3. **Estreñimiento crónico**
4. **Depresión o ansiedad**
5. **Fatiga inexplicable**

### Primeros Síntomas Motores
1. **Temblor en reposo** (generalmente en una mano)
2. **Rigidez muscular**
3. **Bradicinesia** (lentitud de movimientos)
4. **Problemas de equilibrio**

## Factores de Riesgo

### No Modificables
- Edad (>60 años)
- Sexo masculino (1.5x mayor riesgo)
- Genética (5-10% de casos)

### Modificables
- Exposición a pesticidas
- Traumatismos craneales repetidos
- Sedentarismo
- Deficiencia de vitamina D

## Estrategias de Prevención

### 1. Ejercicio Regular
- **Tipo**: Ejercicios aeróbicos y de resistencia
- **Frecuencia**: 5 días por semana, 30 minutos
- **Beneficios**: Neuroprotección y mejora de síntomas

### 2. Dieta Neuroprotectora
- **Antioxidantes**: Frutas y verduras coloridas
- **Omega-3**: Pescado, nueces, chía
- **Té verde**: Polifenoles neuroprotectores
- **Evitar**: Productos lácteos en exceso

### 3. Actividades Cognitivas
- Lectura regular
- Juegos de mesa
- Aprendizaje de nuevas habilidades
- Socialización activa

## Alimentos Mexicanos Neuroprotectores

### Tradicionales Beneficiosos
- **Cacao**: Rico en flavonoides
- **Chiles**: Capsaicina antiinflamatoria
- **Aguacate**: Grasas saludables y vitamina E
- **Frijoles**: Proteína vegetal y folatos

### Hierbas Medicinales
- **Té de manzanilla**: Propiedades antiinflamatorias
- **Hierba buena**: Antioxidantes naturales
- **Romero**: Mejora la circulación cerebral

## Ejercicios Específicos para Prevención

### Rutina Diaria (20 minutos)
1. **Calentamiento** (5 min): Marcha en el lugar
2. **Ejercicios de equilibrio** (5 min): Tai chi básico
3. **Fortalecimiento** (5 min): Sentadillas, flexiones de pared
4. **Estiramiento** (5 min): Cuello, brazos, piernas

### Actividades Recreativas
- Baile folklórico mexicano
- Caminata en parques
- Jardinería
- Natación

## Cuándo Consultar al Médico

### Señales de Alarma
- Temblor persistente en reposo
- Rigidez muscular progresiva
- Cambios en la escritura (micrografía)
- Pérdida del olfato significativa
- Trastornos del sueño REM

### Especialistas en México
- **Neurólogos especializados en movimiento**
- **Centros de Parkinson** en hospitales públicos
- **Instituto Nacional de Neurología y Neurocirugía**

## Recursos y Apoyo

### Organizaciones Mexicanas
- Asociación Mexicana de Parkinson
- Fundación Parkinson de México
- Grupos de apoyo locales

### Programas Gubernamentales
- IMSS: Programa de enfermedades crónicas
- ISSSTE: Atención neurológica especializada
- Centros de Salud: Detección temprana

## Mitos y Realidades

### Mitos Comunes
❌ "Solo afecta a personas mayores"
❌ "Es hereditario en todos los casos"
❌ "No se puede prevenir"

### Realidades
✅ Puede aparecer antes de los 50 años
✅ Solo 5-10% de casos son hereditarios
✅ El ejercicio y la dieta pueden reducir el riesgo

## Conclusión

La detección temprana y las medidas preventivas pueden retrasar significativamente la aparición del Parkinson. Mantener un estilo de vida activo y saludable es la mejor estrategia de prevención.
    `,
    category: 'parkinson_prevention',
    tags: ['parkinson', 'síntomas tempranos', 'prevención', 'ejercicio'],
    readingTime: 10,
    difficulty: 'intermediate',
    lastUpdated: new Date('2024-01-20'),
    author: 'Dr. Carlos Hernández, Especialista en Trastornos del Movimiento',
    sources: MEXICAN_MEDICAL_SOURCES.slice(1, 4),
    relatedArticles: ['exercise-brain-protection', 'nutrition-neurodegeneration']
  },
  {
    id: 'lifestyle-factors-brain-health',
    title: 'Factores de Estilo de Vida para la Salud Cerebral',
    summary: 'Descubre cómo los hábitos diarios impactan la salud de tu cerebro y cómo optimizarlos.',
    content: `
# Factores de Estilo de Vida para la Salud Cerebral

## La Importancia del Estilo de Vida

El cerebro es un órgano dinámico que responde positivamente a los cambios en el estilo de vida. Hasta el 40% del riesgo de demencia puede ser prevenible mediante modificaciones en nuestros hábitos diarios.

## Los 12 Factores Modificables (Lancet Commission)

### Factores de Vida Temprana
1. **Educación**: Menos de educación primaria aumenta el riesgo
2. **Pérdida auditiva**: Afecta la estimulación cognitiva

### Factores de Mediana Edad
3. **Hipertensión**: >140/90 mmHg
4. **Obesidad**: IMC >30 kg/m²
5. **Consumo excesivo de alcohol**: >21 unidades/semana
6. **Traumatismo craneal**: Lesiones cerebrales
7. **Contaminación del aire**: Exposición a PM2.5

### Factores de Edad Avanzada
8. **Tabaquismo**: Activo o pasivo
9. **Depresión**: Trastornos del estado de ánimo
10. **Aislamiento social**: Falta de contacto social
11. **Inactividad física**: <150 min/semana ejercicio moderado
12. **Diabetes**: Glucosa mal controlada

## Estrategias de Optimización

### 1. Actividad Física Integral

#### Ejercicio Aeróbico
- **Objetivo**: 150 minutos/semana intensidad moderada
- **Ejemplos mexicanos**: 
  - Caminata en el Zócalo
  - Baile en plazas públicas
  - Ciclismo en ciclovías
  - Natación en centros deportivos

#### Ejercicio de Resistencia
- **Frecuencia**: 2-3 veces por semana
- **Beneficios**: Fortalece conexiones neuronales
- **Opciones caseras**: Bandas elásticas, pesas improvisadas

#### Ejercicios de Equilibrio
- **Tai Chi**: Disponible en parques públicos
- **Yoga**: Centros comunitarios
- **Baile folklórico**: Grupos culturales

### 2. Nutrición Cerebral Óptima

#### Dieta MIND (Mediterranean-DASH Intervention for Neurodegenerative Delay)
**Alimentos a Incluir Diariamente:**
- Verduras de hoja verde (espinacas, acelgas)
- Otras verduras (nopales, chayotes, calabazas)
- Nueces y semillas (cacahuates, pepitas, chía)
- Frijoles y leguminosas
- Granos enteros (avena, quinoa, amaranto)

**Alimentos Semanales:**
- Pescado (2+ veces): sardinas, atún, salmón
- Aves de corral (2+ veces)
- Frutos rojos (2+ veces): fresas, arándanos

#### Adaptación Mexicana de la Dieta MIND
- **Desayuno**: Avena con nueces y frutos rojos
- **Comida**: Ensalada de nopales, frijoles, pescado
- **Cena**: Sopa de verduras con quinoa
- **Colaciones**: Jícama con chile, nueces

### 3. Sueño Reparador

#### Higiene del Sueño
- **Duración**: 7-9 horas por noche
- **Horario**: Acostarse y levantarse a la misma hora
- **Ambiente**: Oscuro, silencioso, fresco (18-22°C)

#### Rutina Nocturna
1. Cena ligera 3 horas antes de dormir
2. Evitar pantallas 1 hora antes
3. Técnicas de relajación (respiración, meditación)
4. Té de manzanilla o valeriana

### 4. Estimulación Cognitiva

#### Actividades Diarias
- **Lectura**: Periódicos, libros, revistas
- **Escritura**: Diario personal, cartas
- **Juegos mentales**: Crucigramas, sudoku
- **Música**: Tocar instrumentos, cantar

#### Aprendizaje Continuo
- Cursos en línea gratuitos
- Talleres en centros culturales
- Idiomas (inglés, lenguas indígenas)
- Habilidades tecnológicas

### 5. Conexión Social

#### Actividades Comunitarias
- Grupos de adultos mayores
- Voluntariado en organizaciones
- Clubes de lectura
- Grupos religiosos o espirituales

#### Relaciones Familiares
- Cenas familiares regulares
- Actividades intergeneracionales
- Comunicación frecuente con seres queridos

## Control de Factores de Riesgo

### Hipertensión
- **Meta**: <140/90 mmHg (<130/80 en diabéticos)
- **Monitoreo**: Medición semanal en casa
- **Tratamiento**: Medicamentos + cambios de estilo de vida

### Diabetes
- **Meta**: HbA1c <7%
- **Monitoreo**: Glucosa diaria
- **Prevención**: Dieta baja en azúcares refinados

### Colesterol
- **Meta**: LDL <100 mg/dL
- **Estrategia**: Dieta baja en grasas saturadas
- **Ejercicio**: Aumenta HDL (colesterol bueno)

## Manejo del Estrés

### Técnicas de Relajación
1. **Respiración profunda**: 4-7-8 (inhalar-retener-exhalar)
2. **Meditación mindfulness**: 10-20 minutos diarios
3. **Yoga**: Posturas suaves y respiración
4. **Tai Chi**: Meditación en movimiento

### Actividades Antiestrés
- Jardinería
- Caminatas en la naturaleza
- Escuchar música relajante
- Tiempo con mascotas

## Recursos en México

### Programas Gubernamentales
- **INAPAM**: Actividades para adultos mayores
- **CONADE**: Programas de activación física
- **DIF**: Centros de desarrollo comunitario

### Aplicaciones Móviles Gratuitas
- Medisafe (recordatorios de medicamentos)
- MyFitnessPal (seguimiento nutricional)
- Headspace (meditación)
- Lumosity (entrenamiento cognitivo)

## Plan de Acción Personal

### Semana 1-2: Evaluación
- Identificar factores de riesgo personales
- Establecer metas realistas
- Consultar con médico de cabecera

### Semana 3-4: Implementación Gradual
- Comenzar rutina de ejercicio (15 min/día)
- Modificar una comida diaria
- Establecer horario de sueño

### Mes 2-3: Consolidación
- Aumentar intensidad del ejercicio
- Incorporar actividades sociales
- Agregar estimulación cognitiva

### Seguimiento Continuo
- Evaluación mensual de progreso
- Ajustes según necesidades
- Celebrar logros pequeños

## Conclusión

La salud cerebral es el resultado de decisiones diarias. Pequeños cambios sostenidos en el tiempo pueden tener un impacto significativo en la prevención del deterioro cognitivo y la promoción del envejecimiento saludable.
    `,
    category: 'lifestyle_factors',
    tags: ['estilo de vida', 'prevención', 'salud cerebral', 'hábitos saludables'],
    readingTime: 12,
    difficulty: 'intermediate',
    lastUpdated: new Date('2024-01-25'),
    author: 'Dra. Ana Martínez, Geriatra',
    sources: MEXICAN_MEDICAL_SOURCES.slice(0, 5),
    relatedArticles: ['alzheimer-prevention-basics', 'nutrition-brain-health']
  },
  {
    id: 'depression-cognitive-impact',
    title: 'Depresión y su Impacto en la Función Cognitiva',
    summary: 'Comprende la relación entre depresión y deterioro cognitivo, y estrategias de prevención.',
    content: `
# Depresión y su Impacto en la Función Cognitiva

## La Conexión Depresión-Cognición

La depresión no solo afecta el estado de ánimo; también tiene un impacto significativo en las funciones cognitivas como memoria, atención y función ejecutiva.

## Mecanismos de Impacto

### 1. Cambios Neurobiológicos
- **Hipocampo**: Reducción del volumen por estrés crónico
- **Corteza prefrontal**: Alteración en funciones ejecutivas
- **Neurotransmisores**: Desequilibrio de serotonina, dopamina y noradrenalina

### 2. Inflamación Cerebral
- Aumento de citoquinas proinflamatorias
- Activación de la microglía
- Daño oxidativo neuronal

### 3. Alteraciones del Sueño
- Fragmentación del sueño REM
- Reducción del sueño profundo
- Impacto en la consolidación de memoria

## Síntomas Cognitivos de la Depresión

### Memoria
- Dificultad para recordar información nueva
- Problemas con la memoria de trabajo
- Sesgos hacia recuerdos negativos

### Atención y Concentración
- Dificultad para mantener el foco
- Distractibilidad aumentada
- Problemas para dividir la atención

### Función Ejecutiva
- Dificultad para tomar decisiones
- Problemas de planificación
- Reducción de la flexibilidad cognitiva

### Velocidad de Procesamiento
- Lentitud en el pensamiento
- Tiempo de reacción aumentado
- Dificultad para procesar información compleja

## Factores de Riesgo en México

### Socioeconómicos
- Pobreza y desigualdad
- Desempleo o subempleo
- Falta de acceso a servicios de salud

### Culturales
- Estigma hacia la salud mental
- Roles de género tradicionales
- Migración y separación familiar

### Ambientales
- Violencia urbana
- Contaminación ambiental
- Estrés urbano

## Estrategias de Prevención

### 1. Actividad Física Regular

#### Ejercicio Aeróbico
- **Intensidad**: Moderada, 150 min/semana
- **Tipos**: Caminata rápida, ciclismo, natación
- **Beneficios**: Aumenta BDNF (factor neurotrófico)

#### Ejercicio en Grupo
- Clases de baile en centros comunitarios
- Grupos de caminata en parques
- Deportes recreativos

### 2. Técnicas de Manejo del Estrés

#### Mindfulness y Meditación
- **Práctica diaria**: 10-20 minutos
- **Aplicaciones**: Headspace, Calm (en español)
- **Centros**: Grupos de meditación budista

#### Técnicas de Respiración
- Respiración diafragmática
- Técnica 4-7-8
- Coherencia cardíaca

### 3. Apoyo Social

#### Redes de Apoyo
- Grupos de apoyo mutuo
- Participación en actividades comunitarias
- Voluntariado

#### Terapia Familiar
- Comunicación asertiva
- Resolución de conflictos
- Fortalecimiento de vínculos

### 4. Nutrición para el Estado de Ánimo

#### Alimentos que Mejoran el Ánimo
- **Omega-3**: Pescado, nueces, chía
- **Triptófano**: Pavo, huevos, plátanos
- **Magnesio**: Espinacas, almendras, cacao
- **Vitamina D**: Exposición solar, pescado graso

#### Alimentos Tradicionales Mexicanos
- **Cacao**: Precursor de serotonina
- **Chía**: Rica en omega-3
- **Amaranto**: Proteína completa y magnesio
- **Quelites**: Folatos para función cerebral

## Tratamiento Integral

### 1. Intervención Psicológica

#### Terapia Cognitivo-Conductual (TCC)
- Identificación de pensamientos negativos
- Reestructuración cognitiva
- Técnicas de activación conductual

#### Terapia Interpersonal
- Mejora de relaciones sociales
- Resolución de duelos
- Manejo de transiciones vitales

### 2. Tratamiento Farmacológico

#### Antidepresivos
- **ISRS**: Primera línea de tratamiento
- **IRSN**: Para síntomas mixtos
- **Consideraciones**: Efectos en cognición

#### Suplementos
- Omega-3 (1-2g/día)
- Vitamina D (1000-2000 UI/día)
- Magnesio (200-400mg/día)

### 3. Intervenciones Cognitivas

#### Entrenamiento Cognitivo
- Ejercicios de memoria
- Tareas de atención sostenida
- Juegos de función ejecutiva

#### Estimulación Cognitiva
- Lectura diaria
- Crucigramas y sudokus
- Aprendizaje de nuevas habilidades

## Recursos en México

### Servicios Públicos
- **Centros de Salud Mental**: IMSS, ISSSTE
- **Línea de Crisis**: SAPTEL 55-5259-8121
- **Centros de Integración Juvenil**: Prevención y tratamiento

### Organizaciones No Gubernamentales
- Asociación Psiquiátrica Mexicana
- Fundación Mexicana para la Salud Mental
- Grupos de Apoyo Mutuo

### Recursos Digitales
- Plataforma "Cuida tu Mente" (Gobierno de México)
- App "MindShift" (manejo de ansiedad)
- Terapia en línea: BetterHelp, Terapify

## Señales de Alerta

### Síntomas Depresivos Mayores
- Estado de ánimo deprimido >2 semanas
- Pérdida de interés en actividades
- Cambios significativos en peso/apetito
- Trastornos del sueño
- Fatiga o pérdida de energía

### Síntomas Cognitivos Preocupantes
- Olvidos frecuentes que interfieren con el trabajo
- Dificultad para concentrarse en tareas simples
- Problemas para tomar decisiones rutinarias
- Confusión o desorientación

### Cuándo Buscar Ayuda Profesional
- Síntomas persisten >2 semanas
- Interfieren con actividades diarias
- Pensamientos de autolesión
- Deterioro cognitivo progresivo

## Plan de Prevención Personal

### Evaluación Inicial
1. Cuestionario PHQ-9 (disponible en esta app)
2. Evaluación de factores de riesgo
3. Identificación de recursos de apoyo

### Estrategias Diarias
- Rutina de ejercicio (30 min)
- Práctica de mindfulness (10 min)
- Conexión social (llamada/visita)
- Actividad placentera (hobby)

### Seguimiento Semanal
- Monitoreo del estado de ánimo
- Evaluación de síntomas cognitivos
- Ajuste de estrategias según necesidad

## Conclusión

La depresión y el deterioro cognitivo están íntimamente relacionados, pero ambos son prevenibles y tratables. La detección temprana y el tratamiento integral pueden preservar tanto la salud mental como la función cognitiva.
    `,
    category: 'depression_prevention',
    tags: ['depresión', 'cognición', 'salud mental', 'prevención'],
    readingTime: 11,
    difficulty: 'intermediate',
    lastUpdated: new Date('2024-01-30'),
    author: 'Dr. Roberto Silva, Psiquiatra',
    sources: MEXICAN_MEDICAL_SOURCES.slice(2, 6),
    relatedArticles: ['lifestyle-factors-brain-health', 'stress-management-techniques']
  }
];

export const EDUCATION_CATEGORIES = [
  { id: 'alzheimer_prevention', name: 'Prevención de Alzheimer', icon: '🧠' },
  { id: 'parkinson_prevention', name: 'Prevención de Parkinson', icon: '🤝' },
  { id: 'dementia_prevention', name: 'Prevención de Demencia', icon: '💭' },
  { id: 'depression_prevention', name: 'Prevención de Depresión', icon: '😊' },
  { id: 'lifestyle_factors', name: 'Factores de Estilo de Vida', icon: '🏃‍♂️' },
  { id: 'nutrition', name: 'Nutrición', icon: '🥗' },
  { id: 'exercise', name: 'Ejercicio', icon: '💪' },
  { id: 'sleep', name: 'Sueño', icon: '😴' },
  { id: 'cognitive_training', name: 'Entrenamiento Cognitivo', icon: '🎯' },
  { id: 'risk_factors', name: 'Factores de Riesgo', icon: '⚠️' },
  { id: 'early_detection', name: 'Detección Temprana', icon: '🔍' },
  { id: 'medical_resources', name: 'Recursos Médicos', icon: '🏥' }
] as const;