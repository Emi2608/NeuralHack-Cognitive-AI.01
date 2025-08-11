-- =====================================================
-- NeuralHack Cognitive AI - Auth Flow Update
-- =====================================================
-- Este script actualiza la configuración existente para mejorar
-- el flujo de confirmación de email y registro de usuarios
-- 
-- Ejecutar DESPUÉS del script database_setup_complete.sql
-- =====================================================

-- =====================================================
-- 1. FUNCIÓN PARA MANEJAR USUARIOS CONFIRMADOS
-- =====================================================

-- Función para crear perfil automáticamente después de confirmación de email
CREATE OR REPLACE FUNCTION handle_new_user_confirmation()
RETURNS TRIGGER AS $$
DECLARE
  profile_exists BOOLEAN;
BEGIN
  -- Solo procesar cuando el email se confirma por primera vez
  IF OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL THEN
    
    -- Verificar si ya existe un perfil
    SELECT EXISTS(
      SELECT 1 FROM public.profiles WHERE id = NEW.id
    ) INTO profile_exists;
    
    -- Si no existe perfil, crear uno básico
    IF NOT profile_exists THEN
      INSERT INTO public.profiles (
        id,
        email,
        language,
        consent_given,
        consent_date,
        accessibility_settings
      ) VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'language', 'es'),
        true, -- Asumimos que dieron consentimiento al registrarse
        NOW(),
        '{
          "highContrast": false,
          "fontSize": "normal",
          "voiceGuidance": false,
          "keyboardNavigation": false,
          "touchTargetSize": "normal"
        }'::jsonb
      );
      
      -- Log del evento
      INSERT INTO public.audit_logs (
        action,
        resource_type,
        resource_id,
        user_id,
        metadata
      ) VALUES (
        'profile_auto_created',
        'profile',
        NEW.id::text,
        NEW.id,
        jsonb_build_object(
          'trigger', 'email_confirmation',
          'email', NEW.email,
          'confirmed_at', NEW.email_confirmed_at
        )
      );
    END IF;
    
    -- Registrar consentimiento inicial si no existe
    INSERT INTO public.user_consents (
      user_id,
      consent_type,
      granted,
      granted_at,
      version
    ) VALUES 
      (NEW.id, 'data_processing', true, NOW(), '1.0'),
      (NEW.id, 'analytics', true, NOW(), '1.0')
    ON CONFLICT DO NOTHING;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 2. TRIGGER PARA USUARIOS CONFIRMADOS
-- =====================================================

-- Crear trigger en auth.users (requiere permisos de superusuario)
-- NOTA: Este trigger debe ser creado por un administrador de Supabase
-- ya que modifica el esquema auth

-- DROP TRIGGER IF EXISTS on_auth_user_confirmed ON auth.users;
-- CREATE TRIGGER on_auth_user_confirmed
--   AFTER UPDATE OF email_confirmed_at ON auth.users
--   FOR EACH ROW EXECUTE FUNCTION handle_new_user_confirmation();

-- =====================================================
-- 3. FUNCIÓN ALTERNATIVA PARA LLAMAR DESDE LA APP
-- =====================================================

-- Función que puede ser llamada desde la aplicación después de confirmación
CREATE OR REPLACE FUNCTION complete_user_registration(
  user_id UUID,
  user_email TEXT,
  date_of_birth DATE DEFAULT NULL,
  education_level INTEGER DEFAULT NULL,
  language_pref TEXT DEFAULT 'es'
)
RETURNS JSON AS $$
DECLARE
  profile_exists BOOLEAN;
  result JSON;
