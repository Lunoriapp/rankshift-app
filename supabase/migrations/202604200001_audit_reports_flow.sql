create extension if not exists pgcrypto;

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  name text not null,
  url text not null,
  url_key text not null,
  created_at timestamptz not null default timezone('utc', now()),
  constraint projects_user_url_key_unique unique (user_id, url_key)
);

alter table public.audits
  alter column page_id drop not null;

alter table public.audits
  add column if not exists user_id uuid references auth.users (id) on delete set null,
  add column if not exists project_id uuid references public.projects (id) on delete set null,
  add column if not exists url text,
  add column if not exists url_key text,
  add column if not exists crawl_data jsonb not null default '{}'::jsonb,
  add column if not exists score_breakdown jsonb not null default '{}'::jsonb,
  add column if not exists ai_output_data jsonb not null default '{}'::jsonb,
  add column if not exists fixes_data jsonb not null default '[]'::jsonb,
  add column if not exists issues_found integer,
  add column if not exists title_length integer,
  add column if not exists h1_present boolean,
  add column if not exists word_count integer,
  add column if not exists internal_links integer,
  add column if not exists schema_present boolean;

create index if not exists idx_projects_user_id_created_at
  on public.projects (user_id, created_at desc);

create index if not exists idx_projects_url_key
  on public.projects (url_key);

create index if not exists idx_audits_user_id_created_at
  on public.audits (user_id, created_at desc);

create index if not exists idx_audits_project_id_created_at
  on public.audits (project_id, created_at desc);

create index if not exists idx_audits_url_key_created_at
  on public.audits (url_key, created_at desc);

create table if not exists public.competitor_snapshots (
  id uuid primary key default gen_random_uuid(),
  audit_id uuid not null references public.audits (id) on delete cascade,
  competitor_name text not null,
  competitor_url text,
  score integer not null,
  title_length integer not null,
  h1_present boolean not null,
  word_count integer not null,
  internal_links integer not null,
  schema_present boolean not null,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_competitor_snapshots_audit_id_created_at
  on public.competitor_snapshots (audit_id, created_at asc);

create table if not exists public.saved_reports (
  id uuid primary key default gen_random_uuid(),
  audit_id uuid not null references public.audits (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  report_name text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_saved_reports_user_id_created_at
  on public.saved_reports (user_id, created_at desc);

create table if not exists public.usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  project_id uuid references public.projects (id) on delete set null,
  audit_id uuid references public.audits (id) on delete set null,
  event_name text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_usage_events_user_id_created_at
  on public.usage_events (user_id, created_at desc);

create index if not exists idx_usage_events_audit_id_created_at
  on public.usage_events (audit_id, created_at desc);

create table if not exists public.audit_fix_states (
  user_id uuid not null references auth.users (id) on delete cascade,
  audit_id uuid not null references public.audits (id) on delete cascade,
  fix_id text not null,
  severity text not null,
  completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, audit_id, fix_id),
  constraint audit_fix_states_severity_check
    check (severity in ('critical', 'high', 'medium'))
);

create index if not exists idx_audit_fix_states_audit_id
  on public.audit_fix_states (audit_id);

create index if not exists idx_audit_fix_states_user_id
  on public.audit_fix_states (user_id);

drop trigger if exists set_audit_fix_states_updated_at on public.audit_fix_states;
create trigger set_audit_fix_states_updated_at
before update on public.audit_fix_states
for each row
execute function public.set_updated_at();
