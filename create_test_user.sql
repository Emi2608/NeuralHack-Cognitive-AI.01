-- =====================================================
-- NeuralHack Cognitive AI - Usuario de Prueba
-- =====================================================
-- Este script crea un usuario de prueba completo con datos
-- realistas para todas las tablas de la aplicación
-- 
-- INSTRUCCIONES:
-- 1. PRIMERO: Crear el usuario en Supabase Auth Dashboard:
--    - Email: test@neuralhack.com
--    - Password: TestUser123!
--    - Copiar el UUID generado y reemplazarlo en test_user_id
-- 2. DESPUÉS: Ejecutar este script en el SQL Editor de Supabase
-- =====================================================

-- Variables para el usuario de prueba
-- ⚠️ IMPORTANTE: Reemplaza este UUID con el ID real del usuario creado en Auth
DO $$ 
DECLARE
    test_user_id UUID := '550e8400-e29b-41d4-a716-446655440000'; -- ⚠️ CAMBIAR POR EL UUID REAL
    test_email TEXT := 'test@neuralhack.com';
    moca_session_id UUID := gen_random_uuid();
    phq9_session_id UUID := gen_random_uuid();
    mmse_session_id UUID := gen_random_uuid();
    ad8_session_id UUID := gen_random_uuid();
    parkinsons_session_id UUID := gen_random_uuid();
    share_token TEXT := encode(gen_random_bytes(32), 'base64');
    user_exists BOOLEAN := FALSE;
BEGIN

-- =====================================================
-- 0. VERIFICAR QUE EL USUARIO EXISTE EN AUTH.USERS
-- =====================================================

SELECT EXISTS(
    SELECT 1 FROM auth.users WHERE id = test_user_id
) INTO user_exists;

IF NOT user_exists THEN
    RAISE EXCEPTION 'El usuario con ID % no existe en auth.users. Primero crea el usuario en Supabase Auth Dashboard.', test_user_id;
END IF;

RAISE NOTICE 'Usuario encontrado en auth.users. Procediendo con la creación del perfil...';

-- =====================================================
-- 1. CREAR PERFIL DE USUARIO
-- =====================================================

INSERT INTO public.profiles (
    id,
    email,
    date_of_birth,
    education_level,
    language,
    accessibility_settings,
    consent_given,
    consent_date,
    status,
    created_at,
    updated_at
) VALUES (
    test_user_id,
    test_email,
    '1975-03-15'::DATE,
    16, -- Educación universitaria
    'es',
    '{
        "highContrast": false,
        "fontSize": "normal",
        "voiceGuidance": true,
        "keyboardNavigation": false,
        "touchTargetSize": "large"
    }'::JSONB,
    true,
    NOW() - INTERVAL '30 days',
    'active',
    NOW() - INTERVAL '30 days',
    NOW() - INTERVAL '1 day'
) ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    date_of_birth = EXCLUDED.date_of_birth,
    education_level = EXCLUDED.education_level,
    updated_at = NOW();

-- =====================================================
-- 2. CREAR CONSENTIMIENTOS GDPR
-- =====================================================

