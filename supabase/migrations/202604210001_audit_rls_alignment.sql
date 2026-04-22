create extension if not exists pgcrypto;

alter table if exists public.audits
  alter column page_id drop not null;

alter table if exists public.audits
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

alter table if exists public.projects enable row level security;
alter table if exists public.competitor_snapshots enable row level security;
alter table if exists public.saved_reports enable row level security;
alter table if exists public.usage_events enable row level security;
alter table if exists public.audit_fix_states enable row level security;

grant select, insert, update, delete on table public.audits to authenticated;
grant select, insert, update, delete on table public.projects to authenticated;
grant select, insert, update, delete on table public.competitor_snapshots to authenticated;
grant select, insert, update, delete on table public.saved_reports to authenticated;
grant select, insert, update, delete on table public.usage_events to authenticated;
grant select, insert, update, delete on table public.audit_fix_states to authenticated;

drop policy if exists "audits_owner_access" on public.audits;
drop policy if exists "audits_select_owner" on public.audits;
drop policy if exists "audits_insert_owner" on public.audits;
drop policy if exists "audits_update_owner" on public.audits;
drop policy if exists "audits_delete_owner" on public.audits;

create policy "audits_select_owner"
on public.audits
for select
using (
  user_id = auth.uid()
  or exists (
    select 1
    from public.pages p
    join public.workspaces w on w.id = p.workspace_id
    where p.id = audits.page_id
      and w.owner_user_id = auth.uid()
  )
);

create policy "audits_insert_owner"
on public.audits
for insert
with check (
  user_id = auth.uid()
  or exists (
    select 1
    from public.pages p
    join public.workspaces w on w.id = p.workspace_id
    where p.id = audits.page_id
      and w.owner_user_id = auth.uid()
  )
);

create policy "audits_update_owner"
on public.audits
for update
using (
  user_id = auth.uid()
  or exists (
    select 1
    from public.pages p
    join public.workspaces w on w.id = p.workspace_id
    where p.id = audits.page_id
      and w.owner_user_id = auth.uid()
  )
)
with check (
  user_id = auth.uid()
  or exists (
    select 1
    from public.pages p
    join public.workspaces w on w.id = p.workspace_id
    where p.id = audits.page_id
      and w.owner_user_id = auth.uid()
  )
);

create policy "audits_delete_owner"
on public.audits
for delete
using (
  user_id = auth.uid()
  or exists (
    select 1
    from public.pages p
    join public.workspaces w on w.id = p.workspace_id
    where p.id = audits.page_id
      and w.owner_user_id = auth.uid()
  )
);

drop policy if exists "projects_owner_access" on public.projects;
create policy "projects_owner_access"
on public.projects
for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "competitor_snapshots_owner_access" on public.competitor_snapshots;
create policy "competitor_snapshots_owner_access"
on public.competitor_snapshots
for all
using (
  exists (
    select 1
    from public.audits a
    where a.id = competitor_snapshots.audit_id
      and (
        a.user_id = auth.uid()
        or exists (
          select 1
          from public.pages p
          join public.workspaces w on w.id = p.workspace_id
          where p.id = a.page_id
            and w.owner_user_id = auth.uid()
        )
      )
  )
)
with check (
  exists (
    select 1
    from public.audits a
    where a.id = competitor_snapshots.audit_id
      and (
        a.user_id = auth.uid()
        or exists (
          select 1
          from public.pages p
          join public.workspaces w on w.id = p.workspace_id
          where p.id = a.page_id
            and w.owner_user_id = auth.uid()
        )
      )
  )
);

drop policy if exists "saved_reports_owner_access" on public.saved_reports;
create policy "saved_reports_owner_access"
on public.saved_reports
for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "usage_events_owner_access" on public.usage_events;
create policy "usage_events_owner_access"
on public.usage_events
for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "audit_fix_states_owner_access" on public.audit_fix_states;
create policy "audit_fix_states_owner_access"
on public.audit_fix_states
for all
using (user_id = auth.uid())
with check (user_id = auth.uid());