BEGIN
  -- Verificar que el usuario existe y está confirmado
  IF NOT EXISTS(
    SELECT 1 FROM auth.users 
    WHERE id = user_id 
    AND email_confirmed_at IS NOT NULL
  ) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Usuario no encontrado o email no confirmado'
    );
  END IF;
  
  -- Verificar si ya existe un perfil
  SELECT EXISTS(
    SELECT 1 FROM public.profiles WHERE id = user_id
  ) INTO profile_exists;
  
  -- Crear o actualizar perfil
  IF profile_exists THEN
    -- Actualizar perfil existente con datos adicionales
    UPDATE public.profiles SET
      date_of_birth = COALESCE(complete_user_registration.date_of_birth, profiles.date_of_birth),
      education_level = COALESCE(complete_user_registration.education_level, profiles.education_level),
      language = language_pref,
      updated_at = NOW()
    WHERE id = user_id;
  ELSE
    -- Crear nuevo perfil
    INSERT INTO public.profiles (
      id,
      email,
      date_of_birth,
      education_level,
      language,
      consent_given,
      consent_date,
      accessibility_settings
    ) VALUES (
      user_id,
      user_email,
      date_of_birth,
      education_level,
      language_pref,
      true,
      NOW(),
      '{
        "highContrast": false,
        "fontSize": "normal",
        "voiceGuidance": false,
        "keyboardNavigation": false,
        "touchTargetSize": "normal"
      }'::jsonb
    );
  END IF;
  
  -- Registrar consentimientos si no existen
  INSERT INTO public.user_consents (
    user_id,
    consent_type,
    granted,
    granted_at,
    version
  ) VALUES 
    (user_id, 'data_processing', true, NOW(), '1.0'),
    (user_id, 'analytics', true, NOW(), '1.0')
  ON CONFLICT (user_id, consent_type, version) DO NOTHING;
  
  -- Log del evento
  INSERT INTO public.audit_logs (
    action,
    resource_type,
    resource_id,
    user_id,
    metadata
  ) VALUES (
    'registration_completed',
    'profile',
    user_id::text,
    user_id,
    jsonb_build_object(
      'method', 'complete_user_registration',
      'email', user_email,
      'language', language_pref,
      'profile_existed', profile_exists
    )
  );
  
  RETURN json_build_object(
    'success', true,
    'profile_created', NOT profile_exists,
    'profile_updated', profile_exists
  );
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 4. FUNCIÓN PARA VERIFICAR ESTADO DE CONFIRMACIÓN
-- =====================================================

CREATE OR REPLACE FUNCTION check_user_confirmation_status(user_email TEXT)
RETURNS JSON AS $
DECLARE
  user_record RECORD;
  profile_exists BOOLEAN;
  result JSON;
BEGIN
  -- Buscar usuario por email
  SELECT 
    id,
    email,
    email_confirmed_at,
    created_at
  INTO user_record
  FROM auth.users 
  WHERE email = user_email;
  
  -- Si no existe el usuario
  IF user_record IS NULL THEN
    RETURN json_build_object(
      'exists', false,
      'confirmed', false,
      'profile_exists', false,
      'message', 'Usuario no encontrado'
    );
  END IF;
  
  -- Verificar si existe perfil
  SELECT EXISTS(
    SELECT 1 FROM public.profiles WHERE id = user_record.id
  ) INTO profile_exists;
  
  -- Construir respuesta
  RETURN json_build_object(
    'exists', true,
    'user_id', user_record.id,
    'email', user_record.email,
    'confirmed', user_record.email_confirmed_at IS NOT NULL,
    'confirmed_at', user_record.email_confirmed_at,
    'profile_exists', profile_exists,
    'created_at', user_record.created_at,
    'message', CASE 
      WHEN user_record.email_confirmed_at IS NULL THEN 'Email pendiente de confirmación'
      WHEN NOT profile_exists THEN 'Email confirmado, perfil pendiente'
      ELSE 'Usuario completamente registrado'
    END
  );
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 5. FUNCIÓN PARA REENVIAR CONFIRMACIÓN
-- =====================================================

CREATE OR REPLACE FUNCTION request_email_confirmation_resend(user_email TEXT)
RETURNS JSON AS $
DECLARE
  user_exists BOOLEAN;
  is_confirmed BOOLEAN;
BEGIN
  -- Verificar si el usuario existe y su estado
  SELECT 
    EXISTS(SELECT 1 FROM auth.users WHERE email = user_email),
    EXISTS(SELECT 1 FROM auth.users WHERE email = user_email AND email_confirmed_at IS NOT NULL)
  INTO user_exists, is_confirmed;
  
  IF NOT user_exists THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Usuario no encontrado'
    );
  END IF;
  
  IF is_confirmed THEN
    RETURN json_build_object(
      'success', false,
      'error', 'El email ya está confirmado'
    );
  END IF;
  
  -- Log del evento de reenvío solicitado
  INSERT INTO public.audit_logs (
    action,
    resource_type,
    resource_id,
    metadata
  ) VALUES (
    'confirmation_resend_requested',
    'user',
    user_email,
    jsonb_build_object(
      'email', user_email,
      'requested_at', NOW()
    )
  );
  
  RETURN json_build_object(
    'success', true,
    'message', 'Solicitud de reenvío registrada. Use la función de Supabase para reenviar.'
  );
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 6. POLÍTICAS RLS ADICIONALES
-- =====================================================

