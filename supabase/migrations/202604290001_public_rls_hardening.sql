-- URGENT SECURITY HARDENING
-- Purpose:
-- 1) Ensure RLS is enabled on all public app tables.
-- 2) Remove anonymous/public table access.
-- 3) Recreate explicit least-privilege policies for authenticated users.
-- 4) Leave tables without clear ownership locked down by default.

-- =========================
-- Enable RLS everywhere
-- =========================
alter table if exists public.users enable row level security;
alter table if exists public.workspaces enable row level security;
alter table if exists public.pages enable row level security;
alter table if exists public.audits enable row level security;
alter table if exists public.tasks enable row level security;
alter table if exists public.internal_link_opportunities enable row level security;
alter table if exists public.task_completion_history enable row level security;
alter table if exists public.projects enable row level security;
alter table if exists public.competitor_snapshots enable row level security;
alter table if exists public.saved_reports enable row level security;
alter table if exists public.usage_events enable row level security;
alter table if exists public.audit_fix_states enable row level security;
alter table if exists public.rate_limits enable row level security;

-- =========================
-- Remove unsafe broad grants
-- =========================
-- Never allow anonymous/public role to access app tables directly.
revoke all on table public.users from anon, public;
revoke all on table public.workspaces from anon, public;
revoke all on table public.pages from anon, public;
revoke all on table public.audits from anon, public;
revoke all on table public.tasks from anon, public;
revoke all on table public.internal_link_opportunities from anon, public;
revoke all on table public.task_completion_history from anon, public;
revoke all on table public.projects from anon, public;
revoke all on table public.competitor_snapshots from anon, public;
revoke all on table public.saved_reports from anon, public;
revoke all on table public.usage_events from anon, public;
revoke all on table public.audit_fix_states from anon, public;
revoke all on table public.rate_limits from anon, public;

-- Keep authenticated role permissions explicit; RLS still enforces row access.
grant select, insert, update, delete on table public.users to authenticated;
grant select, insert, update, delete on table public.workspaces to authenticated;
grant select, insert, update, delete on table public.pages to authenticated;
grant select, insert, update, delete on table public.audits to authenticated;
grant select, insert, update, delete on table public.tasks to authenticated;
grant select, insert, update, delete on table public.internal_link_opportunities to authenticated;
grant select, insert, update, delete on table public.task_completion_history to authenticated;
grant select, insert, update, delete on table public.projects to authenticated;
grant select, insert, update, delete on table public.competitor_snapshots to authenticated;
grant select, insert, update, delete on table public.saved_reports to authenticated;
grant select, insert, update, delete on table public.usage_events to authenticated;
grant select, insert, update, delete on table public.audit_fix_states to authenticated;
grant select, insert, update, delete on table public.rate_limits to authenticated;

-- =========================
-- Users table policies
-- =========================
-- A user can only read/write their own profile row.
drop policy if exists "users_select_own" on public.users;
drop policy if exists "users_insert_own" on public.users;
drop policy if exists "users_update_own" on public.users;
drop policy if exists "users_delete_own" on public.users;

create policy "users_select_own"
on public.users
for select
using ((select auth.uid()) = id);

create policy "users_insert_own"
on public.users
for insert
with check ((select auth.uid()) = id);

create policy "users_update_own"
on public.users
for update
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy "users_delete_own"
on public.users
for delete
using ((select auth.uid()) = id);

-- =========================
-- User-owned tables (user_id)
-- =========================
-- Projects are user-owned by user_id.
drop policy if exists "projects_owner_access" on public.projects;
create policy "projects_owner_access"
on public.projects
for all
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

-- Saved reports are user-owned by user_id.
drop policy if exists "saved_reports_owner_access" on public.saved_reports;
create policy "saved_reports_owner_access"
on public.saved_reports
for all
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

-- Usage events are user-owned by user_id.
drop policy if exists "usage_events_owner_access" on public.usage_events;
create policy "usage_events_owner_access"
on public.usage_events
for all
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

