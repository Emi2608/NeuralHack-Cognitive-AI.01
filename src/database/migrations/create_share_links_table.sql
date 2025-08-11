-- Create share_links table for secure data sharing
CREATE TABLE IF NOT EXISTS share_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  token VARCHAR(64) UNIQUE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  encrypted_data TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  max_access INTEGER DEFAULT 1,
  access_count INTEGER DEFAULT 0,
  password_hash VARCHAR(64),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_accessed_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_share_links_token ON share_links(token);
CREATE INDEX IF NOT EXISTS idx_share_links_user_id ON share_links(user_id);
CREATE INDEX IF NOT EXISTS idx_share_links_expires_at ON share_links(expires_at);
CREATE INDEX IF NOT EXISTS idx_share_links_is_active ON share_links(is_active);

-- Enable Row Level Security
ALTER TABLE share_links ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own share links" ON share_links
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own share links" ON share_links
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own share links" ON share_links
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own share links" ON share_links
  FOR DELETE USING (auth.uid() = user_id);

-- Create policy for public access to shared data (for the sharing functionality)
CREATE POLICY "Public can access active share links" ON share_links
  FOR SELECT USING (
    is_active = TRUE 
    AND expires_at > NOW()
    AND access_count < max_access
  );

-- Create function to automatically clean up expired links
CREATE OR REPLACE FUNCTION cleanup_expired_share_links()
RETURNS void AS $$
BEGIN
  UPDATE share_links 
  SET is_active = FALSE 
  WHERE expires_at < NOW() AND is_active = TRUE;
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to run cleanup (if pg_cron is available)
-- This would typically be set up by the database administrator
-- SELECT cron.schedule('cleanup-expired-share-links', '0 * * * *', 'SELECT cleanup_expired_share_links();');

-- Add comments for documentation
COMMENT ON TABLE share_links IS 'Secure shareable links for assessment data';
COMMENT ON COLUMN share_links.token IS 'Unique secure token for accessing shared data';
COMMENT ON COLUMN share_links.encrypted_data IS 'AES encrypted shareable data payload';
COMMENT ON COLUMN share_links.expires_at IS 'Expiration timestamp for the share link';
COMMENT ON COLUMN share_links.max_access IS 'Maximum number of times the link can be accessed';
COMMENT ON COLUMN share_links.access_count IS 'Current number of times the link has been accessed';
COMMENT ON COLUMN share_links.password_hash IS 'SHA256 hash of optional password protection';
COMMENT ON COLUMN share_links.is_active IS 'Whether the share link is currently active';
COMMENT ON COLUMN share_links.last_accessed_at IS 'Timestamp of last access to the share link';
COMMENT ON COLUMN share_links.metadata IS 'Additional metadata for the share link';