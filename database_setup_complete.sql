-- =====================================================
-- NeuralHack Cognitive AI - Complete Database Setup
-- =====================================================
-- Este script crea toda la estructura de base de datos necesaria
-- para la aplicación NeuralHack Cognitive AI en Supabase
-- 
-- Ejecutar este script en el SQL Editor de Supabase
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- CORE TABLES
-- =====================================================

-- Create profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    date_of_birth DATE,
    education_level INTEGER,
    language TEXT DEFAULT 'es',
    accessibility_settings JSONB DEFAULT '{
        "highContrast": false,
        "fontSize": "normal",
        "voiceGuidance": false,
        "keyboardNavigation": false,
        "touchTargetSize": "normal"
    }',
    consent_given BOOLEAN DEFAULT FALSE,
    consent_date TIMESTAMP WITH TIME ZONE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'deleted', 'suspended')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create assessment_sessions table
CREATE TABLE IF NOT EXISTS public.assessment_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    test_type TEXT NOT NULL CHECK (test_type IN ('moca', 'phq9', 'mmse', 'ad8', 'parkinsons')),
    status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'abandoned')),
    current_question_index INTEGER DEFAULT 0,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    responses JSONB DEFAULT '[]',
    result JSONB,
    metadata JSONB DEFAULT '{}',
    anonymized_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- COMPLIANCE & AUDIT TABLES
-- =====================================================

-- Create audit_logs table for immutable audit trail
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT,
    metadata JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create user_consents table for GDPR compliance
CREATE TABLE IF NOT EXISTS public.user_consents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    consent_type TEXT NOT NULL CHECK (consent_type IN ('data_processing', 'analytics', 'marketing', 'research')),
    granted BOOLEAN NOT NULL,
    granted_at TIMESTAMP WITH TIME ZONE,
    withdrawn_at TIMESTAMP WITH TIME ZONE,
    version TEXT NOT NULL DEFAULT '1.0',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- =====================================================
-- SHARING & COLLABORATION TABLES
-- =====================================================

