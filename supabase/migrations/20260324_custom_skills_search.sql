alter table public.student_profiles
  add column if not exists custom_skills text[] not null default '{}';

alter table public.directory_people
  add column if not exists custom_skills text[] not null default '{}';

update public.student_profiles
set custom_skills = coalesce(
  (
    select array_agg(distinct skill)
    from unnest(coalesce(public.student_profiles.skills, '{}'::text[])) as skill
    where skill <> all(array['前端', '后端', '产品', '设计', '算法', '数据分析', '新媒体', '运营', '答辩', '硬件'])
  ),
  '{}'::text[]
)
where coalesce(array_length(custom_skills, 1), 0) = 0;

update public.directory_people
set custom_skills = coalesce(
  (
    select array_agg(distinct skill)
    from unnest(coalesce(public.directory_people.skills, '{}'::text[])) as skill
    where skill <> all(array['前端', '后端', '产品', '设计', '算法', '数据分析', '新媒体', '运营', '答辩', '硬件'])
  ),
  '{}'::text[]
)
where role = 'student'
  and coalesce(array_length(custom_skills, 1), 0) = 0;
