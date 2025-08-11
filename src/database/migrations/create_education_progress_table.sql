-- Create education_progress table for tracking user reading progress
CREATE TABLE IF NOT EXISTS education_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  article_id TEXT NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  time_spent INTEGER DEFAULT 0, -- in seconds
  completed BOOLEAN DEFAULT FALSE,
  bookmarked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one record per user per article
  UNIQUE(user_id, article_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_education_progress_user_id ON education_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_education_progress_article_id ON education_progress(article_id);
CREATE INDEX IF NOT EXISTS idx_education_progress_bookmarked ON education_progress(user_id, bookmarked) WHERE bookmarked = true;
CREATE INDEX IF NOT EXISTS idx_education_progress_completed ON education_progress(user_id, completed) WHERE completed = true;

-- Enable Row Level Security
ALTER TABLE education_progress ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own education progress" ON education_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own education progress" ON education_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own education progress" ON education_progress
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own education progress" ON education_progress
  FOR DELETE USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_education_progress_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_education_progress_updated_at
  BEFORE UPDATE ON education_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_education_progress_updated_at();