INSERT INTO public.user_consents (
    user_id,
    consent_type,
    granted,
    granted_at,
    version,
    ip_address,
    user_agent
) VALUES 
    (test_user_id, 'data_processing', true, NOW() - INTERVAL '30 days', '1.0', '192.168.1.100'::INET, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'),
    (test_user_id, 'analytics', true, NOW() - INTERVAL '30 days', '1.0', '192.168.1.100'::INET, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'),
    (test_user_id, 'research', true, NOW() - INTERVAL '25 days', '1.0', '192.168.1.100'::INET, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'),
    (test_user_id, 'marketing', false, NULL, '1.0', '192.168.1.100'::INET, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')
ON CONFLICT DO NOTHING;

-- =====================================================
-- 3. CREAR SESIONES DE EVALUACIÓN COMPLETADAS
-- =====================================================

-- Evaluación MoCA (hace 25 días) - Puntuación normal
INSERT INTO public.assessment_sessions (
    id,
    user_id,
    test_type,
    status,
    current_question_index,
    started_at,
    completed_at,
    last_activity_at,
    responses,
    result,
    metadata
) VALUES (
    moca_session_id,
    test_user_id,
    'moca',
    'completed',
    30,
    NOW() - INTERVAL '25 days',
    NOW() - INTERVAL '25 days' + INTERVAL '12 minutes',
    NOW() - INTERVAL '25 days' + INTERVAL '12 minutes',
    '[
        {"questionId": "moca_visuospatial_1", "response": "correct", "timestamp": "2024-11-13T10:15:00Z"},
        {"questionId": "moca_visuospatial_2", "response": "correct", "timestamp": "2024-11-13T10:16:00Z"},
        {"questionId": "moca_naming_1", "response": "correct", "timestamp": "2024-11-13T10:17:00Z"},
        {"questionId": "moca_memory_1", "response": "correct", "timestamp": "2024-11-13T10:18:00Z"},
        {"questionId": "moca_attention_1", "response": "correct", "timestamp": "2024-11-13T10:19:00Z"}
    ]'::JSONB,
    '{
        "id": "' || moca_session_id || '",
        "testType": "moca",
        "totalScore": 26,
        "maxScore": 30,
        "rawScore": 26,
        "adjustedScore": 26,
        "completionTime": 720,
        "sectionScores": {
            "visuospatial": 4,
            "naming": 3,
            "memory": 0,
            "attention": 5,
            "language": 2,
            "abstraction": 2,
            "delayed_recall": 4,
            "orientation": 6
        },
        "riskAssessment": {
            "riskPercentage": 15,
            "riskCategory": "low",
            "confidence": 0.85,
            "factors": ["age_adjusted", "education_adjusted"]
        },
        "recommendations": [
            {
                "id": "moca_normal_1",
                "testType": "moca",
                "riskLevel": "low",
                "type": "lifestyle",
                "category": "maintenance",
                "title": "Mantén tu salud cognitiva",
                "description": "Tus resultados están dentro del rango normal. Continúa con hábitos saludables.",
                "priority": "low",
                "actionSteps": [
                    "Mantén una rutina de ejercicio regular",
                    "Sigue una dieta mediterránea",
                    "Realiza actividades cognitivamente estimulantes"
                ],
                "resources": [
                    {"title": "Ejercicios para la memoria", "url": "https://example.com/memory-exercises"}
                ]
            }
        ]
    }'::JSONB,
    '{
        "deviceInfo": {"platform": "web", "userAgent": "Mozilla/5.0"},
        "sessionDuration": 720,
        "interruptions": 0
    }'::JSONB
);

-- Evaluación PHQ-9 (hace 20 días) - Depresión leve
INSERT INTO public.assessment_sessions (
    id,
    user_id,
    test_type,
    status,
    current_question_index,
    started_at,
    completed_at,
    last_activity_at,
    responses,
    result,
    metadata
) VALUES (
    phq9_session_id,
    test_user_id,
    'phq9',
    'completed',
    9,
    NOW() - INTERVAL '20 days',
    NOW() - INTERVAL '20 days' + INTERVAL '8 minutes',
    NOW() - INTERVAL '20 days' + INTERVAL '8 minutes',
    '[
        {"questionId": "phq9_1", "response": 1, "timestamp": "2024-11-18T14:30:00Z"},
        {"questionId": "phq9_2", "response": 1, "timestamp": "2024-11-18T14:31:00Z"},
        {"questionId": "phq9_3", "response": 2, "timestamp": "2024-11-18T14:32:00Z"},
        {"questionId": "phq9_4", "response": 1, "timestamp": "2024-11-18T14:33:00Z"},
        {"questionId": "phq9_5", "response": 0, "timestamp": "2024-11-18T14:34:00Z"},
        {"questionId": "phq9_6", "response": 1, "timestamp": "2024-11-18T14:35:00Z"},
        {"questionId": "phq9_7", "response": 1, "timestamp": "2024-11-18T14:36:00Z"},
        {"questionId": "phq9_8", "response": 0, "timestamp": "2024-11-18T14:37:00Z"},
        {"questionId": "phq9_9", "response": 0, "timestamp": "2024-11-18T14:38:00Z"}
    ]'::JSONB,
    '{
        "id": "' || phq9_session_id || '",
        "testType": "phq9",
        "totalScore": 7,
        "maxScore": 27,
        "rawScore": 7,
        "adjustedScore": 7,
        "completionTime": 480,
        "severityLevel": "mild",
        "suicidalIdeation": false,
        "functionalImpairment": "mild",
        "sectionScores": [],
        "riskAssessment": {
            "riskPercentage": 25,
            "riskCategory": "low",
            "confidence": 0.90,
            "factors": ["mild_symptoms", "no_suicidal_ideation"]
        },
        "recommendations": [
            {
                "id": "phq9_mild_1",
                "testType": "phq9",
                "riskLevel": "low",
                "type": "lifestyle",
                "category": "short_term",
                "title": "Estrategias de bienestar mental",
                "description": "Síntomas leves de depresión detectados. Considera estrategias de autocuidado.",
                "priority": "medium",
                "actionSteps": [
                    "Establece una rutina diaria regular",
                    "Practica técnicas de relajación",
                    "Mantén conexiones sociales"
                ],
                "resources": [
                    {"title": "Técnicas de mindfulness", "url": "https://example.com/mindfulness"}
                ]
            }
        ]
    }'::JSONB,
    '{
        "deviceInfo": {"platform": "web", "userAgent": "Mozilla/5.0"},
        "sessionDuration": 480,
        "interruptions": 0
    }'::JSONB
);

