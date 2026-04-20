alter table public.tasks
  add column if not exists external_key text,
  add column if not exists what_is_wrong text,
  add column if not exists why_it_matters text,
  add column if not exists what_to_do text;

update public.tasks
set
  external_key = coalesce(nullif(external_key, ''), id::text),
  what_is_wrong = coalesce(what_is_wrong, description, ''),
  why_it_matters = coalesce(why_it_matters, ''),
  what_to_do = coalesce(what_to_do, description, '')
where
  external_key is null
  or what_is_wrong is null
  or why_it_matters is null
  or what_to_do is null;

alter table public.tasks
  alter column external_key set not null,
  alter column what_is_wrong set not null,
  alter column why_it_matters set not null,
  alter column what_to_do set not null;

create unique index if not exists idx_tasks_audit_page_external_key_unique
  on public.tasks (audit_id, page_id, external_key);

alter table public.internal_link_opportunities
  add column if not exists external_key text,
  add column if not exists source_title text,
  add column if not exists target_title text,
  add column if not exists matched_snippet text,
  add column if not exists placement_hint text,
  add column if not exists reason text,
  add column if not exists completed_at timestamptz;

update public.internal_link_opportunities
set
  external_key = coalesce(nullif(external_key, ''), id::text),
  source_title = coalesce(source_title, source_url, ''),
  target_title = coalesce(target_title, target_url, ''),
  matched_snippet = coalesce(matched_snippet, ''),
  placement_hint = coalesce(placement_hint, ''),
  reason = coalesce(reason, ''),
  status = case
    when status in ('accepted', 'implemented') then 'completed'
    else status
  end
where
  external_key is null
  or source_title is null
  or target_title is null
  or matched_snippet is null
  or placement_hint is null
  or reason is null
  or status in ('accepted', 'implemented');

alter table public.internal_link_opportunities
  alter column external_key set not null,
  alter column source_title set not null,
  alter column target_title set not null,
  alter column matched_snippet set not null,
  alter column placement_hint set not null,
  alter column reason set not null;

alter table public.internal_link_opportunities
  drop constraint if exists internal_link_opportunities_status_check;

alter table public.internal_link_opportunities
  add constraint internal_link_opportunities_status_check
  check (status in ('open', 'completed', 'dismissed'));

create unique index if not exists idx_internal_link_opportunities_audit_page_external_key_unique
  on public.internal_link_opportunities (audit_id, page_id, external_key);
