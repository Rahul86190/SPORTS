-- Create a table for public profiles
create table profiles (
  id uuid references auth.users on delete cascade not null primary key,
  updated_at timestamp with time zone,
  full_name text,
  avatar_url text,
  website text,
  skills jsonb,
  resume_data jsonb,
  onboarding_completed boolean default false,

  constraint username_length check (char_length(full_name) >= 3)
);

-- Set up Row Level Security (RLS)
-- See https://supabase.com/docs/guides/auth/row-level-security for more details.
alter table profiles enable row level security;

create policy "Public profiles are viewable by everyone." on profiles
  for select using (true);

create policy "Users can insert their own profile." on profiles
  for insert with check ((select auth.uid()) = id);

create policy "Users can update own profile." on profiles
  for update using ((select auth.uid()) = id);

-- This trigger automatically creates a profile entry when a new user signs up via Supabase Auth.
-- Use this if you want to ensure every user has a profile.
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;


-- Phase 2: Data Aggregation Tables

-- Jobs Table
create table jobs (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  company text not null,
  location text,
  type text, -- Remote, Hybrid, On-site
  salary_range text,
  url text unique not null,
  source text, -- e.g., "Y Combinator"
  posted_at date,
  created_at timestamp with time zone default now()
);

-- Hackathons Table
create table hackathons (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  organizer text,
  dates text,
  location text, -- Online vs Physical
  prizes text,
  url text unique not null,
  source text, -- e.g., "Devpost"
  tags text[],
  created_at timestamp with time zone default now()
);

-- RLS for Public Read Access (so users can see them)
alter table jobs enable row level security;
alter table hackathons enable row level security;

create policy "Public can view jobs" on jobs for select using (true);
create policy "Public can view hackathons" on hackathons for select using (true);

-- Only service role (backend) should insert/update usually, but for now we might want to allow authenticated users (like admins) or just rely on service role. 
-- For simplicity in development, we'll allow public insert if you are running the scraper locally with your user key, or we can just rely on the service_role key which bypasses RLS.
-- Let's stick to standard public read for now.