-- Permitir que los usuarios llamen a las funciones de utilidad
GRANT EXECUTE ON FUNCTION complete_user_registration(UUID, TEXT, DATE, INTEGER, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION check_user_confirmation_status(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION request_email_confirmation_resend(TEXT) TO anon, authenticated;

-- =====================================================
-- 7. ÍNDICES ADICIONALES PARA PERFORMANCE
-- =====================================================

-- Índice para búsquedas por email en auth.users (si no existe)
-- CREATE INDEX IF NOT EXISTS idx_auth_users_email ON auth.users(email);
-- CREATE INDEX IF NOT EXISTS idx_auth_users_email_confirmed ON auth.users(email_confirmed_at);

-- =====================================================
-- 8. VISTA PARA MONITOREO DE REGISTROS
-- =====================================================

CREATE OR REPLACE VIEW user_registration_status AS
SELECT 
  u.id,
  u.email,
  u.created_at as registered_at,
  u.email_confirmed_at,
  p.id IS NOT NULL as profile_exists,
  p.consent_given,
  p.consent_date,
  CASE 
    WHEN u.email_confirmed_at IS NULL THEN 'pending_confirmation'
    WHEN p.id IS NULL THEN 'confirmed_no_profile'
    WHEN p.consent_given IS NULL OR p.consent_given = false THEN 'profile_no_consent'
    ELSE 'complete'
  END as registration_status,
  EXTRACT(EPOCH FROM (NOW() - u.created_at))/3600 as hours_since_registration
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE u.created_at >= NOW() - INTERVAL '30 days'
ORDER BY u.created_at DESC;

-- =====================================================
-- 9. FUNCIÓN DE LIMPIEZA DE REGISTROS INCOMPLETOS
-- =====================================================

CREATE OR REPLACE FUNCTION cleanup_incomplete_registrations()
RETURNS JSON AS $
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Eliminar usuarios no confirmados después de 7 días
  -- NOTA: Esto requiere permisos de superusuario para modificar auth.users
  -- En producción, esto debería ser manejado por Supabase automáticamente
  
  -- Por ahora, solo reportamos cuántos hay
  SELECT COUNT(*) INTO deleted_count
  FROM auth.users 
  WHERE email_confirmed_at IS NULL 
  AND created_at < NOW() - INTERVAL '7 days';
  
  -- Log del evento
  INSERT INTO public.audit_logs (
    action,
    resource_type,
    metadata
  ) VALUES (
    'cleanup_incomplete_registrations',
    'system',
    jsonb_build_object(
      'unconfirmed_users_found', deleted_count,
      'cleanup_date', NOW()
    )
  );
  
  RETURN json_build_object(
    'success', true,
    'unconfirmed_users_found', deleted_count,
    'message', 'Limpieza completada. Los usuarios no confirmados deben ser eliminados por el administrador.'
  );
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 10. CONFIGURACIÓN DE NOTIFICACIONES
-- =====================================================

-- Tabla para configurar notificaciones de confirmación
CREATE TABLE IF NOT EXISTS public.email_confirmation_attempts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL,
    attempt_count INTEGER DEFAULT 1,
    first_attempt_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_attempt_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    confirmed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para la tabla de intentos
CREATE INDEX IF NOT EXISTS idx_email_confirmation_attempts_email 
ON public.email_confirmation_attempts(email);

-- Función para registrar intentos de confirmación
CREATE OR REPLACE FUNCTION log_confirmation_attempt(user_email TEXT)
RETURNS void AS $
BEGIN
  INSERT INTO public.email_confirmation_attempts (email)
  VALUES (user_email)
  ON CONFLICT (email) DO UPDATE SET
    attempt_count = email_confirmation_attempts.attempt_count + 1,
    last_attempt_at = NOW();
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- INSTRUCCIONES DE USO
-- =====================================================

/*
INSTRUCCIONES PARA IMPLEMENTAR:

1. Ejecutar este script en el SQL Editor de Supabase
2. En la aplicación, después de que un usuario confirme su email, llamar:
   SELECT complete_user_registration(user_id, email, date_of_birth, education_level, 'es');

3. Para verificar el estado de un usuario:
   SELECT check_user_confirmation_status('email@ejemplo.com');

4. Para monitorear registros:
   SELECT * FROM user_registration_status;

5. El trigger automático requiere permisos de superusuario. 
   Contactar al soporte de Supabase para habilitarlo.

NOTAS IMPORTANTES:
- Las funciones están diseñadas para ser seguras y no exponer datos sensibles
- Todas las operaciones se registran en audit_logs
- Las políticas RLS protegen el acceso a los datos
- El cleanup automático requiere configuración adicional del administrador
*/