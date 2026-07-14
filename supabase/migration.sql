-- ============================================================
-- Level Up — Full database initialization
-- ============================================================
-- Run this once in the Supabase SQL Editor on a fresh project.
-- It is idempotent: re-running is safe (IF NOT EXISTS / DROP POLICY ...).
--
-- Creates:
--   Auth & community : invite_codes, user_profiles, channels, messages
--   Personal data    : daily_records, countdowns, sticky_notes,
--                       audio_clips, focus_images, focus_sessions,
--                       user_growth_preferences
--   RLS policies, the register_with_invite() RPC, and indexes.
--
-- Storage buckets (create in Dashboard -> Storage, all public):
--   focus-images, audio-clips, chat-images
-- ============================================================


-- ============================================================
-- §1  Personal data tables
-- ============================================================

-- Daily growth record (one row per user per day)
create table if not exists daily_records (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null,
  date date not null,
  day_type text not null check (day_type in ('study_day', 'rest_day')),
  focus_in_class float not null default 0,
  focus_out_class float not null default 0,
  entertainment float not null default 0,
  ibetter_count int not null default 0,
  return_count int not null default 0,
  progress_level text check (progress_level in ('slight', 'solid', 'breakthrough')),
  progress_note text,
  state_label text check (state_label in ('recovering', 'steady', 'good', 'energized')),
  note text,
  created_at timestamptz default now(),
  constraint daily_records_user_date_key unique (user_id, date)
);

-- Countdown targets shown on the home page
create table if not exists countdowns (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null,
  label text not null,
  target_date date not null
);

-- Sticky notes surfaced at random on the home page
create table if not exists sticky_notes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null,
  content text not null,
  "order" int not null default 0
);

-- Ambient audio clips for focus mode
create table if not exists audio_clips (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null,
  label text not null,
  file_path text not null,
  "order" int not null default 0
);

-- Background images for focus mode
create table if not exists focus_images (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null,
  file_path text not null
);

-- Focus sessions (committed when a focus run ends)
create table if not exists focus_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null,
  date date not null default current_date,
  category text not null check (category in ('in_class', 'out_class', 'entertainment')),
  duration float not null constraint focus_sessions_duration_range_check
    check (duration > 0 and duration <= 8),  -- hours
  client_session_id uuid,
  constraint focus_sessions_user_client_session_id_key
    unique (user_id, client_session_id),
  created_at timestamptz default now()
);

-- Bring existing installations forward without rejecting historical rows that
-- need auditing first. NOT VALID still protects all new and updated rows.
alter table focus_sessions
  add column if not exists client_session_id uuid;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'focus_sessions_user_client_session_id_key'
      and conrelid = 'focus_sessions'::regclass
  ) then
    alter table focus_sessions
      add constraint focus_sessions_user_client_session_id_key
      unique (user_id, client_session_id);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'focus_sessions_duration_range_check'
      and conrelid = 'focus_sessions'::regclass
  ) then
    alter table focus_sessions
      add constraint focus_sessions_duration_range_check
      check (duration > 0 and duration <= 8) not valid;
  end if;
end $$;

-- Optional advanced-tracking toggles (managed in Settings)
create table if not exists user_growth_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  enable_habit_checkins boolean not null default false,
  enable_progress_tracking boolean not null default false,
  enable_state_tracking boolean not null default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);


-- ============================================================
-- §2  Auth & community tables
-- ============================================================

-- Invite codes gate registration
create table if not exists invite_codes (
  id uuid default gen_random_uuid() primary key,
  code text unique not null,
  used boolean default false,
  used_by uuid references auth.users(id),
  used_at timestamptz,
  created_at timestamptz default now()
);

-- Public profile + admin flag
create table if not exists user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null,
  avatar_url text,
  is_admin boolean default false,
  created_at timestamptz default now()
);

-- Community chat channels
create table if not exists channels (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  created_by uuid references auth.users(id),
  sort_order int default 0,
  created_at timestamptz default now()
);

-- Community chat messages
create table if not exists messages (
  id uuid default gen_random_uuid() primary key,
  channel_id uuid references channels(id) on delete cascade not null,
  user_id uuid references auth.users(id) not null,
  content text,
  message_type text default 'text' not null,  -- 'text' | 'image' | 'checkin'
  image_url text,
  checkin_data jsonb,
  reply_to uuid references messages(id) on delete set null,
  created_at timestamptz default now()
);


-- ============================================================
-- §3  Indexes
-- ============================================================

create index if not exists idx_daily_records_user_date on daily_records(user_id, date desc);
create index if not exists idx_messages_channel_created on messages(channel_id, created_at desc);


-- ============================================================
-- §4  Row Level Security — personal data
-- ============================================================
-- Each user sees and mutates only their own rows.

do $$
declare
  t text;
