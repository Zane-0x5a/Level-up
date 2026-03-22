-- ============================================
-- Level Up: Growth Analytics Expansion
-- ============================================

alter table daily_records add column if not exists progress_level text
  check (progress_level in ('slight', 'solid', 'breakthrough'));

alter table daily_records add column if not exists progress_note text;

alter table daily_records add column if not exists state_label text
  check (state_label in ('recovering', 'steady', 'good', 'energized'));

create table if not exists user_growth_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  enable_habit_checkins boolean not null default false,
  enable_progress_tracking boolean not null default false,
  enable_state_tracking boolean not null default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

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

create index if not exists idx_daily_records_user_date on daily_records(user_id, date desc);

drop policy if exists "admins can delete any message" on messages;
create policy "admins can delete any message"
  on messages for delete
  using (
    exists (
      select 1
      from user_profiles
      where user_profiles.user_id = auth.uid()
        and user_profiles.is_admin = true
    )
  );
