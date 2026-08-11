-- Powers the Textbook/Chapter screen's "Grammar" MCQ option — broader than
-- "Unit" (this one chapter only): any question tagged to ANY chapter,
-- across every standard/semester. Still the same `questions` table, no
-- separate pool — just a wider chapter_id filter (is not null, vs = this
-- one chapter's id for Unit Test).
-- Run in the Supabase SQL Editor after 0012_revert_grammar_question_bank.sql.

create or replace function random_questions_any_chapter(p_limit int default null)
returns table (
  id uuid, topic_id uuid, exam_ids uuid[], year int, question_en text, question_gu text,
  options_en text[], options_gu text[], correct_index smallint, explanation_en text,
  explanation_gu text, difficulty difficulty, is_premium boolean
)
language sql stable as $$
  select id, topic_id, exam_ids, year, question_en, question_gu, options_en, options_gu,
         correct_index, explanation_en, explanation_gu, difficulty, is_premium
  from questions
  where is_active and chapter_id is not null
  order by random()
  limit case when p_limit is null then null else greatest(p_limit, 1) end;
$$;

grant execute on function random_questions_any_chapter(int) to anon, authenticated;
