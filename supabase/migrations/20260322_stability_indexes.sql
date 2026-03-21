create index if not exists idx_opportunities_created_at_desc
  on public.opportunities (created_at desc);

create index if not exists idx_opportunities_status_created_at_desc
  on public.opportunities (status, created_at desc);

create index if not exists idx_opportunities_type_created_at_desc
  on public.opportunities (type, created_at desc);

create index if not exists idx_opportunities_creator_id_created_at_desc
  on public.opportunities (creator_id, created_at desc);

create index if not exists idx_opportunity_roles_opportunity_id
  on public.opportunity_roles (opportunity_id);

create index if not exists idx_applications_applicant_id_created_at_desc
  on public.applications (applicant_id, created_at desc);

create index if not exists idx_applications_opportunity_id_created_at_desc
  on public.applications (opportunity_id, created_at desc);

create index if not exists idx_profiles_role_updated_at_desc
  on public.profiles (role, updated_at desc);

create index if not exists idx_mentors_created_at_desc
  on public.mentors (created_at desc);
