update public.opportunities
set creator_role = 'student'
where creator_role is null
   or creator_role not in ('student', 'mentor');

update public.opportunities
set status = '开放申请'
where status is null
   or status in ('开放报名', 'open');

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'opportunities_creator_role_check'
  ) then
    alter table public.opportunities
      add constraint opportunities_creator_role_check
      check (creator_role in ('student', 'mentor'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'opportunities_status_check'
  ) then
    alter table public.opportunities
      add constraint opportunities_status_check
      check (status in ('开放申请', '进行中', '已截止'));
  end if;
end $$;

drop policy if exists "creators can read applications on own opportunities" on public.applications;
create policy "creators can read applications on own opportunities"
on public.applications
for select
using (
  exists (
    select 1
    from public.opportunities
    where public.opportunities.id = public.applications.opportunity_id
      and public.opportunities.creator_id = auth.uid()
  )
);
