-- Optional per-exam "Paper" split (e.g. GPSC has Paper-1 and Paper-2; most
-- exams have none and are unaffected). Also unifies random sampling to
-- support "unlimited" (null limit = no LIMIT clause, still ORDER BY random()).
-- Run in the Supabase SQL Editor after 0005_random_questions.sql.

create table papers (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references exams on delete cascade,
  name_en text not null,
  name_gu text,
  sort_order int not null default 0
);

create table question_papers (
  question_id uuid not null references questions on delete cascade,
  paper_id uuid not null references papers on delete cascade,
  primary key (question_id, paper_id)
);

create index idx_question_papers_paper on question_papers (paper_id);

alter table papers enable row level security;
alter table question_papers enable row level security;

create policy "read papers" on papers for select using (true);
create policy "admin write papers" on papers for all using (is_admin());
create policy "read question papers" on question_papers for select using (true);
create policy "admin write question papers" on question_papers for all using (is_admin());

-- Allow p_limit = null (no LIMIT clause) so "Unlimited Practice" is also a
-- true server-side random selection instead of fetch-all-then-shuffle.
create or replace function random_questions(
  p_topic_id uuid default null,
  p_exam_id uuid default null,
  p_limit int default null
) returns table (
  id uuid, topic_id uuid, exam_ids uuid[], year int, question_en text, question_gu text,
  options_en text[], options_gu text[], correct_index smallint, explanation_en text,
  explanation_gu text, difficulty difficulty, is_premium boolean
)
language sql stable as $$
  select id, topic_id, exam_ids, year, question_en, question_gu, options_en, options_gu,
         correct_index, explanation_en, explanation_gu, difficulty, is_premium
  from questions
  where is_active
    and (p_topic_id is null or topic_id = p_topic_id)
    and (p_exam_id is null or exam_ids @> array[p_exam_id])
  order by random()
  limit case when p_limit is null then null else greatest(p_limit, 1) end;
$$;

grant execute on function random_questions(uuid, uuid, int) to anon, authenticated;

-- Random sampling scoped to a single paper within an exam.
create or replace function random_questions_by_paper(
  p_paper_id uuid,
  p_limit int default null
) returns table (
  id uuid, topic_id uuid, exam_ids uuid[], year int, question_en text, question_gu text,
  options_en text[], options_gu text[], correct_index smallint, explanation_en text,
  explanation_gu text, difficulty difficulty, is_premium boolean
)
language sql stable as $$
  select q.id, q.topic_id, q.exam_ids, q.year, q.question_en, q.question_gu, q.options_en, q.options_gu,
         q.correct_index, q.explanation_en, q.explanation_gu, q.difficulty, q.is_premium
  from questions q
  join question_papers qp on qp.question_id = q.id
  where q.is_active and qp.paper_id = p_paper_id
  order by random()
  limit case when p_limit is null then null else greatest(p_limit, 1) end;
$$;

grant execute on function random_questions_by_paper(uuid, int) to anon, authenticated;
