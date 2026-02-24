-- Migration: Create user bookmarks table
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS user_bookmarks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    opportunity_data JSONB NOT NULL,
    source TEXT,
    bookmarked_at TIMESTAMPTZ DEFAULT now(),
    status TEXT DEFAULT 'saved',
    notes TEXT
);

-- RLS: Users can only manage their own bookmarks
ALTER TABLE user_bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bookmarks" ON user_bookmarks
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bookmarks" ON user_bookmarks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bookmarks" ON user_bookmarks
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own bookmarks" ON user_bookmarks
    FOR DELETE USING (auth.uid() = user_id);
