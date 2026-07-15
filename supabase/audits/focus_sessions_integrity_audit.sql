-- Read-only audit. This file intentionally performs no updates or deletes.
with ordered_sessions as (
  select
    id,
    user_id,
    date,
    category,
    duration,
    created_at,
    lag(id) over duplicate_window as previous_session_id,
    lag(created_at) over duplicate_window as previous_created_at
  from public.focus_sessions
  window duplicate_window as (
    partition by user_id, date, category, duration
    order by created_at, id
  )
), suspicious_rows as (
  select
    'duration_out_of_range'::text as reason,
    id,
    user_id,
    date,
    category,
    duration,
    created_at,
    null::uuid as related_session_id
  from ordered_sessions
  where duration <= 0 or duration > 8

  union all

  select
    'possible_duplicate_within_2_minutes'::text as reason,
    id,
    user_id,
    date,
    category,
    duration,
    created_at,
    previous_session_id as related_session_id
  from ordered_sessions
  where previous_created_at is not null
    and created_at - previous_created_at between interval '0 seconds' and interval '2 minutes'
)
select *
from suspicious_rows
order by user_id, created_at, reason;
