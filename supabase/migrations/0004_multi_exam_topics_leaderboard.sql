-- 1) Questions can belong to multiple exams (exam_ids array replaces exam_id)
-- 2) Topics assigned per exam (exam_topics) for the in-exam topic sections
-- 3) Mock test leaderboard (test_scores + submit RPC, anonymous devices)
-- Run in the Supabase SQL Editor after 0003_analytics_and_reports.sql.

-- ─────────────────────────────────────────────
-- Multiple exams per question
-- ─────────────────────────────────────────────
alter table questions add column exam_ids uuid[] not null default '{}';
update questions set exam_ids = array[exam_id] where exam_id is not null;
alter table questions drop column exam_id cascade;
create index idx_questions_exam_ids on questions using gin (exam_ids);
alter table questions
  add constraint questions_has_home check (topic_id is not null or cardinality(exam_ids) > 0);

-- ─────────────────────────────────────────────
-- Topics inside each exam (assigned by admin)
-- ─────────────────────────────────────────────
create table exam_topics (
  exam_id uuid not null references exams on delete cascade,
  topic_id uuid not null references topics on delete cascade,
  sort_order int not null default 0,
  primary key (exam_id, topic_id)
);

alter table exam_topics enable row level security;
create policy "read exam topics" on exam_topics for select using (true);
create policy "admin write exam topics" on exam_topics for all using (is_admin());

-- ─────────────────────────────────────────────
-- Mock test leaderboard
-- ─────────────────────────────────────────────
create table test_scores (
  id uuid primary key default gen_random_uuid(),
  test_id uuid not null references tests on delete cascade,
  device_id text not null,
  name text not null,
  correct int not null,
  total int not null,
  accuracy int not null,
  duration_seconds int not null default 0,
  created_at timestamptz not null default now(),
  unique (test_id, device_id)
);

create index idx_test_scores_rank on test_scores (test_id, correct desc, duration_seconds asc);

alter table test_scores enable row level security;
-- Leaderboard is public (names are chosen by users, no login exists).
create policy "read leaderboard" on test_scores for select using (true);

-- Writes only via this RPC; keeps each device's best score per test.
create or replace function submit_test_score(
  p_device_id text,
  p_test_id uuid,
  p_name text,
  p_correct int,
  p_total int,
  p_duration_seconds int
) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_name text := left(trim(p_name), 30);
  v_duration int := greatest(coalesce(p_duration_seconds, 0), 0);
  v_existing test_scores%rowtype;
  v_better boolean;
begin
  if p_device_id is null or length(p_device_id) not between 8 and 64 then return; end if;
  if v_name is null or v_name = '' then return; end if;
  if p_total is null or p_total <= 0 or p_correct is null
     or p_correct < 0 or p_correct > p_total then return; end if;
  if not exists (select 1 from tests where id = p_test_id and is_active) then return; end if;

  select * into v_existing from test_scores
  where test_id = p_test_id and device_id = p_device_id;

  if not found then
    insert into test_scores (test_id, device_id, name, correct, total, accuracy, duration_seconds)
    values (p_test_id, p_device_id, v_name, p_correct, p_total,
            round(p_correct * 100.0 / p_total), v_duration)
    on conflict (test_id, device_id) do nothing;
    return;
  end if;

  -- name always updates; score fields only improve (higher correct, then faster)
  v_better := p_correct > v_existing.correct
           or (p_correct = v_existing.correct and v_duration < v_existing.duration_seconds);

  update test_scores set
    name = v_name,
    correct = case when v_better then p_correct else correct end,
    total = case when v_better then p_total else total end,
    accuracy = case when v_better then round(p_correct * 100.0 / p_total) else accuracy end,
    duration_seconds = case when v_better then v_duration else duration_seconds end,
    created_at = case when v_better then now() else created_at end
  where id = v_existing.id;
end $$;

grant execute on function submit_test_score(text, uuid, text, int, int, int) to anon, authenticated;
