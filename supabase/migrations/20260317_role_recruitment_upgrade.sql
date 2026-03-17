alter table public.profiles add column if not exists nickname text;
alter table public.profiles add column if not exists experience text;
alter table public.profiles add column if not exists contact text;

update public.profiles
set nickname = coalesce(nullif(nickname, ''), name)
where nickname is null;

update public.profiles
set experience = coalesce(nullif(experience, ''), achievements[1])
where experience is null and array_length(achievements, 1) > 0;

update public.profiles
set contact = coalesce(nullif(contact, ''), contact_hint)
where contact is null and contact_hint is not null;

alter table public.opportunities add column if not exists organization text;
alter table public.opportunities add column if not exists creator_role text not null default 'student';
alter table public.opportunities add column if not exists creator_org_name text;
alter table public.opportunities add column if not exists contact_info text;
alter table public.opportunities add column if not exists preset_tags text[] not null default '{}';
alter table public.opportunities add column if not exists custom_tags text[] not null default '{}';
alter table public.opportunities add column if not exists project_name text;
alter table public.opportunities add column if not exists people_needed text;
alter table public.opportunities add column if not exists research_direction text;
alter table public.opportunities add column if not exists target_audience text;
alter table public.opportunities add column if not exists support_method text;

update public.opportunities
set organization = coalesce(nullif(organization, ''), school_scope)
where organization is null or organization = '';

update public.opportunities
set creator_org_name = coalesce(nullif(creator_org_name, ''), organization, school_scope)
where creator_org_name is null or creator_org_name = '';

update public.opportunities
set preset_tags = coalesce(preset_tags, skill_tags, '{}')
where preset_tags is null or cardinality(preset_tags) = 0;

update public.opportunities
set custom_tags = '{}'
where custom_tags is null;

update public.opportunities
set status = '开放申请'
where status in ('寮€鏀炬姤鍚?', '开放报名', 'open');

alter table public.mentors add column if not exists user_id uuid;
alter table public.mentors add column if not exists school text;
alter table public.mentors add column if not exists college text;
alter table public.mentors add column if not exists lab text;
alter table public.mentors add column if not exists support_method text;
alter table public.mentors add column if not exists application_notes text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'mentors_user_id_fkey'
  ) then
    alter table public.mentors
      add constraint mentors_user_id_fkey
      foreign key (user_id) references auth.users (id) on delete cascade;
  end if;
end $$;

create unique index if not exists idx_mentors_user_id_unique
  on public.mentors (user_id)
  where user_id is not null;

create index if not exists idx_opportunities_creator_id on public.opportunities (creator_id);
create index if not exists idx_opportunities_creator_role on public.opportunities (creator_role);

drop policy if exists "users manage own mentor profile" on public.mentors;
create policy "users manage own mentor profile"
on public.mentors
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