-- Evaluación MMSE (hace 15 días) - Puntuación normal
INSERT INTO public.assessment_sessions (
    id,
    user_id,
    test_type,
    status,
    current_question_index,
    started_at,
    completed_at,
    last_activity_at,
    responses,
    result,
    metadata
) VALUES (
    mmse_session_id,
    test_user_id,
    'mmse',
    'completed',
    30,
    NOW() - INTERVAL '15 days',
    NOW() - INTERVAL '15 days' + INTERVAL '10 minutes',
    NOW() - INTERVAL '15 days' + INTERVAL '10 minutes',
    '[
        {"questionId": "mmse_orientation_1", "response": "correct", "timestamp": "2024-11-23T09:00:00Z"},
        {"questionId": "mmse_registration_1", "response": "correct", "timestamp": "2024-11-23T09:01:00Z"},
        {"questionId": "mmse_attention_1", "response": "correct", "timestamp": "2024-11-23T09:02:00Z"},
        {"questionId": "mmse_recall_1", "response": "partial", "timestamp": "2024-11-23T09:03:00Z"},
        {"questionId": "mmse_language_1", "response": "correct", "timestamp": "2024-11-23T09:04:00Z"}
    ]'::JSONB,
    '{
        "id": "' || mmse_session_id || '",
        "testType": "mmse",
        "totalScore": 28,
        "maxScore": 30,
        "rawScore": 28,
        "adjustedScore": 28,
        "completionTime": 600,
        "sectionScores": [],
        "riskAssessment": {
            "riskPercentage": 10,
            "riskCategory": "low",
            "confidence": 0.88,
            "factors": ["normal_range", "age_appropriate"]
        },
        "recommendations": []
    }'::JSONB,
    '{
        "deviceInfo": {"platform": "web", "userAgent": "Mozilla/5.0"},
        "sessionDuration": 600,
        "interruptions": 0
    }'::JSONB
);

