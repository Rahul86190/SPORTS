-- Add roadmap_data column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS roadmap_data JSONB;

-- Comment on column
COMMENT ON COLUMN profiles.roadmap_data IS 'Stores the AI-generated phased roadmap for the user';
