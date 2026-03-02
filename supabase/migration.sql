-- ============================================
-- Level Up: Multi-User Auth Migration
-- ============================================

-- 1. Invite Codes Table
-- --------------------------------------------
create table invite_codes (
  id uuid default gen_random_uuid() primary key,
  code text unique not null,
  used boolean default false,
  used_by uuid references auth.users(id),
  used_at timestamptz,
  created_at timestamptz default now()
);

alter table invite_codes enable row level security;
create policy "anon can check unused codes" on invite_codes for select to anon using (used = false);

-- 2. Row Level Security for Existing Tables
-- --------------------------------------------

-- daily_records
alter table daily_records enable row level security;
create policy "users see own data" on daily_records for select using (auth.uid() = user_id);
create policy "users insert own data" on daily_records for insert with check (auth.uid() = user_id);
create policy "users update own data" on daily_records for update using (auth.uid() = user_id);
create policy "users delete own data" on daily_records for delete using (auth.uid() = user_id);

-- countdowns
alter table countdowns enable row level security;
create policy "users see own data" on countdowns for select using (auth.uid() = user_id);
create policy "users insert own data" on countdowns for insert with check (auth.uid() = user_id);
create policy "users update own data" on countdowns for update using (auth.uid() = user_id);
create policy "users delete own data" on countdowns for delete using (auth.uid() = user_id);

-- sticky_notes
alter table sticky_notes enable row level security;
create policy "users see own data" on sticky_notes for select using (auth.uid() = user_id);
create policy "users insert own data" on sticky_notes for insert with check (auth.uid() = user_id);
create policy "users update own data" on sticky_notes for update using (auth.uid() = user_id);
create policy "users delete own data" on sticky_notes for delete using (auth.uid() = user_id);

-- audio_clips
alter table audio_clips enable row level security;
create policy "users see own data" on audio_clips for select using (auth.uid() = user_id);
create policy "users insert own data" on audio_clips for insert with check (auth.uid() = user_id);
create policy "users update own data" on audio_clips for update using (auth.uid() = user_id);
create policy "users delete own data" on audio_clips for delete using (auth.uid() = user_id);

-- focus_images
alter table focus_images enable row level security;
create policy "users see own data" on focus_images for select using (auth.uid() = user_id);
create policy "users insert own data" on focus_images for insert with check (auth.uid() = user_id);
create policy "users update own data" on focus_images for update using (auth.uid() = user_id);
create policy "users delete own data" on focus_images for delete using (auth.uid() = user_id);

-- focus_sessions
alter table focus_sessions enable row level security;
create policy "users see own data" on focus_sessions for select using (auth.uid() = user_id);
create policy "users insert own data" on focus_sessions for insert with check (auth.uid() = user_id);
create policy "users update own data" on focus_sessions for update using (auth.uid() = user_id);
create policy "users delete own data" on focus_sessions for delete using (auth.uid() = user_id);

-- 3. Fix daily_records Unique Constraint
-- --------------------------------------------
alter table daily_records drop constraint if exists daily_records_date_key;
alter table daily_records add constraint daily_records_user_date_key unique (user_id, date);

-- 4. Register With Invite Function
-- --------------------------------------------
create or replace function register_with_invite(invite_code text, user_id uuid)
returns boolean as $$
declare
  code_row invite_codes%rowtype;
begin
  select * into code_row from invite_codes where code = invite_code and used = false for update;
  if not found then return false; end if;
  update invite_codes set used = true, used_by = user_id, used_at = now() where id = code_row.id;
  return true;
end;
$$ language plpgsql security definer;

-- 5. Storage RLS
-- --------------------------------------------
create policy "users manage own focus images" on storage.objects for all using (bucket_id = 'focus-images' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "users manage own audio clips" on storage.objects for all using (bucket_id = 'audio-clips' and auth.uid()::text = (storage.foldername(name))[1]);
