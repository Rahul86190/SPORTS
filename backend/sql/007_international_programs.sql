-- Migration: Create international programs table
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS international_programs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    country TEXT NOT NULL,
    organization TEXT,
    program_type TEXT NOT NULL,
    description TEXT,
    eligibility JSONB,
    fields TEXT[],
    is_fully_funded BOOLEAN DEFAULT false,
    is_open_to_all_colleges BOOLEAN DEFAULT true,
    application_url TEXT,
    deadline_month INT,
    deadline_text TEXT,
    duration TEXT,
    stipend TEXT,
    tags TEXT[],
    is_active BOOLEAN DEFAULT true,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: Anyone can view programs (they are public data)
ALTER TABLE international_programs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view programs" ON international_programs FOR SELECT USING (true);
