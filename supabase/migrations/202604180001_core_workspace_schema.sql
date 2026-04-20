create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text unique,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references public.users (id) on delete cascade,
  name text not null,
  slug text not null,
  domain text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint workspaces_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint workspaces_owner_slug_unique unique (owner_user_id, slug)
);

create table if not exists public.pages (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  url text not null,
  normalized_url text not null,
  path text not null,
  title text,
  meta_description text,
  canonical_url text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  last_crawled_at timestamptz,
  constraint pages_workspace_url_unique unique (workspace_id, normalized_url)
);

create table if not exists public.audits (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references public.pages (id) on delete cascade,
  audit_status text not null default 'queued',
  audit_version text,
  score numeric(5,2),
  summary jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  completed_at timestamptz,
  constraint audits_status_check check (audit_status in ('queued', 'running', 'completed', 'failed')),
  constraint audits_id_page_unique unique (id, page_id)
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  audit_id uuid not null,
  page_id uuid not null,
  title text not null,
  description text,
  category text not null,
  priority text not null default 'medium',
  status text not null default 'open',
  effort text,
  source text not null default 'audit',
  completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint tasks_priority_check check (priority in ('low', 'medium', 'high')),
  constraint tasks_status_check check (status in ('open', 'in_progress', 'completed', 'dismissed')),
  constraint tasks_audit_page_fk foreign key (audit_id, page_id)
    references public.audits (id, page_id)
    on delete cascade
);

create table if not exists public.internal_link_opportunities (
  id uuid primary key default gen_random_uuid(),
  audit_id uuid not null,
  page_id uuid not null,
  target_page_id uuid references public.pages (id) on delete set null,
  source_url text not null,
  target_url text not null,
  suggested_anchor text not null,
  confidence numeric(5,2),
  status text not null default 'open',
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint internal_link_opportunities_status_check
    check (status in ('open', 'accepted', 'implemented', 'dismissed')),
  constraint internal_link_opportunities_confidence_check
    check (confidence is null or (confidence >= 0 and confidence <= 100)),
  constraint internal_link_opportunities_audit_page_fk foreign key (audit_id, page_id)
    references public.audits (id, page_id)
    on delete cascade
);

create table if not exists public.task_completion_history (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks (id) on delete cascade,
  changed_by_user_id uuid references public.users (id) on delete set null,
  from_status text,
  to_status text not null,
  note text,
  created_at timestamptz not null default timezone('utc', now()),
  constraint task_completion_history_to_status_check
    check (to_status in ('open', 'in_progress', 'completed', 'dismissed')),
  constraint task_completion_history_from_status_check
    check (
      from_status is null
      or from_status in ('open', 'in_progress', 'completed', 'dismissed')
    )
);

create index if not exists idx_workspaces_owner_user_id
  on public.workspaces (owner_user_id);

create index if not exists idx_pages_workspace_id
  on public.pages (workspace_id);

create index if not exists idx_pages_workspace_path
  on public.pages (workspace_id, path);

create index if not exists idx_audits_page_id_created_at
  on public.audits (page_id, created_at desc);

create index if not exists idx_tasks_audit_id
  on public.tasks (audit_id);

create index if not exists idx_tasks_page_id
  on public.tasks (page_id);

create index if not exists idx_tasks_status
  on public.tasks (status);

create index if not exists idx_internal_link_opportunities_audit_id
  on public.internal_link_opportunities (audit_id);

create index if not exists idx_internal_link_opportunities_page_id
  on public.internal_link_opportunities (page_id);

create index if not exists idx_task_completion_history_task_id_created_at
  on public.task_completion_history (task_id, created_at desc);

drop trigger if exists set_users_updated_at on public.users;
create trigger set_users_updated_at
before update on public.users
for each row
execute function public.set_updated_at();

drop trigger if exists set_workspaces_updated_at on public.workspaces;
create trigger set_workspaces_updated_at
before update on public.workspaces
for each row
execute function public.set_updated_at();

drop trigger if exists set_pages_updated_at on public.pages;
create trigger set_pages_updated_at
before update on public.pages
for each row
execute function public.set_updated_at();

drop trigger if exists set_tasks_updated_at on public.tasks;
create trigger set_tasks_updated_at
before update on public.tasks
for each row
execute function public.set_updated_at();

drop trigger if exists set_internal_link_opportunities_updated_at on public.internal_link_opportunities;
create trigger set_internal_link_opportunities_updated_at
before update on public.internal_link_opportunities
for each row
execute function public.set_updated_at();

alter table public.users enable row level security;
alter table public.workspaces enable row level security;
alter table public.pages enable row level security;
alter table public.audits enable row level security;
alter table public.tasks enable row level security;
alter table public.internal_link_opportunities enable row level security;
alter table public.task_completion_history enable row level security;

drop policy if exists "users_select_own" on public.users;
create policy "users_select_own"
on public.users
for select
using (auth.uid() = id);

drop policy if exists "users_insert_own" on public.users;
create policy "users_insert_own"
on public.users
for insert
with check (auth.uid() = id);

drop policy if exists "users_update_own" on public.users;
create policy "users_update_own"
on public.users
for update
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "workspaces_owner_access" on public.workspaces;
create policy "workspaces_owner_access"
on public.workspaces
for all
using (owner_user_id = auth.uid())
with check (owner_user_id = auth.uid());

drop policy if exists "pages_owner_access" on public.pages;
create policy "pages_owner_access"
on public.pages
for all
using (
  exists (
    select 1
    from public.workspaces w
    where w.id = pages.workspace_id
      and w.owner_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.workspaces w
    where w.id = pages.workspace_id
      and w.owner_user_id = auth.uid()
  )
);

drop policy if exists "audits_owner_access" on public.audits;
create policy "audits_owner_access"
on public.audits
for all
using (
  exists (
    select 1
    from public.pages p
    join public.workspaces w on w.id = p.workspace_id
    where p.id = audits.page_id
      and w.owner_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.pages p
    join public.workspaces w on w.id = p.workspace_id
    where p.id = audits.page_id
      and w.owner_user_id = auth.uid()
  )
);

drop policy if exists "tasks_owner_access" on public.tasks;
create policy "tasks_owner_access"
on public.tasks
for all
using (
  exists (
    select 1
    from public.pages p
    join public.workspaces w on w.id = p.workspace_id
    where p.id = tasks.page_id
      and w.owner_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.pages p
    join public.workspaces w on w.id = p.workspace_id
    where p.id = tasks.page_id
      and w.owner_user_id = auth.uid()
  )
);

drop policy if exists "internal_link_opportunities_owner_access" on public.internal_link_opportunities;
create policy "internal_link_opportunities_owner_access"
on public.internal_link_opportunities
for all
using (
  exists (
    select 1
    from public.pages p
    join public.workspaces w on w.id = p.workspace_id
    where p.id = internal_link_opportunities.page_id
      and w.owner_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.pages p
    join public.workspaces w on w.id = p.workspace_id
    where p.id = internal_link_opportunities.page_id
      and w.owner_user_id = auth.uid()
  )
);

drop policy if exists "task_completion_history_owner_access" on public.task_completion_history;
create policy "task_completion_history_owner_access"
on public.task_completion_history
for all
using (
  exists (
    select 1
    from public.tasks t
    join public.pages p on p.id = t.page_id
    join public.workspaces w on w.id = p.workspace_id
    where t.id = task_completion_history.task_id
      and w.owner_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.tasks t
    join public.pages p on p.id = t.page_id
    join public.workspaces w on w.id = p.workspace_id
    where t.id = task_completion_history.task_id
      and w.owner_user_id = auth.uid()
  )
);
