-- Migration: Create opportunity cache table
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS opportunity_cache (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cache_key TEXT UNIQUE NOT NULL,
    results JSONB NOT NULL,
    source_breakdown JSONB,
    created_at TIMESTAMPTZ DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL
);

-- Index for fast expiry lookups
CREATE INDEX IF NOT EXISTS idx_opportunity_cache_expires ON opportunity_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_opportunity_cache_key ON opportunity_cache(cache_key);
