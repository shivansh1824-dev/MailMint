-- ============================================================================
-- MAILMINT DATABASE SCHEMA (PostgreSQL / Supabase)
-- Fresh outreach. Real connections.
-- All user-owned records must enforce user_id data isolation.
-- ============================================================================

-- Enable pgcrypto for gen_random_uuid() if not already enabled
create extension if not exists "pgcrypto";

-- 1. USERS
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  password_hash text not null,
  name text,
  google_id text,
  gmail_connected boolean default false,
  gmail_email text,
  gmail_access_token text,
  gmail_refresh_token text,
  gmail_app_password text,
  gmail_auth_type text default 'app_password',
  resend_api_key text,
  resend_from_email text,
  email_provider text default 'resend',
  plan text default 'free' check (plan in ('free', 'pro', 'team')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Ensure migration columns exist on existing databases
alter table if exists users add column if not exists gmail_app_password text;
alter table if exists users add column if not exists gmail_auth_type text default 'app_password';
alter table if exists users add column if not exists resend_api_key text;
alter table if exists users add column if not exists resend_from_email text;
alter table if exists users add column if not exists email_provider text default 'resend';

-- 2. PROFILES
create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade not null,
  full_name text,
  headline text,
  phone text,
  location text,
  university text,
  degree text,
  graduation_year int,
  skills text[] default '{}',
  experience jsonb[] default '{}',
  projects jsonb[] default '{}',
  achievements text[] default '{}',
  certifications text[] default '{}',
  technologies text[] default '{}',
  github_url text,
  linkedin_url text,
  portfolio_url text,
  active_resume_version_id uuid,
  voice_profile text,
  email_signature jsonb default '{"name":"","title":"","email":"","phone":"","linkedin":"","github":"","portfolio":"","layout":"standard"}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. RESUME VERSIONS
create table if not exists resume_versions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade not null,
  name text not null,
  file_url text,
  parsed_data jsonb default '{}'::jsonb,
  is_default boolean default false,
  created_at timestamptz default now()
);

-- 4. CONTACTS
create table if not exists contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade not null,
  name text not null,
  company text,
  job_title text,
  email text,
  linkedin_url text,
  source text default 'manual',
  source_url text,
  notes text,
  tags text[] default '{}',
  status text default 'new' check (status in ('new', 'draft', 'scheduled', 'sent', 'replied', 'follow-up', 'closed', 'snoozed')),
  timezone text default 'UTC',
  last_contacted timestamptz,
  next_follow_up timestamptz,
  snoozed_until timestamptz,
  is_snoozed boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 5. CONTACT TIMELINE
create table if not exists contact_timeline (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade not null,
  contact_id uuid references contacts(id) on delete cascade not null,
  action text not null,
  description text,
  created_at timestamptz default now()
);

-- 6. COMPANIES
create table if not exists companies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade not null,
  name text not null,
  website text,
  careers_url text,
  industry text,
  location text,
  size text,
  funding_stage text,
  recent_news jsonb[] default '{}',
  notes text,
  tags text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 7. JOBS
create table if not exists jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade not null,
  company_id uuid references companies(id) on delete set null,
  title text not null,
  url text,
  description text,
  location text,
  employment_type text,
  skills text[] default '{}',
  analyzed_data jsonb default null,
  status text default 'saved',
  linkedin_job_id text,
  source text default 'manual',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 8. APPLICATIONS
create table if not exists applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade not null,
  job_id uuid references jobs(id) on delete set null,
  contact_id uuid references contacts(id) on delete set null,
  applied_via text default 'portal',
  applied_date date default current_date,
  status text default 'applied' check (status in ('draft', 'applied', 'phone-screen', 'interview', 'offer', 'rejected', 'withdrawn')),
  notes text,
  interview_dates timestamptz[] default '{}',
  referral_from text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 9. TEMPLATES
create table if not exists templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  name text not null,
  category text default 'recruiter',
  subject text,
  body text,
  variables text[] default '{}',
  language text default 'en',
  is_default boolean default false,
  is_public boolean default false,
  author_alias text,
  usage_count int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 10. CAMPAIGNS
create table if not exists campaigns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade not null,
  name text not null,
  description text,
  company_id uuid references companies(id) on delete set null,
  contact_ids uuid[] default '{}',
  template_id uuid references templates(id) on delete set null,
  status text default 'draft',
  ab_test jsonb default null,
  stats jsonb default '{"sent": 0, "replies": 0, "variantA": {"sent": 0, "replies": 0}, "variantB": {"sent": 0, "replies": 0}}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 11. EMAILS
create table if not exists emails (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade not null,
  contact_id uuid references contacts(id) on delete set null,
  job_id uuid references jobs(id) on delete set null,
  campaign_id uuid references campaigns(id) on delete set null,
  type text not null default 'cold-email',
  subject text,
  body text,
  generated_by jsonb default null,
  status text default 'draft' check (status in ('draft', 'scheduled', 'sent', 'replied')),
  scheduled_at timestamptz,
  sent_at timestamptz,
  gmail_message_id text,
  thread_id text,
  replied_at timestamptz,
  language text default 'en',
  ab_variant text,
  quality_score jsonb default null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 12. FOLLOW_UPS
create table if not exists follow_ups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade not null,
  email_id uuid references emails(id) on delete cascade not null,
  contact_id uuid references contacts(id) on delete cascade not null,
  campaign_id uuid references campaigns(id) on delete set null,
  day_offset int default 3,
  status text default 'pending-approval' check (status in ('pending-approval', 'approved', 'sent', 'cancelled')),
  scheduled_at timestamptz,
  sent_at timestamptz,
  approved_by_user boolean default false,
  created_at timestamptz default now()
);

-- 13. INTEGRATIONS
create table if not exists integrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade not null,
  provider text not null,
  access_token text,
  refresh_token text,
  email text,
  scope text,
  connected_at timestamptz default now(),
  last_sync_at timestamptz default now()
);

-- 14. NOTIFICATIONS
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade not null,
  type text default 'system',
  title text not null,
  body text not null,
  read boolean default false,
  created_at timestamptz default now()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE AND DATA ISOLATION
-- ============================================================================
create index if not exists idx_contacts_user_status on contacts(user_id, status);
create index if not exists idx_contacts_user_snoozed on contacts(user_id, is_snoozed);
create index if not exists idx_emails_user_status on emails(user_id, status);
create index if not exists idx_emails_user_campaign on emails(user_id, campaign_id);
create index if not exists idx_emails_gmail_msg on emails(gmail_message_id);
create index if not exists idx_jobs_user_status on jobs(user_id, status);
create index if not exists idx_apps_user_status on applications(user_id, status);
create index if not exists idx_templates_public on templates(is_public);
create index if not exists idx_followups_user_sched on follow_ups(user_id, status, scheduled_at);
create index if not exists idx_notifications_user_read on notifications(user_id, read);
