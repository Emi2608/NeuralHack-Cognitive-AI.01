-- =====================================================
-- NeuralHack Cognitive AI - Fix Database Constraints
-- =====================================================
-- Este script corrige problemas de constraints y mejora
-- la robustez de la base de datos
-- =====================================================

-- =====================================================
-- 1. FIX AUDIT LOGS CONSTRAINTS
-- =====================================================

-- Add unique constraint to prevent duplicate audit entries
-- (but allow multiple entries for the same user/action with different timestamps)
CREATE UNIQUE INDEX IF NOT EXISTS idx_audit_logs_unique_entry 
ON public.audit_logs (user_id, action, resource_type, resource_id, created_at);

-- Add constraint to ensure audit logs have required fields
ALTER TABLE public.audit_logs 
ADD CONSTRAINT chk_audit_logs_required_fields 
CHECK (action IS NOT NULL AND resource_type IS NOT NULL);

-- =====================================================
-- 2. FIX PROFILES TABLE CONSTRAINTS
-- =====================================================

-- Ensure profiles table has proper constraints
ALTER TABLE public.profiles 
ADD CONSTRAINT chk_profiles_email_format 
CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Ensure education level is reasonable
ALTER TABLE public.profiles 
ADD CONSTRAINT chk_profiles_education_level 
CHECK (education_level IS NULL OR (education_level >= 0 AND education_level <= 30));

-- Ensure language is valid
ALTER TABLE public.profiles 
ADD CONSTRAINT chk_profiles_language 
CHECK (language IN ('es', 'en'));

-- =====================================================
-- 3. IMPROVE PROFILE CREATION FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION complete_user_registration(
  user_id UUID,
  user_email TEXT,
  date_of_birth DATE DEFAULT NULL,
  education_level INTEGER DEFAULT NULL,
  language_pref TEXT DEFAULT 'es'
)
RETURNS JSON AS $
DECLARE
  profile_exists BOOLEAN;
  result JSON;
  retry_count INTEGER := 0;
  max_retries INTEGER := 3;
BEGIN
  -- Validate inputs
  IF user_id IS NULL OR user_email IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'user_id y user_email son requeridos'
    );
  END IF;

  -- Verify user exists and is confirmed
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
  
  -- Retry loop for handling concurrent access
  WHILE retry_count < max_retries LOOP
    BEGIN
      -- Check if profile exists
      SELECT EXISTS(
        SELECT 1 FROM public.profiles WHERE id = user_id
      ) INTO profile_exists;
      
      IF profile_exists THEN
        -- Update existing profile
        UPDATE public.profiles SET
          date_of_birth = COALESCE(complete_user_registration.date_of_birth, profiles.date_of_birth),
          education_level = COALESCE(complete_user_registration.education_level, profiles.education_level),
          language = language_pref,
          updated_at = NOW()
        WHERE id = user_id;
        
        RETURN json_build_object(
          'success', true,
          'profile_created', false,
          'profile_updated', true
        );
      ELSE
        -- Create new profile
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
        
        RETURN json_build_object(
          'success', true,
          'profile_created', true,
          'profile_updated', false
        );
      END IF;
      
      -- If we get here, operation succeeded
      EXIT;
      
    EXCEPTION 
      WHEN unique_violation THEN
        -- Profile was created by another process, retry
        retry_count := retry_count + 1;
        IF retry_count >= max_retries THEN
          RETURN json_build_object(
            'success', false,
            'error', 'Error de concurrencia al crear perfil'
          );
        END IF;
        -- Small delay before retry
        PERFORM pg_sleep(0.1);
      WHEN OTHERS THEN
        RETURN json_build_object(
          'success', false,
          'error', 'Error inesperado: ' || SQLERRM
        );
    END;
  END LOOP;
  
  -- Register consents (ignore conflicts)
  BEGIN
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
  EXCEPTION WHEN OTHERS THEN
    -- Ignore consent errors, they're not critical
    NULL;
  END;
  
  -- Log the event (ignore errors)
  BEGIN
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
        'profile_existed', profile_exists,
        'timestamp', NOW()
      )
    );
  EXCEPTION WHEN OTHERS THEN
    -- Ignore audit errors, they shouldn't break the main flow
    NULL;
  END;
  
  RETURN json_build_object(
    'success', true,
    'profile_created', NOT profile_exists,
    'profile_updated', profile_exists
  );
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 4. ADD MISSING CONSTRAINTS TO USER_CONSENTS
-- =====================================================