begin
  foreach t in array array[
    'daily_records', 'countdowns', 'sticky_notes',
    'audio_clips', 'focus_images', 'focus_sessions'
  ]
  loop
    execute format('alter table %I enable row level security', t);

    execute format('drop policy if exists "users see own data" on %I', t);
    execute format(
      'create policy "users see own data" on %I for select using (auth.uid() = user_id)', t);

    execute format('drop policy if exists "users insert own data" on %I', t);
    execute format(
      'create policy "users insert own data" on %I for insert with check (auth.uid() = user_id)', t);

    execute format('drop policy if exists "users update own data" on %I', t);
    execute format(
      'create policy "users update own data" on %I for update using (auth.uid() = user_id)', t);

    execute format('drop policy if exists "users delete own data" on %I', t);
    execute format(
      'create policy "users delete own data" on %I for delete using (auth.uid() = user_id)', t);
  end loop;
end $$;

-- Growth preferences
alter table user_growth_preferences enable row level security;

drop policy if exists "users see own growth preferences" on user_growth_preferences;
create policy "users see own growth preferences"
  on user_growth_preferences for select
  using (auth.uid() = user_id);

drop policy if exists "users insert own growth preferences" on user_growth_preferences;
create policy "users insert own growth preferences"
  on user_growth_preferences for insert
  with check (auth.uid() = user_id);

drop policy if exists "users update own growth preferences" on user_growth_preferences;
create policy "users update own growth preferences"
  on user_growth_preferences for update
  using (auth.uid() = user_id);


-- ============================================================
-- §5  Row Level Security — auth & community
-- ============================================================

-- invite_codes: anonymous users may check unused codes during sign-up
alter table invite_codes enable row level security;
drop policy if exists "anon can check unused codes" on invite_codes;
create policy "anon can check unused codes"
  on invite_codes for select
  to anon
  using (used = false);

-- user_profiles
alter table user_profiles enable row level security;

drop policy if exists "authenticated users can read profiles" on user_profiles;
create policy "authenticated users can read profiles"
  on user_profiles for select
  to authenticated
  using (true);

drop policy if exists "users can insert own profile" on user_profiles;
create policy "users can insert own profile"
  on user_profiles for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "users can update own profile" on user_profiles;
create policy "users can update own profile"
  on user_profiles for update
  to authenticated
  using (auth.uid() = user_id);

-- channels: everyone reads, admins write
alter table channels enable row level security;

drop policy if exists "authenticated users can read channels" on channels;
create policy "authenticated users can read channels"
  on channels for select
  to authenticated
  using (true);

drop policy if exists "admins can create channels" on channels;
create policy "admins can create channels"
  on channels for insert
  to authenticated
  with check (
    exists (select 1 from user_profiles where user_id = auth.uid() and is_admin = true)
  );

drop policy if exists "admins can update channels" on channels;
create policy "admins can update channels"
  on channels for update
  to authenticated
  using (
    exists (select 1 from user_profiles where user_id = auth.uid() and is_admin = true)
  );

drop policy if exists "admins can delete channels" on channels;
create policy "admins can delete channels"
  on channels for delete
  to authenticated
  using (
    exists (select 1 from user_profiles where user_id = auth.uid() and is_admin = true)
  );

-- messages: everyone reads, authors write/delete own, admins delete any
alter table messages enable row level security;

drop policy if exists "authenticated users can read messages" on messages;
create policy "authenticated users can read messages"
  on messages for select
  to authenticated
  using (true);

drop policy if exists "users can insert own messages" on messages;
create policy "users can insert own messages"
  on messages for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "users can delete own messages" on messages;
create policy "users can delete own messages"
  on messages for delete
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "admins can delete any message" on messages;
create policy "admins can delete any message"
  on messages for delete
  using (
    exists (select 1 from user_profiles where user_profiles.user_id = auth.uid() and user_profiles.is_admin = true)
  );


-- ============================================================
-- §6  Storage policies (chat-images bucket)
-- ============================================================
-- Create the bucket first in Dashboard -> Storage (public).

drop policy if exists "authenticated users can upload chat images" on storage.objects;
create policy "authenticated users can upload chat images"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'chat-images' and
    (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "authenticated users can read chat images" on storage.objects;
create policy "authenticated users can read chat images"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'chat-images');


-- ============================================================
-- §7  register_with_invite() — atomic invite-code redemption
-- ============================================================
-- Client flow:
--   1. supabase.auth.signUp({ email, password })
--   2. supabase.rpc('register_with_invite', { invite_code, user_id })
--   3. false -> code invalid (roll back the new user); true -> done

create or replace function register_with_invite(
  invite_code text,
  user_id uuid
) returns boolean as $$
declare
  code_row invite_codes%rowtype;
begin
  select * into code_row
    from invite_codes
    where code = invite_code and used = false
    for update;

  if not found then
    return false;
  end if;

  update invite_codes
    set used = true, used_by = user_id, used_at = now()
    where id = code_row.id;

  return true;
end;
$$ language plpgsql security definer;


-- ============================================================
-- §8  Realtime
-- ============================================================
-- Enable Realtime for the messages table so chat syncs live:
--   Dashboard -> Database -> Replication -> add `messages`
-- or:
--   alter publication supabase_realtime add table messages;