-- Evaluación AD8 (hace 10 días) - Sin signos de demencia
INSERT INTO public.assessment_sessions (
    id,
    user_id,
    test_type,
    status,
    current_question_index,
    started_at,
    completed_at,
    last_activity_at,
    responses,
    result,
    metadata
) VALUES (
    ad8_session_id,
    test_user_id,
    'ad8',
    'completed',
    8,
    NOW() - INTERVAL '10 days',
    NOW() - INTERVAL '10 days' + INTERVAL '5 minutes',
    NOW() - INTERVAL '10 days' + INTERVAL '5 minutes',
    '[
        {"questionId": "ad8_1", "response": "no", "timestamp": "2024-11-28T16:00:00Z"},
        {"questionId": "ad8_2", "response": "no", "timestamp": "2024-11-28T16:01:00Z"},
        {"questionId": "ad8_3", "response": "yes", "timestamp": "2024-11-28T16:02:00Z"},
        {"questionId": "ad8_4", "response": "no", "timestamp": "2024-11-28T16:03:00Z"},
        {"questionId": "ad8_5", "response": "no", "timestamp": "2024-11-28T16:04:00Z"},
        {"questionId": "ad8_6", "response": "no", "timestamp": "2024-11-28T16:05:00Z"},
        {"questionId": "ad8_7", "response": "no", "timestamp": "2024-11-28T16:06:00Z"},
        {"questionId": "ad8_8", "response": "no", "timestamp": "2024-11-28T16:07:00Z"}
    ]'::JSONB,
    '{
        "id": "' || ad8_session_id || '",
        "testType": "ad8",
        "totalScore": 1,
        "maxScore": 8,
        "rawScore": 1,
        "adjustedScore": 1,
        "completionTime": 300,
        "sectionScores": [],
        "riskAssessment": {
            "riskPercentage": 5,
            "riskCategory": "low",
            "confidence": 0.95,
            "factors": ["low_score", "single_positive"]
        },
        "recommendations": []
    }'::JSONB,
    '{
        "deviceInfo": {"platform": "web", "userAgent": "Mozilla/5.0"},
        "sessionDuration": 300,
        "interruptions": 0
    }'::JSONB
);

-- Evaluación Parkinson (hace 5 días) - Sin signos significativos
INSERT INTO public.assessment_sessions (
    id,
    user_id,
    test_type,
    status,
    current_question_index,
    started_at,
    completed_at,
    last_activity_at,
    responses,
    result,
    metadata
) VALUES (
    parkinsons_session_id,
    test_user_id,
    'parkinsons',
    'completed',
    15,
    NOW() - INTERVAL '5 days',
    NOW() - INTERVAL '5 days' + INTERVAL '15 minutes',
    NOW() - INTERVAL '5 days' + INTERVAL '15 minutes',
    '[
        {"questionId": "parkinsons_motor_1", "response": 0, "timestamp": "2024-12-03T11:00:00Z"},
        {"questionId": "parkinsons_motor_2", "response": 1, "timestamp": "2024-12-03T11:01:00Z"},
        {"questionId": "parkinsons_motor_3", "response": 0, "timestamp": "2024-12-03T11:02:00Z"},
        {"questionId": "parkinsons_nonmotor_1", "response": 1, "timestamp": "2024-12-03T11:03:00Z"},
        {"questionId": "parkinsons_nonmotor_2", "response": 0, "timestamp": "2024-12-03T11:04:00Z"}
    ]'::JSONB,
    '{
        "id": "' || parkinsons_session_id || '",
        "testType": "parkinsons",
        "totalScore": 2,
        "maxScore": 20,
        "rawScore": 2,
        "adjustedScore": 2,
        "completionTime": 900,
        "sectionScores": [],
        "riskAssessment": {
            "riskPercentage": 8,
            "riskCategory": "low",
            "confidence": 0.92,
            "factors": ["minimal_symptoms", "age_appropriate"]
        },
        "recommendations": []
    }'::JSONB,
    '{
        "deviceInfo": {"platform": "web", "userAgent": "Mozilla/5.0"},
        "sessionDuration": 900,
        "interruptions": 0
    }'::JSONB
);

-- =====================================================
-- 4. CREAR DATOS DE SEGUIMIENTO LONGITUDINAL
-- =====================================================

