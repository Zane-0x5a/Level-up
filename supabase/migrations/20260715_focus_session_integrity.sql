begin;

alter table public.focus_sessions
  add column if not exists client_session_id uuid;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'focus_sessions_user_client_session_id_key'
      and conrelid = 'public.focus_sessions'::regclass
  ) then
    alter table public.focus_sessions
      add constraint focus_sessions_user_client_session_id_key
      unique (user_id, client_session_id);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'focus_sessions_duration_range_check'
      and conrelid = 'public.focus_sessions'::regclass
  ) then
    alter table public.focus_sessions
      add constraint focus_sessions_duration_range_check
      check (duration > 0 and duration <= 8) not valid;
  end if;
end $$;

commit;