-- Audit fix states are user-owned by user_id.
drop policy if exists "audit_fix_states_owner_access" on public.audit_fix_states;
create policy "audit_fix_states_owner_access"
on public.audit_fix_states
for all
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

-- Audits can be user-owned directly OR owned via workspace/page relation.
drop policy if exists "audits_owner_access" on public.audits;
drop policy if exists "audits_select_owner" on public.audits;
drop policy if exists "audits_insert_owner" on public.audits;
drop policy if exists "audits_update_owner" on public.audits;
drop policy if exists "audits_delete_owner" on public.audits;

create policy "audits_select_owner"
on public.audits
for select
using (
  (select auth.uid()) = user_id
  or exists (
    select 1
    from public.pages p
    join public.workspaces w on w.id = p.workspace_id
    where p.id = audits.page_id
      and w.owner_user_id = (select auth.uid())
  )
);

create policy "audits_insert_owner"
on public.audits
for insert
with check (
  (select auth.uid()) = user_id
  or exists (
    select 1
    from public.pages p
    join public.workspaces w on w.id = p.workspace_id
    where p.id = audits.page_id
      and w.owner_user_id = (select auth.uid())
  )
);

create policy "audits_update_owner"
on public.audits
for update
using (
  (select auth.uid()) = user_id
  or exists (
    select 1
    from public.pages p
    join public.workspaces w on w.id = p.workspace_id
    where p.id = audits.page_id
      and w.owner_user_id = (select auth.uid())
  )
)
with check (
  (select auth.uid()) = user_id
  or exists (
    select 1
    from public.pages p
    join public.workspaces w on w.id = p.workspace_id
    where p.id = audits.page_id
      and w.owner_user_id = (select auth.uid())
  )
);

create policy "audits_delete_owner"
on public.audits
for delete
using (
  (select auth.uid()) = user_id
  or exists (
    select 1
    from public.pages p
    join public.workspaces w on w.id = p.workspace_id
    where p.id = audits.page_id
      and w.owner_user_id = (select auth.uid())
  )
);

-- =========================
-- Workspace-owned relational tables
-- =========================
drop policy if exists "workspaces_owner_access" on public.workspaces;
create policy "workspaces_owner_access"
on public.workspaces
for all
using ((select auth.uid()) = owner_user_id)
with check ((select auth.uid()) = owner_user_id);

drop policy if exists "pages_owner_access" on public.pages;
create policy "pages_owner_access"
on public.pages
for all
using (
  exists (
    select 1
    from public.workspaces w
    where w.id = pages.workspace_id
      and w.owner_user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.workspaces w
    where w.id = pages.workspace_id
      and w.owner_user_id = (select auth.uid())
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
      and w.owner_user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.pages p
    join public.workspaces w on w.id = p.workspace_id
    where p.id = tasks.page_id
      and w.owner_user_id = (select auth.uid())
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
      and w.owner_user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.pages p
    join public.workspaces w on w.id = p.workspace_id
    where p.id = internal_link_opportunities.page_id
      and w.owner_user_id = (select auth.uid())
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
      and w.owner_user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.tasks t
    join public.pages p on p.id = t.page_id
    join public.workspaces w on w.id = p.workspace_id
    where t.id = task_completion_history.task_id
      and w.owner_user_id = (select auth.uid())
  )
);

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
        a.user_id = (select auth.uid())
        or exists (
          select 1
          from public.pages p
          join public.workspaces w on w.id = p.workspace_id
          where p.id = a.page_id
            and w.owner_user_id = (select auth.uid())
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
        a.user_id = (select auth.uid())
        or exists (
          select 1
          from public.pages p
          join public.workspaces w on w.id = p.workspace_id
          where p.id = a.page_id
            and w.owner_user_id = (select auth.uid())
        )
      )
  )
);

-- =========================
-- Locked-down tables (default deny)
-- =========================
-- rate_limits has no user ownership column and should not be publicly accessible.
-- Keep RLS enabled and do NOT create anon/authenticated policies.
-- Server-side service role can still write/read when needed.
