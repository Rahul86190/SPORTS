-- Create resources table
CREATE TABLE IF NOT EXISTS resources (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    type TEXT NOT NULL, -- 'video', 'article', 'course', etc.
    phase_id TEXT,      -- Optional link to a roadmap phase (e.g., 'phase-0-node-1')
    image_url TEXT,     -- Optional thumbnail
    tags TEXT[],        -- Array of tags
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see their own resources
CREATE POLICY "Users can view their own resources" ON resources
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own resources
CREATE POLICY "Users can insert their own resources" ON resources
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own resources
CREATE POLICY "Users can delete their own resources" ON resources
    FOR DELETE USING (auth.uid() = user_id);
