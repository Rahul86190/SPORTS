-- Migration: Create skill expansions cache table (for AI-powered skill matching)
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS skill_expansions (
    skill TEXT PRIMARY KEY,
    related_skills TEXT[] NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);
