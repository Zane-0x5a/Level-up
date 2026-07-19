begin;

-- Bring deployed schemas in line with fields already required by the client.
alter table public.focus_images
  add column if not exists device_type text not null default 'universal';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'focus_images_device_type_check'
      and conrelid = 'public.focus_images'::regclass
  ) then
    alter table public.focus_images
      add constraint focus_images_device_type_check
      check (device_type in ('mobile', 'desktop', 'universal')) not valid;
  end if;
end $$;

alter table public.user_growth_preferences
  add column if not exists enable_focus_timer boolean not null default true,
  add column if not exists enable_motion_detection boolean not null default true;

-- Index hot tenant/date/order paths without changing access semantics.
create index if not exists idx_countdowns_user_target_date
  on public.countdowns(user_id, target_date);
create index if not exists idx_sticky_notes_user_order
  on public.sticky_notes(user_id, "order");
create index if not exists idx_audio_clips_user_order
  on public.audio_clips(user_id, "order");
create index if not exists idx_focus_images_user
  on public.focus_images(user_id);
create index if not exists idx_focus_sessions_user_date_created
  on public.focus_sessions(user_id, date, created_at desc);
create index if not exists idx_focus_sessions_user_created
  on public.focus_sessions(user_id, created_at desc);
create index if not exists idx_messages_reply_to
  on public.messages(reply_to);

-- Preserve return-count behavior while preventing lost updates under concurrency.
create or replace function public.increment_daily_return_count(target_date date)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  next_count integer;
  current_user_id uuid := (select auth.uid());
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  insert into public.daily_records (user_id, date, day_type, return_count)
  values (current_user_id, target_date, 'study_day', 1)
  on conflict (user_id, date)
  do update set return_count = public.daily_records.return_count + 1
  returning return_count into next_count;

  return next_count;
end;
$$;

revoke all on function public.increment_daily_return_count(date) from public;
revoke all on function public.increment_daily_return_count(date) from anon;
grant execute on function public.increment_daily_return_count(date) to authenticated;

commit;
