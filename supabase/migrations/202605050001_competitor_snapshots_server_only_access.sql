-- Harden competitor_snapshots to server-only access.
-- Service role bypasses RLS, so no anon/authenticated policies should exist.

alter table if exists public.competitor_snapshots
enable row level security;

do $$
declare
  policy_record record;
begin
  for policy_record in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'competitor_snapshots'
  loop
    execute format(
      'drop policy if exists %I on public.competitor_snapshots;',
      policy_record.policyname
    );
  end loop;
end
$$;

revoke all on table public.competitor_snapshots from anon;
revoke all on table public.competitor_snapshots from authenticated;
revoke all on table public.competitor_snapshots from public;
