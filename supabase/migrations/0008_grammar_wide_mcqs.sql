-- Powers the "Grammar" MCQ option on a lesson (as distinct from "Unit Test",
-- which stays scoped to just that one topic): random sampling across every
-- topic within the lesson's parent category (e.g. all of "Parts of Speech").
-- Run in the Supabase SQL Editor after 0007_textbook_sections.sql.

create or replace function random_questions_by_category(
  p_category_id uuid,
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
  join topics t on t.id = q.topic_id
  where q.is_active and t.category_id = p_category_id
  order by random()
  limit case when p_limit is null then null else greatest(p_limit, 1) end;
$$;

grant execute on function random_questions_by_category(uuid, int) to anon, authenticated;
