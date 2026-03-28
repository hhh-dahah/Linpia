create table if not exists public.conversation_threads (
  id uuid primary key default gen_random_uuid(),
  application_id uuid unique references public.applications (id) on delete cascade,
  opportunity_id uuid not null references public.opportunities (id) on delete cascade,
  opportunity_title text not null default '',
  participant_one_id uuid not null references auth.users (id) on delete cascade,
  participant_one_role text check (participant_one_role in ('student', 'mentor')),
  participant_two_id uuid not null references auth.users (id) on delete cascade,
  participant_two_role text check (participant_two_role in ('student', 'mentor')),
  status text not null default 'open' check (status in ('open', 'closed')),
  last_message_preview text,
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.conversation_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.conversation_threads (id) on delete cascade,
  sender_id uuid not null references auth.users (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.notification_events (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references auth.users (id) on delete cascade,
  thread_id uuid references public.conversation_threads (id) on delete set null,
  application_id uuid references public.applications (id) on delete set null,
  opportunity_id uuid references public.opportunities (id) on delete set null,
  type text not null check (type in ('application_received', 'application_status_changed', 'conversation_message')),
  title text not null,
  body text not null,
  link_href text not null default '/dashboard',
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_conversation_threads_participant_one_id on public.conversation_threads (participant_one_id);
create index if not exists idx_conversation_threads_participant_two_id on public.conversation_threads (participant_two_id);
create index if not exists idx_conversation_threads_last_message_at on public.conversation_threads (last_message_at desc);
create index if not exists idx_conversation_messages_thread_id_created_at on public.conversation_messages (thread_id, created_at asc);
create index if not exists idx_notification_events_recipient_created_at on public.notification_events (recipient_id, created_at desc);
create index if not exists idx_notification_events_recipient_is_read on public.notification_events (recipient_id, is_read);

alter table public.conversation_threads enable row level security;
alter table public.conversation_messages enable row level security;
alter table public.notification_events enable row level security;

drop policy if exists "participants read own conversation threads" on public.conversation_threads;
create policy "participants read own conversation threads"
on public.conversation_threads for select
using (auth.uid() = participant_one_id or auth.uid() = participant_two_id);

drop policy if exists "participants insert own conversation threads" on public.conversation_threads;
create policy "participants insert own conversation threads"
on public.conversation_threads for insert
with check (auth.uid() = participant_one_id or auth.uid() = participant_two_id);

drop policy if exists "participants update own conversation threads" on public.conversation_threads;
create policy "participants update own conversation threads"
on public.conversation_threads for update
using (auth.uid() = participant_one_id or auth.uid() = participant_two_id);

drop policy if exists "participants read own conversation messages" on public.conversation_messages;
create policy "participants read own conversation messages"
on public.conversation_messages for select
using (
  exists (
    select 1
    from public.conversation_threads
    where public.conversation_threads.id = public.conversation_messages.thread_id
      and (public.conversation_threads.participant_one_id = auth.uid() or public.conversation_threads.participant_two_id = auth.uid())
  )
);

drop policy if exists "participants insert own conversation messages" on public.conversation_messages;
create policy "participants insert own conversation messages"
on public.conversation_messages for insert
with check (
  auth.uid() = sender_id
  and exists (
    select 1
    from public.conversation_threads
    where public.conversation_threads.id = public.conversation_messages.thread_id
      and (public.conversation_threads.participant_one_id = auth.uid() or public.conversation_threads.participant_two_id = auth.uid())
  )
);

drop policy if exists "users read own notifications" on public.notification_events;
create policy "users read own notifications"
on public.notification_events for select
using (auth.uid() = recipient_id);

drop policy if exists "users update own notifications" on public.notification_events;
create policy "users update own notifications"
on public.notification_events for update
using (auth.uid() = recipient_id);
