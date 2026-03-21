alter table public.profiles add column if not exists role text;
alter table public.profiles add column if not exists profile_completed boolean not null default false;

create table if not exists public.student_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  school text,
  major text,
  grade text,
  skills text[] not null default '{}',
  intro text,
  portfolio text,
  target_direction text,
  contact text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mentor_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  school text,
  college text,
  lab text,
  research_direction text,
  support_types text[] not null default '{}',
  support_method text,
  open_status boolean not null default true,
  intro text,
  contact text,
  application_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

update public.profiles
set nickname = coalesce(nullif(nickname, ''), name)
where nickname is null;

insert into public.student_profiles (
  user_id,
  school,
  major,
  grade,
  skills,
  intro,
  portfolio,
  target_direction,
  contact
)
select
  id,
  school,
  major,
  grade,
  coalesce(skill_tags, '{}'),
  bio,
  portfolio_external_url,
  array_to_string(coalesce(interested_directions, '{}'), '、'),
  contact
from public.profiles
where not exists (
  select 1
  from public.student_profiles
  where public.student_profiles.user_id = public.profiles.id
);

insert into public.mentor_profiles (
  user_id,
  school,
  college,
  lab,
  research_direction,
  support_types,
  support_method,
  open_status,
  intro,
  contact,
  application_notes
)
select
  coalesce(public.mentors.user_id, public.mentors.id),
  public.mentors.school,
  public.mentors.college,
  public.mentors.lab,
  public.mentors.direction,
  coalesce(public.mentors.support_scope, '{}'),
  public.mentors.support_method,
  coalesce(public.mentors.is_open, true),
  public.mentors.direction,
  public.mentors.contact_mode,
  public.mentors.application_notes
from public.mentors
inner join auth.users
  on auth.users.id = coalesce(public.mentors.user_id, public.mentors.id)
where coalesce(public.mentors.user_id, public.mentors.id) is not null
  and not exists (
    select 1
    from public.mentor_profiles
    where public.mentor_profiles.user_id = coalesce(public.mentors.user_id, public.mentors.id)
  );

update public.profiles
set role = 'mentor'
where role is null
  and exists (
    select 1
    from public.mentor_profiles
    where public.mentor_profiles.user_id = public.profiles.id
  );

update public.profiles
set role = 'student'
where role is null;

update public.profiles
set profile_completed = true
where role = 'student'
  and exists (
    select 1
    from public.student_profiles
    where public.student_profiles.user_id = public.profiles.id
      and (
        public.student_profiles.school is not null
        or public.student_profiles.major is not null
        or public.student_profiles.grade is not null
        or public.student_profiles.intro is not null
        or public.student_profiles.contact is not null
        or cardinality(public.student_profiles.skills) > 0
      )
  );

update public.profiles
set profile_completed = true
where role = 'mentor'
  and exists (
    select 1
    from public.mentor_profiles
    where public.mentor_profiles.user_id = public.profiles.id
      and (
        public.mentor_profiles.school is not null
        or public.mentor_profiles.college is not null
        or public.mentor_profiles.lab is not null
        or public.mentor_profiles.research_direction is not null
        or public.mentor_profiles.support_method is not null
        or public.mentor_profiles.contact is not null
        or cardinality(public.mentor_profiles.support_types) > 0
      )
  );

create index if not exists idx_profiles_role on public.profiles (role);
create index if not exists idx_student_profiles_user_id on public.student_profiles (user_id);
create index if not exists idx_mentor_profiles_user_id on public.mentor_profiles (user_id);

alter table public.student_profiles enable row level security;
alter table public.mentor_profiles enable row level security;

drop policy if exists "public can read student profiles" on public.student_profiles;
create policy "public can read student profiles"
on public.student_profiles for select using (true);

drop policy if exists "users manage own student profile" on public.student_profiles;
create policy "users manage own student profile"
on public.student_profiles
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "public can read mentor profiles" on public.mentor_profiles;
create policy "public can read mentor profiles"
on public.mentor_profiles for select using (true);

drop policy if exists "users manage own mentor profiles" on public.mentor_profiles;
create policy "users manage own mentor profiles"
on public.mentor_profiles
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