-- Add unique constraint for user consents to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_consents_unique 
ON public.user_consents (user_id, consent_type, version);

-- =====================================================
-- 5. CLEANUP FUNCTION FOR DUPLICATE AUDIT LOGS
-- =====================================================

CREATE OR REPLACE FUNCTION cleanup_duplicate_audit_logs()
RETURNS INTEGER AS $
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete duplicate audit logs, keeping the most recent one
  WITH duplicates AS (
    SELECT id,
           ROW_NUMBER() OVER (
             PARTITION BY user_id, action, resource_type, resource_id, 
                         DATE_TRUNC('second', created_at)
             ORDER BY created_at DESC
           ) as rn
    FROM public.audit_logs
  )
  DELETE FROM public.audit_logs 
  WHERE id IN (
    SELECT id FROM duplicates WHERE rn > 1
  );
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 6. IMPROVED ERROR HANDLING FOR AUDIT LOGS
-- =====================================================

CREATE OR REPLACE FUNCTION safe_audit_log(
  p_action TEXT,
  p_resource_type TEXT,
  p_resource_id TEXT DEFAULT NULL,
  p_user_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS BOOLEAN AS $
DECLARE
  unique_metadata JSONB;
BEGIN
  -- Add unique identifier to metadata
  unique_metadata := p_metadata || jsonb_build_object(
    'client_timestamp', NOW(),
    'unique_id', p_user_id::text || '-' || extract(epoch from NOW()) || '-' || random()
  );
  
  BEGIN
    INSERT INTO public.audit_logs (
      action,
      resource_type,
      resource_id,
      user_id,
      metadata,
      user_agent
    ) VALUES (
      p_action,
      p_resource_type,
      p_resource_id,
      p_user_id,
      unique_metadata,
      'server-function'
    );
    
    RETURN TRUE;
  EXCEPTION 
    WHEN unique_violation THEN
      -- Duplicate entry, ignore
      RETURN TRUE;
    WHEN OTHERS THEN
      -- Log error but don't fail
      RAISE WARNING 'Failed to insert audit log: %', SQLERRM;
      RETURN FALSE;
  END;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 7. UPDATE EXISTING FUNCTIONS TO USE SAFE AUDIT LOG
-- =====================================================

-- Update the profile change trigger to use safe audit logging
CREATE OR REPLACE FUNCTION log_profile_changes()
RETURNS TRIGGER AS $
BEGIN
  PERFORM safe_audit_log(
    CASE 
      WHEN TG_OP = 'INSERT' THEN 'profile_created'
      WHEN TG_OP = 'UPDATE' THEN 'profile_updated'
      WHEN TG_OP = 'DELETE' THEN 'profile_deleted'
    END,
    'profile',
    COALESCE(NEW.id::text, OLD.id::text),
    COALESCE(NEW.id, OLD.id),
    jsonb_build_object(
      'operation', TG_OP,
      'old_data', CASE WHEN TG_OP != 'INSERT' THEN to_jsonb(OLD) ELSE NULL END,
      'new_data', CASE WHEN TG_OP != 'DELETE' THEN to_jsonb(NEW) ELSE NULL END
    )
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 8. GRANT PERMISSIONS
-- =====================================================

GRANT EXECUTE ON FUNCTION cleanup_duplicate_audit_logs() TO authenticated;
GRANT EXECUTE ON FUNCTION safe_audit_log(TEXT, TEXT, TEXT, UUID, JSONB) TO authenticated;

-- =====================================================
-- INSTRUCTIONS
-- =====================================================

/*
Para aplicar estas correcciones:

1. Ejecutar este script en el SQL Editor de Supabase
2. Ejecutar la función de limpieza una vez:
   SELECT cleanup_duplicate_audit_logs();
3. Verificar que no hay errores en los logs de la aplicación
4. Monitorear el rendimiento después de aplicar los cambios

Las mejoras incluyen:
- Prevención de duplicados en audit_logs
- Mejor manejo de errores en la creación de perfiles
- Constraints mejorados para validación de datos
- Funciones más robustas con reintentos
- Logging seguro que no falla la operación principal
*/