drop index if exists idx_opportunity_roles_opportunity_id;
drop table if exists public.opportunity_roles cascade;

alter table public.opportunities
  drop column if exists people_needed;

alter table public.applications
  add column if not exists contact text not null default '';

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'applications'
      and column_name = 'trial_task_url'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'applications'
      and column_name = 'proof_url'
  ) then
    alter table public.applications rename column trial_task_url to proof_url;
  elsif not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'applications'
      and column_name = 'proof_url'
  ) then
    alter table public.applications add column proof_url text;
  end if;
end $$;
