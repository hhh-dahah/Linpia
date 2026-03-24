alter table public.opportunities
  add column if not exists application_required_items text[] not null default '{}',
  add column if not exists application_requirement_note text;

update public.opportunities
set application_requirement_note = coalesce(application_requirement_note, nullif(trial_task, ''))
where application_requirement_note is null
  and nullif(trial_task, '') is not null;

alter table public.applications
  add column if not exists submission_payload jsonb not null default '{}'::jsonb;
