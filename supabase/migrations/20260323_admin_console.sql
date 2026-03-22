create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  role text not null default 'operator' check (role in ('super_admin', 'operator')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.directory_people (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users (id) on delete set null,
  source text not null default 'managed' check (source in ('registered', 'managed')),
  role text not null check (role in ('student', 'mentor')),
  name text not null,
  school text,
  major text,
  grade text,
  college text,
  lab text,
  bio text,
  skills text[] not null default '{}',
  interested_directions text[] not null default '{}',
  research_direction text,
  support_types text[] not null default '{}',
  support_method text,
  open_status boolean not null default false,
  contact text,
  avatar_path text,
  portfolio_url text,
  visibility_status text not null default 'active' check (visibility_status in ('active', 'hidden', 'archived')),
  created_by_admin_id uuid references public.admin_users (id) on delete set null,
  updated_by_admin_id uuid references public.admin_users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

alter table public.opportunities
  add column if not exists visibility_status text not null default 'active' check (visibility_status in ('active', 'hidden', 'archived')),
  add column if not exists archived_at timestamptz;

create index if not exists idx_admin_users_user_id on public.admin_users (user_id);
create index if not exists idx_directory_people_role_updated_at on public.directory_people (role, updated_at desc);
create index if not exists idx_directory_people_visibility_role on public.directory_people (visibility_status, role);
create index if not exists idx_directory_people_auth_user_id on public.directory_people (auth_user_id);
create index if not exists idx_opportunities_visibility_created_at on public.opportunities (visibility_status, created_at desc);

alter table public.admin_users enable row level security;
alter table public.directory_people enable row level security;

drop policy if exists "public can read active directory people" on public.directory_people;
create policy "public can read active directory people"
on public.directory_people for select
using (visibility_status = 'active');

insert into public.directory_people (
  id,
  auth_user_id,
  source,
  role,
  name,
  school,
  major,
  grade,
  bio,
  skills,
  interested_directions,
  contact,
  avatar_path,
  portfolio_url,
  visibility_status,
  created_at,
  updated_at
)
select
  p.id,
  p.id,
  'registered',
  'student',
  coalesce(nullif(p.nickname, ''), nullif(p.name, ''), '未命名学生'),
  coalesce(sp.school, p.school),
  coalesce(sp.major, p.major),
  coalesce(sp.grade, p.grade),
  coalesce(sp.intro, p.bio),
  coalesce(sp.skills, p.skill_tags, '{}'::text[]),
  coalesce(
    case
      when coalesce(sp.target_direction, '') = '' then p.interested_directions
      else regexp_split_to_array(sp.target_direction, '[、/,，]')
    end,
    '{}'::text[]
  ),
  coalesce(sp.contact, p.contact),
  p.avatar_path,
  coalesce(sp.portfolio, p.portfolio_external_url),
  'active',
  now(),
  now()
from public.profiles p
left join public.student_profiles sp on sp.user_id = p.id
where p.role = 'student'
on conflict (id) do update
set
  auth_user_id = excluded.auth_user_id,
  source = excluded.source,
  role = excluded.role,
  name = excluded.name,
  school = excluded.school,
  major = excluded.major,
  grade = excluded.grade,
  bio = excluded.bio,
  skills = excluded.skills,
  interested_directions = excluded.interested_directions,
  contact = excluded.contact,
  avatar_path = excluded.avatar_path,
  portfolio_url = excluded.portfolio_url,
  updated_at = now();

insert into public.directory_people (
  id,
  auth_user_id,
  source,
  role,
  name,
  school,
  college,
  lab,
  bio,
  skills,
  research_direction,
  support_types,
  support_method,
  open_status,
  contact,
  avatar_path,
  visibility_status,
  created_at,
  updated_at
)
select
  p.id,
  p.id,
  'registered',
  'mentor',
  coalesce(nullif(p.nickname, ''), nullif(p.name, ''), nullif(m.name, ''), '未命名导师'),
  coalesce(mp.school, m.school),
  coalesce(mp.college, m.college),
  coalesce(mp.lab, m.lab),
  coalesce(mp.intro, m.direction),
  coalesce(m.direction_tags, '{}'::text[]),
  coalesce(mp.research_direction, m.direction),
  coalesce(mp.support_types, m.support_scope, '{}'::text[]),
  coalesce(mp.support_method, m.support_method),
  coalesce(mp.open_status, m.is_open, true),
  coalesce(mp.contact, m.contact_mode),
  coalesce(p.avatar_path, m.avatar_path),
  'active',
  now(),
  now()
from public.profiles p
left join public.mentor_profiles mp on mp.user_id = p.id
left join public.mentors m on m.user_id = p.id
where p.role = 'mentor'
on conflict (id) do update
set
  auth_user_id = excluded.auth_user_id,
  source = excluded.source,
  role = excluded.role,
  name = excluded.name,
  school = excluded.school,
  college = excluded.college,
  lab = excluded.lab,
  bio = excluded.bio,
  skills = excluded.skills,
  research_direction = excluded.research_direction,
  support_types = excluded.support_types,
  support_method = excluded.support_method,
  open_status = excluded.open_status,
  contact = excluded.contact,
  avatar_path = excluded.avatar_path,
  updated_at = now();

insert into public.directory_people (
  source,
  role,
  name,
  school,
  college,
  lab,
  bio,
  skills,
  research_direction,
  support_types,
  support_method,
  open_status,
  contact,
  avatar_path,
  visibility_status,
  created_at,
  updated_at
)
select
  'managed',
  'mentor',
  coalesce(nullif(m.name, ''), '未命名导师'),
  m.school,
  m.college,
  m.lab,
  m.direction,
  coalesce(m.direction_tags, '{}'::text[]),
  m.direction,
  coalesce(m.support_scope, '{}'::text[]),
  m.support_method,
  coalesce(m.is_open, true),
  m.contact_mode,
  m.avatar_path,
  'active',
  coalesce(m.created_at, now()),
  now()
from public.mentors m
where m.user_id is null
and not exists (
  select 1
  from public.directory_people dp
  where dp.source = 'managed'
    and dp.role = 'mentor'
    and dp.name = m.name
    and coalesce(dp.research_direction, '') = coalesce(m.direction, '')
);
