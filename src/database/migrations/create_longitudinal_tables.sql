-- Create longitudinal_alerts table for tracking significant changes
CREATE TABLE IF NOT EXISTS longitudinal_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
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

-- Create reminder_settings table for managing assessment reminders
CREATE TABLE IF NOT EXISTS reminder_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  test_type TEXT NOT NULL,
  enabled BOOLEAN DEFAULT TRUE,
  frequency TEXT NOT NULL CHECK (frequency IN ('weekly', 'biweekly', 'monthly', 'quarterly')),
  next_reminder TIMESTAMP WITH TIME ZONE NOT NULL,
  last_reminder TIMESTAMP WITH TIME ZONE,
  custom_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one setting per user per test type
  UNIQUE(user_id, test_type)
);

-- Create trend_analysis table for storing calculated trends
CREATE TABLE IF NOT EXISTS trend_analysis (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_longitudinal_alerts_user_id ON longitudinal_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_longitudinal_alerts_triggered ON longitudinal_alerts(triggered DESC);
CREATE INDEX IF NOT EXISTS idx_longitudinal_alerts_unacknowledged ON longitudinal_alerts(user_id, acknowledged) WHERE acknowledged = false;
CREATE INDEX IF NOT EXISTS idx_longitudinal_alerts_severity ON longitudinal_alerts(user_id, severity);

CREATE INDEX IF NOT EXISTS idx_reminder_settings_user_id ON reminder_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_reminder_settings_next_reminder ON reminder_settings(next_reminder) WHERE enabled = true;

CREATE INDEX IF NOT EXISTS idx_trend_analysis_user_id ON trend_analysis(user_id);
CREATE INDEX IF NOT EXISTS idx_trend_analysis_test_type ON trend_analysis(user_id, test_type);
CREATE INDEX IF NOT EXISTS idx_trend_analysis_timeframe ON trend_analysis(user_id, timeframe);

-- Enable Row Level Security
ALTER TABLE longitudinal_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminder_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE trend_analysis ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for longitudinal_alerts
CREATE POLICY "Users can view own longitudinal alerts" ON longitudinal_alerts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own longitudinal alerts" ON longitudinal_alerts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own longitudinal alerts" ON longitudinal_alerts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own longitudinal alerts" ON longitudinal_alerts
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for reminder_settings
CREATE POLICY "Users can view own reminder settings" ON reminder_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reminder settings" ON reminder_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reminder settings" ON reminder_settings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reminder settings" ON reminder_settings
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for trend_analysis
CREATE POLICY "Users can view own trend analysis" ON trend_analysis
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own trend analysis" ON trend_analysis
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create functions to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_longitudinal_alerts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_reminder_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_longitudinal_alerts_updated_at
  BEFORE UPDATE ON longitudinal_alerts
  FOR EACH ROW
  EXECUTE FUNCTION update_longitudinal_alerts_updated_at();

CREATE TRIGGER update_reminder_settings_updated_at
  BEFORE UPDATE ON reminder_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_reminder_settings_updated_at();

-- Create function to automatically analyze new assessments
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
  -- Get the most recent previous assessment of the same type
  SELECT * INTO previous_assessment
  FROM assessment_sessions
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
    INSERT INTO longitudinal_alerts (
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
  AFTER INSERT OR UPDATE ON assessment_sessions
  FOR EACH ROW
  WHEN (NEW.status = 'completed' AND NEW.result IS NOT NULL)
  EXECUTE FUNCTION analyze_new_assessment();