INSERT INTO public.longitudinal_tracking (
    user_id,
    assessment_id,
    test_type,
    score,
    risk_percentage,
    change_from_previous,
    is_significant_change
) VALUES 
    (test_user_id, moca_session_id, 'moca', 26, 15, NULL, false),
    (test_user_id, phq9_session_id, 'phq9', 7, 25, NULL, false),
    (test_user_id, mmse_session_id, 'mmse', 28, 10, 2, false),
    (test_user_id, ad8_session_id, 'ad8', 1, 5, NULL, false),
    (test_user_id, parkinsons_session_id, 'parkinsons', 2, 8, NULL, false);

-- =====================================================
-- 5. CREAR RECORDATORIOS
-- =====================================================

INSERT INTO public.reminders (
    user_id,
    test_type,
    frequency_days,
    next_reminder_date,
    is_active,
    custom_message
) VALUES 
    (test_user_id, 'moca', 90, CURRENT_DATE + INTERVAL '65 days', true, 'Recuerda realizar tu evaluación cognitiva trimestral'),
    (test_user_id, 'phq9', 30, CURRENT_DATE + INTERVAL '10 days', true, 'Es momento de revisar tu bienestar emocional'),
    (test_user_id, 'mmse', 180, CURRENT_DATE + INTERVAL '165 days', true, NULL);

-- =====================================================
-- 6. CREAR ENLACE DE COMPARTIR
-- =====================================================

INSERT INTO public.share_links (
    user_id,
    assessment_id,
    share_token,
    encrypted_data,
    expires_at,
    access_count,
    max_access_count,
    is_active,
    metadata
) VALUES (
    test_user_id,
    moca_session_id,
    share_token,
    'encrypted_assessment_data_here',
    NOW() + INTERVAL '7 days',
    0,
    3,
    true,
    '{
        "sharedWith": "Dr. García",
        "purpose": "medical_consultation",
        "createdBy": "patient"
    }'::JSONB
);

-- =====================================================
-- 7. CREAR EVENTOS DE ANALYTICS
-- =====================================================

