-- Create user_consents table for GDPR compliance
-- This table tracks all consent given/withdrawn by users

CREATE TABLE IF NOT EXISTS user_consents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
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

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_user_consents_user_id ON user_consents(user_id);
CREATE INDEX IF NOT EXISTS idx_user_consents_consent_type ON user_consents(consent_type);
CREATE INDEX IF NOT EXISTS idx_user_consents_granted ON user_consents(granted);
CREATE INDEX IF NOT EXISTS idx_user_consents_created_at ON user_consents(created_at DESC);

-- Create composite index for consent lookups
CREATE INDEX IF NOT EXISTS idx_user_consents_user_type ON user_consents(user_id, consent_type, created_at DESC);

-- Enable Row Level Security
ALTER TABLE user_consents ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only view their own consent records
CREATE POLICY "Users can view own consents" ON user_consents
  FOR SELECT USING (
    auth.uid() = user_id OR 
    auth.jwt() ->> 'role' = 'admin'
  );

-- Users can insert their own consent records
CREATE POLICY "Users can insert own consents" ON user_consents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- No updates allowed - consent history is immutable
CREATE POLICY "No updates allowed" ON user_consents
  FOR UPDATE USING (false);

-- No deletes allowed - consent history must be preserved
CREATE POLICY "No deletes allowed" ON user_consents
  FOR DELETE USING (false);

-- Add columns to profiles table for GDPR compliance
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'deleted', 'suspended'));

-- Add columns to assessment_sessions for anonymization
ALTER TABLE assessment_sessions ADD COLUMN IF NOT EXISTS anonymized_at TIMESTAMP WITH TIME ZONE;

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for user_consents
DROP TRIGGER IF EXISTS update_user_consents_updated_at ON user_consents;
CREATE TRIGGER update_user_consents_updated_at
  BEFORE UPDATE ON user_consents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to log consent changes
CREATE OR REPLACE FUNCTION log_consent_changes()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (action, resource_type, resource_id, user_id, metadata)
  VALUES (
    CASE 
      WHEN NEW.granted = true THEN 'consent_granted'
      ELSE 'consent_withdrawn'
    END,
    'user_consent',
    NEW.id::text,
    NEW.user_id,
    jsonb_build_object(
      'consent_type', NEW.consent_type,
      'granted', NEW.granted,
      'version', NEW.version,
      'ip_address', NEW.ip_address,
      'user_agent', NEW.user_agent
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for consent logging
DROP TRIGGER IF EXISTS consent_audit_trigger ON user_consents;
CREATE TRIGGER consent_audit_trigger
  AFTER INSERT ON user_consents
  FOR EACH ROW EXECUTE FUNCTION log_consent_changes();

-- Create view for current user consents (latest consent for each type)
CREATE OR REPLACE VIEW current_user_consents AS
SELECT DISTINCT ON (user_id, consent_type)
  user_id,
  consent_type,
  granted,
  granted_at,
  withdrawn_at,
  version,
  created_at
FROM user_consents
ORDER BY user_id, consent_type, created_at DESC;

-- Create view for GDPR compliance reporting
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
FROM profiles p
LEFT JOIN user_consents uc ON p.id = uc.user_id
LEFT JOIN assessment_sessions ass ON p.id = ass.user_id
GROUP BY p.id, p.email, p.created_at, p.deleted_at, p.status
ORDER BY p.created_at DESC;

-- Grant necessary permissions
GRANT SELECT ON user_consents TO authenticated;
GRANT INSERT ON user_consents TO authenticated;
GRANT SELECT ON current_user_consents TO authenticated;
GRANT SELECT ON gdpr_compliance_report TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE user_consents IS 'Tracks user consent for various data processing activities (GDPR compliance)';
COMMENT ON COLUMN user_consents.consent_type IS 'Type of consent: data_processing, analytics, marketing, research';
COMMENT ON COLUMN user_consents.granted IS 'Whether consent was granted (true) or withdrawn (false)';
COMMENT ON COLUMN user_consents.granted_at IS 'Timestamp when consent was granted';
COMMENT ON COLUMN user_consents.withdrawn_at IS 'Timestamp when consent was withdrawn';
COMMENT ON COLUMN user_consents.version IS 'Version of the consent form/terms';
COMMENT ON COLUMN user_consents.ip_address IS 'IP address from which consent was given/withdrawn';
COMMENT ON COLUMN user_consents.user_agent IS 'User agent string of the client';

COMMENT ON VIEW current_user_consents IS 'Shows the current (latest) consent status for each user and consent type';
COMMENT ON VIEW gdpr_compliance_report IS 'Provides overview of GDPR compliance status for all users';