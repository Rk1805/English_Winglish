-- True random question sampling across ALL matching topics/exams, not just
-- whichever rows Postgres happens to scan first. Fixes practice/PYQ sets
-- being dominated by one topic (e.g. all "Article" questions before any
-- other topic appears) when a question count (50/100/200/20) is picked.
-- Run in the Supabase SQL Editor after 0004_multi_exam_topics_leaderboard.sql.

create or replace function random_questions(
  p_topic_id uuid default null,
  p_exam_id uuid default null,
  p_limit int default 20
) returns table (
  id uuid,
  topic_id uuid,
  exam_ids uuid[],
  year int,
  question_en text,
  question_gu text,
  options_en text[],
  options_gu text[],
  correct_index smallint,
  explanation_en text,
  explanation_gu text,
  difficulty difficulty,
  is_premium boolean
)
language sql stable as $$
  select id, topic_id, exam_ids, year, question_en, question_gu, options_en, options_gu,
         correct_index, explanation_en, explanation_gu, difficulty, is_premium
  from questions
  where is_active
    and (p_topic_id is null or topic_id = p_topic_id)
    and (p_exam_id is null or exam_ids @> array[p_exam_id])
  order by random()
  limit greatest(coalesce(p_limit, 20), 1);
$$;

grant execute on function random_questions(uuid, uuid, int) to anon, authenticated;