INSERT INTO public.analytics_events (
    event_name,
    event_data,
    user_id,
    session_id,
    page_url,
    user_agent
) VALUES 
    ('session_start', '{"source": "direct"}', test_user_id, 'sess_' || extract(epoch from now()), '/dashboard', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'),
    ('assessment_started', '{"testType": "moca"}', test_user_id, 'sess_' || extract(epoch from now()), '/assessment/moca', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'),
    ('assessment_completed', '{"testType": "moca", "score": 26, "duration": 720}', test_user_id, 'sess_' || extract(epoch from now()), '/assessment/moca/results', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'),
    ('dashboard_viewed', '{"section": "results"}', test_user_id, 'sess_' || extract(epoch from now()), '/dashboard', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'),
    ('share_link_created', '{"assessmentType": "moca"}', test_user_id, 'sess_' || extract(epoch from now()), '/share', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

-- =====================================================
-- 8. CREAR LOGS DE AUDITORÍA
-- =====================================================

INSERT INTO public.audit_logs (
    user_id,
    action,
    resource_type,
    resource_id,
    metadata,
    ip_address,
    user_agent
) VALUES 
    (test_user_id, 'profile_created', 'profile', test_user_id::text, '{"operation": "INSERT"}', '192.168.1.100'::INET, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'),
    (test_user_id, 'assessment_created', 'assessment_session', moca_session_id::text, '{"testType": "moca", "status": "completed"}', '192.168.1.100'::INET, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'),
    (test_user_id, 'assessment_created', 'assessment_session', phq9_session_id::text, '{"testType": "phq9", "status": "completed"}', '192.168.1.100'::INET, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'),
    (test_user_id, 'share_link_created', 'share_link', share_token, '{"assessmentId": "' || moca_session_id || '"}', '192.168.1.100'::INET, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'),
    (test_user_id, 'consent_granted', 'user_consent', 'data_processing', '{"consentType": "data_processing", "granted": true}', '192.168.1.100'::INET, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

-- =====================================================
-- 9. CREAR ANÁLISIS DE TENDENCIAS
-- =====================================================

INSERT INTO public.trend_analysis (
    user_id,
    test_type,
    timeframe,
    direction,
    change_percentage,
    significance,
    data_points,
    start_date,
    end_date,
    confidence
) VALUES 
    (test_user_id, 'moca', 'month', 'stable', 0.0385, 'not_significant', 2, NOW() - INTERVAL '25 days', NOW() - INTERVAL '15 days', 0.75),
    (test_user_id, 'phq9', 'month', 'improving', -0.1429, 'mild', 1, NOW() - INTERVAL '20 days', NOW() - INTERVAL '20 days', 0.60);

-- =====================================================
-- 10. CREAR MÉTRICAS DE RENDIMIENTO
-- =====================================================

INSERT INTO public.performance_metrics (
    metric_name,
    metric_value,
    metric_unit,
    page_url,
    user_id,
    additional_data
) VALUES 
    ('page_load_time', 1.25, 'seconds', '/dashboard', test_user_id, '{"browser": "Chrome", "device": "desktop"}'),
    ('assessment_completion_time', 720, 'seconds', '/assessment/moca', test_user_id, '{"testType": "moca", "interruptions": 0}'),
    ('api_response_time', 0.15, 'seconds', '/api/assessments', test_user_id, '{"endpoint": "get_assessments", "method": "GET"}');

RAISE NOTICE 'Usuario de prueba creado exitosamente!';
RAISE NOTICE 'Email: %', test_email;
RAISE NOTICE 'User ID: %', test_user_id;
RAISE NOTICE 'Evaluaciones completadas: 5 (MoCA, PHQ-9, MMSE, AD8, Parkinson)';
RAISE NOTICE 'Recordatorios activos: 3';
RAISE NOTICE 'Enlaces de compartir: 1';

END $$;

-- =====================================================
-- CONSULTAS DE VERIFICACIÓN
-- =====================================================

-- Verificar que el usuario fue creado correctamente
SELECT 
    'Usuario creado' as status,
    email,
    date_of_birth,
    education_level,
    language,
    consent_given,
    created_at
FROM public.profiles 
WHERE email = 'test@neuralhack.com';

-- Verificar evaluaciones completadas
SELECT 
    'Evaluaciones' as status,
    test_type,
    status,
    (result->>'totalScore')::int as score,
    (result->>'riskAssessment'->>'riskPercentage')::int as risk_percentage,
    completed_at
FROM public.assessment_sessions 
WHERE user_id = '550e8400-e29b-41d4-a716-446655440000'
ORDER BY completed_at DESC;

-- Verificar recordatorios
SELECT 
    'Recordatorios' as status,
    test_type,
    frequency_days,
    next_reminder_date,
    is_active
FROM public.reminders 
WHERE user_id = '550e8400-e29b-41d4-a716-446655440000';

-- Verificar consentimientos
SELECT 
    'Consentimientos' as status,
    consent_type,
    granted,
    granted_at,
    version
FROM public.user_consents 
WHERE user_id = '550e8400-e29b-41d4-a716-446655440000';

-- =====================================================
-- NOTAS IMPORTANTES
-- =====================================================

/*
DESPUÉS DE EJECUTAR ESTE SCRIPT:

1. Ve a Supabase Auth Dashboard
2. Crea manualmente el usuario con:
   - Email: test@neuralhack.com
   - Password: TestUser123!
   - User ID: 550e8400-e29b-41d4-a716-446655440000

3. El usuario tendrá:
   ✅ Perfil completo con configuraciones de accesibilidad
   ✅ 5 evaluaciones completadas con resultados realistas
   ✅ Datos de seguimiento longitudinal
   ✅ 3 recordatorios activos
   ✅ 1 enlace de compartir activo
   ✅ Consentimientos GDPR completos
   ✅ Logs de auditoría
   ✅ Eventos de analytics
   ✅ Métricas de rendimiento

4. Puedes usar este usuario para:
   - Probar el dashboard con datos reales
   - Verificar funcionalidades de compartir
   - Probar recordatorios y alertas
   - Validar análisis longitudinal
   - Probar exportación de datos GDPR
*/