-- Create share_links table for secure data sharing
CREATE TABLE IF NOT EXISTS public.share_links (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    assessment_id UUID REFERENCES public.assessment_sessions(id) ON DELETE CASCADE,
    share_token TEXT UNIQUE NOT NULL,
    encrypted_data TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    access_count INTEGER DEFAULT 0,
    max_access_count INTEGER DEFAULT 1,
    password_hash TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    last_accessed_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- LONGITUDINAL TRACKING TABLES
-- =====================================================

-- Create longitudinal_tracking table
CREATE TABLE IF NOT EXISTS public.longitudinal_tracking (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    assessment_id UUID REFERENCES public.assessment_sessions(id) ON DELETE CASCADE,
    test_type TEXT NOT NULL,
    score NUMERIC NOT NULL,
    risk_percentage NUMERIC NOT NULL,
    change_from_previous NUMERIC,
    is_significant_change BOOLEAN DEFAULT FALSE,
    alert_sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create longitudinal_alerts table
CREATE TABLE IF NOT EXISTS public.longitudinal_alerts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    test_type TEXT NOT NULL,
    alert_type TEXT NOT NULL CHECK (alert_type IN ('significant_decline', 'rapid_decline', 'improvement', 'reminder')),
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    recommendations TEXT[] DEFAULT '{}',
    triggered TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    acknowledged BOOLEAN DEFAULT FALSE,
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create reminders table
CREATE TABLE IF NOT EXISTS public.reminders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    test_type TEXT NOT NULL,
    frequency_days INTEGER NOT NULL,
    next_reminder_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    custom_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create trend_analysis table
CREATE TABLE IF NOT EXISTS public.trend_analysis (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    test_type TEXT NOT NULL,
    timeframe TEXT NOT NULL CHECK (timeframe IN ('week', 'month', 'quarter', 'year')),
    direction TEXT NOT NULL CHECK (direction IN ('improving', 'stable', 'declining')),
    change_percentage DECIMAL(5,4) NOT NULL,
    significance TEXT NOT NULL CHECK (significance IN ('not_significant', 'mild', 'moderate', 'significant')),
    data_points INTEGER NOT NULL,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    confidence DECIMAL(3,2) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ANALYTICS & MONITORING TABLES
-- =====================================================

-- Analytics Events Table
CREATE TABLE IF NOT EXISTS public.analytics_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_name TEXT NOT NULL,
    event_data JSONB DEFAULT '{}',
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    session_id TEXT,
    page_url TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance Metrics Table
CREATE TABLE IF NOT EXISTS public.performance_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    metric_name TEXT NOT NULL,
    metric_value NUMERIC NOT NULL,
    metric_unit TEXT NOT NULL,
    page_url TEXT,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    additional_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Error Logs Table
CREATE TABLE IF NOT EXISTS public.error_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    error_message TEXT NOT NULL,
    error_stack TEXT,
    error_type TEXT NOT NULL,
    page_url TEXT,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    user_agent TEXT,
    additional_context JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Health Checks Table
CREATE TABLE IF NOT EXISTS public.health_checks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    service TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('healthy', 'degraded', 'unhealthy')),
    response_time INTEGER NOT NULL,
    error_message TEXT,
    additional_info JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System Metrics Table
CREATE TABLE IF NOT EXISTS public.system_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cpu_usage NUMERIC,
    memory_usage NUMERIC,
    disk_usage NUMERIC,
    network_latency NUMERIC,
    active_connections INTEGER,
    error_rate NUMERIC,
    response_time_avg NUMERIC,
    uptime NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Monitoring Alerts Table
CREATE TABLE IF NOT EXISTS public.monitoring_alerts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    alert_type TEXT NOT NULL CHECK (alert_type IN ('error_rate', 'response_time', 'downtime', 'security', 'performance')),
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    message TEXT NOT NULL,
    details JSONB DEFAULT '{}',
    triggered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    is_resolved BOOLEAN DEFAULT FALSE
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);

-- Assessment sessions indexes
CREATE INDEX IF NOT EXISTS idx_assessment_sessions_user_id ON public.assessment_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_assessment_sessions_test_type ON public.assessment_sessions(test_type);
CREATE INDEX IF NOT EXISTS idx_assessment_sessions_status ON public.assessment_sessions(status);
CREATE INDEX IF NOT EXISTS idx_assessment_sessions_created_at ON public.assessment_sessions(created_at);

-- Audit logs indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type ON public.audit_logs(resource_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- User consents indexes
CREATE INDEX IF NOT EXISTS idx_user_consents_user_id ON public.user_consents(user_id);
CREATE INDEX IF NOT EXISTS idx_user_consents_consent_type ON public.user_consents(consent_type);
CREATE INDEX IF NOT EXISTS idx_user_consents_granted ON public.user_consents(granted);

-- Share links indexes
CREATE INDEX IF NOT EXISTS idx_share_links_token ON public.share_links(share_token);
CREATE INDEX IF NOT EXISTS idx_share_links_user_id ON public.share_links(user_id);
CREATE INDEX IF NOT EXISTS idx_share_links_expires_at ON public.share_links(expires_at);

-- Longitudinal tracking indexes
CREATE INDEX IF NOT EXISTS idx_longitudinal_tracking_user_id ON public.longitudinal_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_longitudinal_tracking_test_type ON public.longitudinal_tracking(test_type);
CREATE INDEX IF NOT EXISTS idx_longitudinal_alerts_user_id ON public.longitudinal_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_longitudinal_alerts_unacknowledged ON public.longitudinal_alerts(user_id, acknowledged) WHERE acknowledged = false;

-- Analytics indexes
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON public.analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_name ON public.analytics_events(event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON public.analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_metric_name ON public.performance_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_error_logs_error_type ON public.error_logs(error_type);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.share_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.longitudinal_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.longitudinal_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trend_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monitoring_alerts ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Assessment sessions policies
CREATE POLICY "Users can view own assessments" ON public.assessment_sessions
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own assessments" ON public.assessment_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own assessments" ON public.assessment_sessions
    FOR UPDATE USING (auth.uid() = user_id);

-- Audit logs policies
CREATE POLICY "Users can view own audit logs" ON public.audit_logs
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert audit logs" ON public.audit_logs
    FOR INSERT WITH CHECK (true);

-- User consents policies
CREATE POLICY "Users can view own consents" ON public.user_consents
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own consents" ON public.user_consents
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Share links policies
CREATE POLICY "Users can view own share links" ON public.share_links
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own share links" ON public.share_links
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own share links" ON public.share_links
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Public can access active share links" ON public.share_links
    FOR SELECT USING (is_active = TRUE AND expires_at > NOW() AND access_count < max_access_count);

-- Longitudinal tracking policies
CREATE POLICY "Users can view own tracking data" ON public.longitudinal_tracking
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own tracking data" ON public.longitudinal_tracking
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Longitudinal alerts policies
CREATE POLICY "Users can view own alerts" ON public.longitudinal_alerts
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own alerts" ON public.longitudinal_alerts
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own alerts" ON public.longitudinal_alerts
    FOR UPDATE USING (auth.uid() = user_id);

-- Reminders policies
CREATE POLICY "Users can view own reminders" ON public.reminders
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own reminders" ON public.reminders
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reminders" ON public.reminders
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own reminders" ON public.reminders
    FOR DELETE USING (auth.uid() = user_id);

-- Trend analysis policies
CREATE POLICY "Users can view own trend analysis" ON public.trend_analysis
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own trend analysis" ON public.trend_analysis
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Analytics policies (allow anonymous data collection)
CREATE POLICY "Users can view own analytics events" ON public.analytics_events
    FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Anyone can insert analytics events" ON public.analytics_events
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view own performance metrics" ON public.performance_metrics
    FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Anyone can insert performance metrics" ON public.performance_metrics
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view own error logs" ON public.error_logs
    FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Anyone can insert error logs" ON public.error_logs
    FOR INSERT WITH CHECK (true);

-- System monitoring policies (service level)
CREATE POLICY "Service can insert health checks" ON public.health_checks
    FOR INSERT WITH CHECK (true);
CREATE POLICY "Service can insert system metrics" ON public.system_metrics
    FOR INSERT WITH CHECK (true);
CREATE POLICY "Service can insert monitoring alerts" ON public.monitoring_alerts
    FOR INSERT WITH CHECK (true);

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assessment_sessions_updated_at BEFORE UPDATE ON public.assessment_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_consents_updated_at BEFORE UPDATE ON public.user_consents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_longitudinal_alerts_updated_at BEFORE UPDATE ON public.longitudinal_alerts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reminders_updated_at BEFORE UPDATE ON public.reminders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to log profile changes
CREATE OR REPLACE FUNCTION log_profile_changes()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.audit_logs (action, resource_type, resource_id, user_id, metadata)
  VALUES (
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for profile changes
CREATE TRIGGER profile_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION log_profile_changes();

-- Function to log assessment changes
CREATE OR REPLACE FUNCTION log_assessment_changes()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.audit_logs (action, resource_type, resource_id, user_id, metadata)
  VALUES (
    CASE 
      WHEN TG_OP = 'INSERT' THEN 'assessment_created'
      WHEN TG_OP = 'UPDATE' THEN 'assessment_updated'
      WHEN TG_OP = 'DELETE' THEN 'assessment_deleted'
    END,
    'assessment_session',
    COALESCE(NEW.id::text, OLD.id::text),
    COALESCE(NEW.user_id, OLD.user_id),
    jsonb_build_object(
      'operation', TG_OP,
      'test_type', COALESCE(NEW.test_type, OLD.test_type),
      'status', COALESCE(NEW.status, OLD.status),
      'old_status', CASE WHEN TG_OP = 'UPDATE' THEN OLD.status ELSE NULL END,
      'new_status', CASE WHEN TG_OP = 'UPDATE' THEN NEW.status ELSE NULL END
    )
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for assessment changes
CREATE TRIGGER assessment_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.assessment_sessions
  FOR EACH ROW EXECUTE FUNCTION log_assessment_changes();

-- Function to analyze new assessments for longitudinal tracking
CREATE OR REPLACE FUNCTION analyze_new_assessment()
RETURNS TRIGGER AS $$
DECLARE
  previous_assessment RECORD;
  change_percentage DECIMAL;
  days_between INTEGER;
  alert_needed BOOLEAN := FALSE;
  alert_type TEXT;
  alert_severity TEXT;
  alert_title TEXT;
  alert_message TEXT;
  alert_recommendations TEXT[];
BEGIN
  -- Only analyze completed assessments with results
  IF NEW.status != 'completed' OR NEW.result IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get the most recent previous assessment of the same type
  SELECT * INTO previous_assessment
  FROM public.assessment_sessions
  WHERE user_id = NEW.user_id 
    AND test_type = NEW.test_type 
    AND id != NEW.id
    AND status = 'completed'
    AND result IS NOT NULL
  ORDER BY completed_at DESC
  LIMIT 1;

  -- If no previous assessment, no analysis needed
  IF previous_assessment IS NULL THEN
    RETURN NEW;
  END IF;

  -- Calculate change percentage
  IF (previous_assessment.result->>'adjustedScore')::DECIMAL > 0 THEN
    change_percentage := (
      (NEW.result->>'adjustedScore')::DECIMAL - 
      (previous_assessment.result->>'adjustedScore')::DECIMAL
    ) / (previous_assessment.result->>'adjustedScore')::DECIMAL;
  ELSE
    change_percentage := 0;
  END IF;

  -- Calculate days between assessments
  days_between := EXTRACT(DAY FROM (NEW.completed_at - previous_assessment.completed_at));

  -- Check for significant changes (>10% threshold)
  IF ABS(change_percentage) >= 0.10 THEN
    alert_needed := TRUE;
    
    -- Determine alert type and severity
    IF change_percentage <= -0.15 AND days_between <= 30 THEN
      -- Rapid decline
      alert_type := 'rapid_decline';
      alert_severity := 'critical';
      alert_title := 'Declive Rápido Detectado';
      alert_message := format('Se ha detectado un declive significativo del %.1f%% en tu evaluación %s en solo %s días.',
        ABS(change_percentage * 100), UPPER(NEW.test_type), days_between);
      alert_recommendations := ARRAY[
        'Consulta con un profesional de la salud inmediatamente',
        'Revisa factores que puedan estar afectando tu rendimiento',
        'Considera realizar una evaluación médica completa'
      ];
    ELSIF change_percentage < -0.10 THEN
      -- Significant decline
      alert_type := 'significant_decline';
      alert_severity := CASE WHEN ABS(change_percentage) > 0.20 THEN 'high' ELSE 'medium' END;
      alert_title := 'Cambio Significativo Detectado';
      alert_message := format('Tu puntuación en %s ha disminuido un %.1f%% desde tu última evaluación.',
        UPPER(NEW.test_type), ABS(change_percentage * 100));
      alert_recommendations := ARRAY[
        'Considera consultar con un profesional de la salud',
        'Revisa tu rutina de sueño, ejercicio y alimentación',
        'Realiza otra evaluación en 1-2 semanas para confirmar la tendencia'
      ];
    ELSE
      -- Improvement
      alert_type := 'improvement';
      alert_severity := 'low';
      alert_title := 'Mejora Detectada';
      alert_message := format('¡Excelente! Tu puntuación en %s ha mejorado un %.1f%%.',
        UPPER(NEW.test_type), change_percentage * 100);
      alert_recommendations := ARRAY[
        'Continúa con tus hábitos saludables actuales',
        'Mantén tu rutina de ejercicio y alimentación',
        'Sigue realizando evaluaciones regulares'
      ];
    END IF;

    -- Insert the alert
    INSERT INTO public.longitudinal_alerts (
      user_id, test_type, alert_type, severity, title, message, recommendations,
      metadata
    ) VALUES (
      NEW.user_id, NEW.test_type, alert_type, alert_severity, alert_title, alert_message, alert_recommendations,
      jsonb_build_object(
        'changePercentage', change_percentage,
        'previousScore', (previous_assessment.result->>'adjustedScore')::DECIMAL,
        'currentScore', (NEW.result->>'adjustedScore')::DECIMAL,
        'timeframe', days_between || ' días'
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically analyze new assessments
CREATE TRIGGER analyze_assessment_changes
  AFTER INSERT OR UPDATE ON public.assessment_sessions
  FOR EACH ROW
  WHEN (NEW.status = 'completed' AND NEW.result IS NOT NULL)
  EXECUTE FUNCTION analyze_new_assessment();

-- =====================================================
-- UTILITY FUNCTIONS
-- =====================================================

-- Function to get usage metrics
CREATE OR REPLACE FUNCTION get_usage_metrics(start_date TIMESTAMP WITH TIME ZONE, end_date TIMESTAMP WITH TIME ZONE)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'daily_active_users', (
            SELECT COUNT(DISTINCT user_id)
            FROM public.analytics_events
            WHERE created_at >= start_date AND created_at <= end_date
            AND event_name = 'session_start'
            AND created_at >= CURRENT_DATE
        ),
        'total_assessments', (
            SELECT COUNT(*)
            FROM public.assessment_sessions
            WHERE created_at >= start_date AND created_at <= end_date
            AND status = 'completed'
        ),
        'assessments_by_type', (
            SELECT json_object_agg(
                test_type,
                count
            )
            FROM (
                SELECT 
                    test_type,
                    COUNT(*) as count
                FROM public.assessment_sessions
                WHERE created_at >= start_date AND created_at <= end_date
                AND status = 'completed'
                GROUP BY test_type
            ) t
        )
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up expired share links
CREATE OR REPLACE FUNCTION cleanup_expired_share_links()
RETURNS void AS $$
BEGIN
  UPDATE public.share_links 
  SET is_active = FALSE 
  WHERE expires_at < NOW() AND is_active = TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old analytics data (retention policy)
CREATE OR REPLACE FUNCTION cleanup_old_analytics_data()
RETURNS VOID AS $$
BEGIN
    -- Delete analytics events older than 1 year
    DELETE FROM public.analytics_events 
    WHERE created_at < NOW() - INTERVAL '1 year';
    
    -- Delete performance metrics older than 6 months
    DELETE FROM public.performance_metrics 
    WHERE created_at < NOW() - INTERVAL '6 months';
    
    -- Delete error logs older than 3 months
    DELETE FROM public.error_logs 
    WHERE created_at < NOW() - INTERVAL '3 months';
    
    -- Delete health checks older than 1 month
    DELETE FROM public.health_checks 
    WHERE created_at < NOW() - INTERVAL '1 month';
    
    -- Delete system metrics older than 1 month
    DELETE FROM public.system_metrics 
    WHERE created_at < NOW() - INTERVAL '1 month';
    
    -- Delete resolved alerts older than 3 months
    DELETE FROM public.monitoring_alerts 
    WHERE is_resolved = true 
    AND resolved_at < NOW() - INTERVAL '3 months';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- VIEWS FOR REPORTING
-- =====================================================

-- View for current user consents (latest consent for each type)
CREATE OR REPLACE VIEW current_user_consents AS
SELECT DISTINCT ON (user_id, consent_type)
  user_id,
  consent_type,
  granted,
  granted_at,
  withdrawn_at,
  version,
  created_at
FROM public.user_consents
ORDER BY user_id, consent_type, created_at DESC;

-- View for GDPR compliance reporting
CREATE OR REPLACE VIEW gdpr_compliance_report AS
SELECT 
  p.id as user_id,
  p.email,
  p.created_at as user_created_at,
  p.deleted_at,
  p.status,
  COUNT(DISTINCT uc.consent_type) as consent_types_count,
  COUNT(DISTINCT CASE WHEN uc.granted = true THEN uc.consent_type END) as active_consents,
  COUNT(DISTINCT ass.id) as total_assessments,
  COUNT(DISTINCT CASE WHEN ass.anonymized_at IS NOT NULL THEN ass.id END) as anonymized_assessments,
  MAX(uc.created_at) as last_consent_update
FROM public.profiles p
LEFT JOIN public.user_consents uc ON p.id = uc.user_id
LEFT JOIN public.assessment_sessions ass ON p.id = ass.user_id
GROUP BY p.id, p.email, p.created_at, p.deleted_at, p.status
ORDER BY p.created_at DESC;

-- View for audit log analysis
CREATE OR REPLACE VIEW audit_summary AS
SELECT 
  user_id,
  action,
  resource_type,
  COUNT(*) as event_count,
  MIN(created_at) as first_event,
  MAX(created_at) as last_event,
  DATE_TRUNC('day', created_at) as event_date
FROM public.audit_logs
GROUP BY user_id, action, resource_type, DATE_TRUNC('day', created_at)
ORDER BY event_date DESC, event_count DESC;

-- =====================================================
-- GRANTS AND PERMISSIONS
-- =====================================================

-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Grant read access to views
GRANT SELECT ON current_user_consents TO authenticated;
GRANT SELECT ON gdpr_compliance_report TO authenticated;
GRANT SELECT ON audit_summary TO authenticated;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

DO $$ 
BEGIN 
    RAISE NOTICE '✅ NeuralHack Cognitive AI Database Setup Complete!';
    RAISE NOTICE '📊 Tables created: profiles, assessment_sessions, audit_logs, user_consents, share_links, longitudinal_tracking, longitudinal_alerts, reminders, trend_analysis, analytics_events, performance_metrics, error_logs, health_checks, system_metrics, monitoring_alerts';
    RAISE NOTICE '🔒 Row Level Security enabled on all tables';
    RAISE NOTICE '📈 Indexes created for optimal performance';
    RAISE NOTICE '🔄 Triggers configured for audit logging and longitudinal analysis';
    RAISE NOTICE '📋 Views created for reporting and compliance';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Your database is ready for the NeuralHack Cognitive AI application!';
    RAISE NOTICE '';
    RAISE NOTICE '📝 Next steps:';
    RAISE NOTICE '1. Update your .env file with VITE_DEV_MODE=false';
    RAISE NOTICE '2. Add your Supabase URL and API key to the environment variables';
    RAISE NOTICE '3. Test the connection by running the application';
END $$;