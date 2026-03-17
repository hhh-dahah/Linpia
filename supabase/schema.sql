create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  nickname text,
  school text,
  major text,
  grade text,
  bio text,
  avatar_path text,
  portfolio_cover_path text,
  portfolio_external_url text,
  time_commitment text,
  skill_tags text[] not null default '{}',
  interested_directions text[] not null default '{}',
  achievements text[] not null default '{}',
  experience text,
  contact text,
  contact_hint text default '登录后可进一步联系。',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.skills (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  category text,
  created_at timestamptz not null default now()
);

create table if not exists public.profile_skills (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  skill_id uuid not null references public.skills (id) on delete cascade,
  primary key (profile_id, skill_id)
);

create table if not exists public.opportunities (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  title text not null,
  summary text not null,
  organization text not null,
  school_scope text not null,
  deadline date not null,
  creator_id uuid not null references auth.users (id) on delete cascade,
  creator_name text,
  creator_role text not null default 'student',
  creator_org_name text,
  contact_info text,
  cover_path text,
  feishu_url text,
  status text not null default '开放申请',
  weekly_hours text not null,
  progress text not null,
  trial_task text,
  skill_tags text[] not null default '{}',
  preset_tags text[] not null default '{}',
  custom_tags text[] not null default '{}',
  deliverables text[] not null default '{}',
  project_name text,
  people_needed text,
  research_direction text,
  target_audience text,
  support_method text,
  applicant_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.opportunity_roles (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references public.opportunities (id) on delete cascade,
  role_name text not null,
  responsibility text not null,
  requirements text not null,
  headcount integer not null default 1,
  weekly_hours text not null
);

create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references public.opportunities (id) on delete cascade,
  applicant_id uuid not null references auth.users (id) on delete cascade,
  opportunity_title text,
  note text not null,
  status text not null default '待查看',
  trial_task_url text,
  created_at timestamptz not null default now(),
  unique (opportunity_id, applicant_id)
);

create table if not exists public.mentors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users (id) on delete cascade,
  name text not null,
  school text,
  college text,
  lab text,
  organization text not null,
  direction text not null,
  direction_tags text[] not null default '{}',
  support_scope text[] not null default '{}',
  support_method text,
  application_notes text,
  avatar_path text,
  contact_mode text not null,
  is_open boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.cases (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  summary text not null,
  result_tags text[] not null default '{}',
  cover_path text,
  related_opportunity_id uuid references public.opportunities (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_opportunities_creator_id on public.opportunities (creator_id);
create index if not exists idx_opportunities_creator_role on public.opportunities (creator_role);
create index if not exists idx_mentors_user_id on public.mentors (user_id);

alter table public.profiles enable row level security;
alter table public.opportunities enable row level security;
alter table public.opportunity_roles enable row level security;
alter table public.applications enable row level security;
alter table public.mentors enable row level security;
alter table public.cases enable row level security;

drop policy if exists "public can read profiles" on public.profiles;
create policy "public can read profiles"
on public.profiles for select using (true);

drop policy if exists "users manage own profile" on public.profiles;
create policy "users manage own profile"
on public.profiles
for all
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "public can read opportunities" on public.opportunities;
create policy "public can read opportunities"
on public.opportunities for select using (true);

drop policy if exists "creator manages own opportunities" on public.opportunities;
create policy "creator manages own opportunities"
on public.opportunities
for all
using (auth.uid() = creator_id)
with check (auth.uid() = creator_id);

drop policy if exists "public can read opportunity roles" on public.opportunity_roles;
create policy "public can read opportunity roles"
on public.opportunity_roles for select using (true);

drop policy if exists "creator manages own opportunity roles" on public.opportunity_roles;
create policy "creator manages own opportunity roles"
on public.opportunity_roles
for all
using (
  exists (
    select 1
    from public.opportunities
    where public.opportunities.id = public.opportunity_roles.opportunity_id
      and public.opportunities.creator_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.opportunities
    where public.opportunities.id = public.opportunity_roles.opportunity_id
      and public.opportunities.creator_id = auth.uid()
  )
);

drop policy if exists "users can read own applications" on public.applications;
create policy "users can read own applications"
on public.applications for select using (auth.uid() = applicant_id);

drop policy if exists "users can insert own applications" on public.applications;
create policy "users can insert own applications"
on public.applications for insert with check (auth.uid() = applicant_id);

drop policy if exists "users can update own applications" on public.applications;
create policy "users can update own applications"
on public.applications for update using (auth.uid() = applicant_id);

drop policy if exists "public can read mentors" on public.mentors;
create policy "public can read mentors"
on public.mentors for select using (true);

drop policy if exists "users manage own mentor profile" on public.mentors;
create policy "users manage own mentor profile"
on public.mentors
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "public can read cases" on public.cases;
create policy "public can read cases"
on public.cases for select using (true);

insert into storage.buckets (id, name, public)
values
  ('avatars', 'avatars', true),
  ('portfolio-covers', 'portfolio-covers', true),
  ('opportunity-covers', 'opportunity-covers', true)
on conflict (id) do nothing;

drop policy if exists "public can view avatars" on storage.objects;
create policy "public can view avatars"
on storage.objects for select
using (bucket_id = 'avatars');

drop policy if exists "public can view portfolio covers" on storage.objects;
create policy "public can view portfolio covers"
on storage.objects for select
using (bucket_id = 'portfolio-covers');

drop policy if exists "public can view opportunity covers" on storage.objects;
create policy "public can view opportunity covers"
on storage.objects for select
using (bucket_id = 'opportunity-covers');

drop policy if exists "authenticated can upload avatars" on storage.objects;
create policy "authenticated can upload avatars"
on storage.objects for insert
with check (bucket_id = 'avatars' and auth.role() = 'authenticated');

drop policy if exists "authenticated can update avatars" on storage.objects;
create policy "authenticated can update avatars"
on storage.objects for update
using (bucket_id = 'avatars' and auth.role() = 'authenticated');

drop policy if exists "authenticated can upload portfolio covers" on storage.objects;
create policy "authenticated can upload portfolio covers"
on storage.objects for insert
with check (bucket_id = 'portfolio-covers' and auth.role() = 'authenticated');

drop policy if exists "authenticated can update portfolio covers" on storage.objects;
create policy "authenticated can update portfolio covers"
on storage.objects for update
using (bucket_id = 'portfolio-covers' and auth.role() = 'authenticated');

drop policy if exists "authenticated can upload opportunity covers" on storage.objects;
create policy "authenticated can upload opportunity covers"
on storage.objects for insert
with check (bucket_id = 'opportunity-covers' and auth.role() = 'authenticated');

drop policy if exists "authenticated can update opportunity covers" on storage.objects;
create policy "authenticated can update opportunity covers"
on storage.objects for update
using (bucket_id = 'opportunity-covers' and auth.role() = 'authenticated');
