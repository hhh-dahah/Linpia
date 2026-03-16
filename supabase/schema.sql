create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  school text not null,
  major text not null,
  grade text not null,
  bio text not null,
  avatar_path text,
  portfolio_cover_path text,
  portfolio_external_url text,
  time_commitment text not null,
  skill_tags text[] not null default '{}',
  interested_directions text[] not null default '{}',
  achievements text[] not null default '{}',
  contact_hint text default '登录后可发起联系。',
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
  school_scope text not null,
  deadline date not null,
  creator_id uuid not null references public.profiles (id) on delete cascade,
  creator_name text,
  cover_path text,
  feishu_url text,
  status text not null default '开放报名',
  weekly_hours text not null,
  progress text not null,
  trial_task text not null,
  skill_tags text[] not null default '{}',
  deliverables text[] not null default '{}',
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
  applicant_id uuid not null references public.profiles (id) on delete cascade,
  opportunity_title text,
  note text not null,
  status text not null default '待查看',
  trial_task_url text,
  created_at timestamptz not null default now(),
  unique (opportunity_id, applicant_id)
);

create table if not exists public.mentors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  organization text not null,
  direction text not null,
  direction_tags text[] not null default '{}',
  support_scope text[] not null default '{}',
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

alter table public.profiles enable row level security;
alter table public.opportunities enable row level security;
alter table public.opportunity_roles enable row level security;
alter table public.applications enable row level security;
alter table public.mentors enable row level security;
alter table public.cases enable row level security;

create policy "public can read profiles"
on public.profiles for select using (true);

create policy "users manage own profile"
on public.profiles for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "public can read opportunities"
on public.opportunities for select using (true);

create policy "creator manages own opportunities"
on public.opportunities for all using (auth.uid() = creator_id) with check (auth.uid() = creator_id);

create policy "public can read opportunity roles"
on public.opportunity_roles for select using (true);

create policy "creator manages own opportunity roles"
on public.opportunity_roles for all
using (
  exists (
    select 1 from public.opportunities
    where public.opportunities.id = public.opportunity_roles.opportunity_id
      and public.opportunities.creator_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.opportunities
    where public.opportunities.id = public.opportunity_roles.opportunity_id
      and public.opportunities.creator_id = auth.uid()
  )
);

create policy "users can read own applications"
on public.applications for select using (auth.uid() = applicant_id);

create policy "users can insert own applications"
on public.applications for insert with check (auth.uid() = applicant_id);

create policy "users can update own applications"
on public.applications for update using (auth.uid() = applicant_id);

create policy "public can read mentors"
on public.mentors for select using (true);

create policy "public can read cases"
on public.cases for select using (true);

insert into storage.buckets (id, name, public)
values
  ('avatars', 'avatars', true),
  ('portfolio-covers', 'portfolio-covers', true),
  ('opportunity-covers', 'opportunity-covers', true)
on conflict (id) do nothing;
