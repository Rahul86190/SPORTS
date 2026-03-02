-- =====================================================
-- Phase 1: Job Details Cache
-- =====================================================
CREATE TABLE IF NOT EXISTS job_details_cache (
  job_id UUID PRIMARY KEY,
  description TEXT,
  requirements JSONB DEFAULT '[]',
  responsibilities JSONB DEFAULT '[]',
  eligibility TEXT,
  tech_stack JSONB DEFAULT '[]',
  about_company TEXT,
  application_deadline TEXT,
  data_source TEXT DEFAULT 'ai_generated',
  generated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- Phase 2: Prep Sessions (Interview Lab)
-- =====================================================
CREATE TABLE IF NOT EXISTS prep_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  job_id UUID,
  job_title TEXT,
  company_name TEXT,
  questions JSONB,
  answers JSONB,
  score INT,
  max_score INT DEFAULT 100,
  grade TEXT,
  feedback JSONB,
  difficulty TEXT DEFAULT 'medium',
  time_taken INT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- =====================================================
-- Phase 3: Tailored Resumes
-- =====================================================
CREATE TABLE IF NOT EXISTS tailored_resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  job_id UUID,
  job_title TEXT,
  resume_data JSONB,
  ats_score INT,
  template TEXT DEFAULT 'professional',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS (Row Level Security)
ALTER TABLE job_details_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE prep_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tailored_resumes ENABLE ROW LEVEL SECURITY;

-- Policies for public read/write (adjust for production)
CREATE POLICY "Allow all on job_details_cache" ON job_details_cache FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on prep_sessions" ON prep_sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on tailored_resumes" ON tailored_resumes FOR ALL USING (true) WITH CHECK (true);
