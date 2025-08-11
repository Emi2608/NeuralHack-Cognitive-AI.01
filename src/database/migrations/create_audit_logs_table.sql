-- Create audit_logs table for immutable audit trail
-- This table stores all user actions and system events for compliance

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type ON audit_logs(resource_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_id ON audit_logs(resource_id);

-- Create composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_action ON audit_logs(user_id, action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_created_at ON audit_logs(user_id, created_at DESC);

-- Enable Row Level Security
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only view their own audit logs
CREATE POLICY "Users can view own audit logs" ON audit_logs
  FOR SELECT USING (
    auth.uid() = user_id OR 
    auth.jwt() ->> 'role' = 'admin'
  );

-- Only the system can insert audit logs (no user updates/deletes for immutability)
CREATE POLICY "System can insert audit logs" ON audit_logs
  FOR INSERT WITH CHECK (true);

-- Prevent updates and deletes to maintain audit trail integrity
CREATE POLICY "No updates allowed" ON audit_logs
  FOR UPDATE USING (false);

CREATE POLICY "No deletes allowed" ON audit_logs
  FOR DELETE USING (false);

-- Create function to automatically log certain events
CREATE OR REPLACE FUNCTION log_profile_changes()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (action, resource_type, resource_id, user_id, metadata)
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
DROP TRIGGER IF EXISTS profile_audit_trigger ON profiles;
CREATE TRIGGER profile_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON profiles
  FOR EACH ROW EXECUTE FUNCTION log_profile_changes();

-- Create function to log assessment events
CREATE OR REPLACE FUNCTION log_assessment_changes()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (action, resource_type, resource_id, user_id, metadata)
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
DROP TRIGGER IF EXISTS assessment_audit_trigger ON assessment_sessions;
CREATE TRIGGER assessment_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON assessment_sessions
  FOR EACH ROW EXECUTE FUNCTION log_assessment_changes();

-- Create view for audit log analysis
CREATE OR REPLACE VIEW audit_summary AS
SELECT 
  user_id,
  action,
  resource_type,
  COUNT(*) as event_count,
  MIN(created_at) as first_event,
  MAX(created_at) as last_event,
  DATE_TRUNC('day', created_at) as event_date
FROM audit_logs
GROUP BY user_id, action, resource_type, DATE_TRUNC('day', created_at)
ORDER BY event_date DESC, event_count DESC;

-- Grant necessary permissions
GRANT SELECT ON audit_logs TO authenticated;
GRANT SELECT ON audit_summary TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE audit_logs IS 'Immutable audit trail for all user actions and system events';
COMMENT ON COLUMN audit_logs.action IS 'Type of action performed (e.g., login, assessment_start, data_export)';
COMMENT ON COLUMN audit_logs.resource_type IS 'Type of resource affected (e.g., user, assessment, data)';
COMMENT ON COLUMN audit_logs.resource_id IS 'ID of the specific resource affected';
COMMENT ON COLUMN audit_logs.user_id IS 'ID of the user who performed the action';
COMMENT ON COLUMN audit_logs.metadata IS 'Additional context and details about the action';
COMMENT ON COLUMN audit_logs.ip_address IS 'IP address from which the action was performed';
COMMENT ON COLUMN audit_logs.user_agent IS 'User agent string of the client';
COMMENT ON COLUMN audit_logs.created_at IS 'Timestamp when the action occurred (immutable)';