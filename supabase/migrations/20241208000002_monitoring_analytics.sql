-- Analytics and Monitoring Tables

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

-- Enable Row Level Security
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monitoring_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Analytics Events
CREATE POLICY "Users can view own analytics events" ON public.analytics_events
    FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Anyone can insert analytics events" ON public.analytics_events
    FOR INSERT WITH CHECK (true);

-- RLS Policies for Performance Metrics
CREATE POLICY "Users can view own performance metrics" ON public.performance_metrics
    FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Anyone can insert performance metrics" ON public.performance_metrics
    FOR INSERT WITH CHECK (true);

-- RLS Policies for Error Logs
CREATE POLICY "Users can view own error logs" ON public.error_logs
    FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Anyone can insert error logs" ON public.error_logs
    FOR INSERT WITH CHECK (true);

-- RLS Policies for Health Checks (admin only for viewing)
CREATE POLICY "Service can insert health checks" ON public.health_checks
    FOR INSERT WITH CHECK (true);

-- RLS Policies for System Metrics (admin only for viewing)
CREATE POLICY "Service can insert system metrics" ON public.system_metrics
    FOR INSERT WITH CHECK (true);

-- RLS Policies for Monitoring Alerts (admin only for viewing)
CREATE POLICY "Service can insert monitoring alerts" ON public.monitoring_alerts
    FOR INSERT WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON public.analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_name ON public.analytics_events(event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON public.analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session_id ON public.analytics_events(session_id);

CREATE INDEX IF NOT EXISTS idx_performance_metrics_metric_name ON public.performance_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_created_at ON public.performance_metrics(created_at);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_user_id ON public.performance_metrics(user_id);

CREATE INDEX IF NOT EXISTS idx_error_logs_error_type ON public.error_logs(error_type);
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON public.error_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_error_logs_user_id ON public.error_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_health_checks_service ON public.health_checks(service);
CREATE INDEX IF NOT EXISTS idx_health_checks_status ON public.health_checks(status);
CREATE INDEX IF NOT EXISTS idx_health_checks_created_at ON public.health_checks(created_at);

CREATE INDEX IF NOT EXISTS idx_system_metrics_created_at ON public.system_metrics(created_at);

CREATE INDEX IF NOT EXISTS idx_monitoring_alerts_alert_type ON public.monitoring_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_monitoring_alerts_severity ON public.monitoring_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_monitoring_alerts_is_resolved ON public.monitoring_alerts(is_resolved);
CREATE INDEX IF NOT EXISTS idx_monitoring_alerts_triggered_at ON public.monitoring_alerts(triggered_at);

-- Create functions for analytics and monitoring

-- Function to get usage metrics
CREATE OR REPLACE FUNCTION get_usage_metrics(start_date TIMESTAMP WITH TIME ZONE, end_date TIMESTAMP WITH TIME ZONE)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'daily_active_users', (
            SELECT COUNT(DISTINCT user_id)
            FROM analytics_events
            WHERE created_at >= start_date AND created_at <= end_date
            AND event_name = 'session_start'
            AND created_at >= CURRENT_DATE
        ),
        'weekly_active_users', (
            SELECT COUNT(DISTINCT user_id)
            FROM analytics_events
            WHERE created_at >= start_date AND created_at <= end_date
            AND event_name = 'session_start'
            AND created_at >= CURRENT_DATE - INTERVAL '7 days'
        ),
        'monthly_active_users', (
            SELECT COUNT(DISTINCT user_id)
            FROM analytics_events
            WHERE created_at >= start_date AND created_at <= end_date
            AND event_name = 'session_start'
            AND created_at >= CURRENT_DATE - INTERVAL '30 days'
        ),
        'total_assessments', (
            SELECT COUNT(*)
            FROM analytics_events
            WHERE created_at >= start_date AND created_at <= end_date
            AND event_name = 'assessment_completed'
        ),
        'assessments_by_type', (
            SELECT json_object_agg(
                event_data->>'test_type',
                count
            )
            FROM (
                SELECT 
                    event_data->>'test_type' as test_type,
                    COUNT(*) as count
                FROM analytics_events
                WHERE created_at >= start_date AND created_at <= end_date
                AND event_name = 'assessment_completed'
                AND event_data->>'test_type' IS NOT NULL
                GROUP BY event_data->>'test_type'
            ) t
        ),
        'average_session_duration', (
            SELECT AVG((event_data->>'session_duration')::NUMERIC)
            FROM analytics_events
            WHERE created_at >= start_date AND created_at <= end_date
            AND event_name = 'session_end'
            AND event_data->>'session_duration' IS NOT NULL
        ),
        'bounce_rate', (
            SELECT 
                CASE 
                    WHEN total_sessions > 0 
                    THEN single_page_sessions::FLOAT / total_sessions::FLOAT 
                    ELSE 0 
                END
            FROM (
                SELECT 
                    COUNT(DISTINCT session_id) as total_sessions,
                    COUNT(DISTINCT CASE 
                        WHEN session_page_count = 1 THEN session_id 
                    END) as single_page_sessions
                FROM (
                    SELECT 
                        session_id,
                        COUNT(DISTINCT page_url) as session_page_count
                    FROM analytics_events
                    WHERE created_at >= start_date AND created_at <= end_date
                    AND event_name = 'page_view'
                    AND session_id IS NOT NULL
                    GROUP BY session_id
                ) session_stats
            ) bounce_stats
        ),
        'completion_rates', (
            SELECT json_object_agg(
                test_type,
                completion_rate
            )
            FROM (
                SELECT 
                    started.test_type,
                    CASE 
                        WHEN started.count > 0 
                        THEN completed.count::FLOAT / started.count::FLOAT 
                        ELSE 0 
                    END as completion_rate
                FROM (
                    SELECT 
                        event_data->>'test_type' as test_type,
                        COUNT(*) as count
                    FROM analytics_events
                    WHERE created_at >= start_date AND created_at <= end_date
                    AND event_name = 'assessment_started'
                    AND event_data->>'test_type' IS NOT NULL
                    GROUP BY event_data->>'test_type'
                ) started
                LEFT JOIN (
                    SELECT 
                        event_data->>'test_type' as test_type,
                        COUNT(*) as count
                    FROM analytics_events
                    WHERE created_at >= start_date AND created_at <= end_date
                    AND event_name = 'assessment_completed'
                    AND event_data->>'test_type' IS NOT NULL
                    GROUP BY event_data->>'test_type'
                ) completed ON started.test_type = completed.test_type
            ) completion_stats
        )
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get database stats
CREATE OR REPLACE FUNCTION get_db_stats()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_users', (SELECT COUNT(*) FROM profiles),
        'total_assessments', (SELECT COUNT(*) FROM assessment_sessions),
        'total_errors_today', (
            SELECT COUNT(*) 
            FROM error_logs 
            WHERE created_at >= CURRENT_DATE
        ),
        'database_size', (
            SELECT pg_size_pretty(pg_database_size(current_database()))
        ),
        'active_connections', (
            SELECT count(*) 
            FROM pg_stat_activity 
            WHERE state = 'active'
        )
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up old analytics data (retention policy)
CREATE OR REPLACE FUNCTION cleanup_old_analytics_data()
RETURNS VOID AS $$
BEGIN
    -- Delete analytics events older than 1 year
    DELETE FROM analytics_events 
    WHERE created_at < NOW() - INTERVAL '1 year';
    
    -- Delete performance metrics older than 6 months
    DELETE FROM performance_metrics 
    WHERE created_at < NOW() - INTERVAL '6 months';
    
    -- Delete error logs older than 3 months
    DELETE FROM error_logs 
    WHERE created_at < NOW() - INTERVAL '3 months';
    
    -- Delete health checks older than 1 month
    DELETE FROM health_checks 
    WHERE created_at < NOW() - INTERVAL '1 month';
    
    -- Delete system metrics older than 1 month
    DELETE FROM system_metrics 
    WHERE created_at < NOW() - INTERVAL '1 month';
    
    -- Delete resolved alerts older than 3 months
    DELETE FROM monitoring_alerts 
    WHERE is_resolved = true 
    AND resolved_at < NOW() - INTERVAL '3 months';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a scheduled job to run cleanup (requires pg_cron extension)
-- SELECT cron.schedule('cleanup-analytics', '0 2 * * 0', 'SELECT cleanup_old_analytics_data();');