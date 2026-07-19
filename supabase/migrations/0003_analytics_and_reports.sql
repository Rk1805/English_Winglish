-- Analytics (anonymous device tracking, no login needed) + anonymous question reports.
-- Run in the Supabase SQL Editor after 0002_storage.sql.

-- ─────────────────────────────────────────────
-- Device activity tracking
-- ─────────────────────────────────────────────
create table devices (
  device_id text primary key,
  first_seen timestamptz not null default now(),
  last_seen timestamptz not null default now()
);

-- One row per device per day → distinct daily active users by design.
create table app_activity (
  device_id text not null,
  day date not null,
  primary key (device_id, day)
);

create index idx_app_activity_day on app_activity (day);

alter table devices enable row level security;
alter table app_activity enable row level security;

create policy "admin read devices" on devices for select using (is_admin());
create policy "admin read activity" on app_activity for select using (is_admin());

-- The app calls this on launch and as a heartbeat while open.
-- security definer so anonymous devices can write without table-level access.
create or replace function track_activity(p_device_id text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_device_id is null or length(p_device_id) not between 8 and 64 then
    return;
  end if;
  insert into devices (device_id) values (p_device_id)
  on conflict (device_id) do update set last_seen = now();
  insert into app_activity (device_id, day) values (p_device_id, current_date)
  on conflict do nothing;
end $$;

grant execute on function track_activity(text) to anon, authenticated;

-- Admin-only stats used by the analytics page (bypasses row limits).
create or replace function activity_stats(p_from date, p_to date)
returns table (day date, users bigint)
language sql security definer set search_path = public as $$
  select day, count(*)::bigint as users
  from app_activity
  where day between p_from and p_to
    and is_admin()
  group by day
  order by day;
$$;

grant execute on function activity_stats(date, date) to authenticated;

-- ─────────────────────────────────────────────
-- Question reports from anonymous app users
-- ─────────────────────────────────────────────
alter table question_reports alter column user_id drop not null;
alter table question_reports add column device_id text;

create policy "anon create report" on question_reports
  for insert to anon with check (user_id is null);
create policy "authed anon-style report" on question_reports
  for insert to authenticated with check (user_id is null or user_id = auth.uid());
