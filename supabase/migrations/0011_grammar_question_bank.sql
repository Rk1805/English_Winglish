-- A genuinely separate "Grammar Question Bank" — independent of topic_id,
-- exam_ids and chapter_id. This is what powers the single "Grammar MCQs"
-- option in the Grammar tab AND the "Grammar MCQs" option inside every
-- chapter, so both draw from the same dedicated pool instead of overlapping
-- with topic-specific or chapter-specific questions.
-- Run in the Supabase SQL Editor after 0010_standards_and_chapters.sql.

create table grammar_questions (
  id uuid primary key default gen_random_uuid(),
  question_en text not null,
  question_gu text,
  options_en text[] not null check (array_length(options_en, 1) = 4),
  options_gu text[],
  correct_index smallint not null check (correct_index between 0 and 3),
  explanation_en text,
  explanation_gu text,
  difficulty difficulty not null default 'medium',
  is_premium boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table grammar_questions enable row level security;
create policy "read active grammar questions" on grammar_questions for select using (is_active or is_admin());
create policy "admin write grammar questions" on grammar_questions for all using (is_admin());

-- Returns rows shaped exactly like the main `questions` table (topic_id,
-- exam_ids, year filled with harmless empty defaults) so the app can reuse
-- its existing Question type and quiz/review screens without any changes.
create or replace function random_grammar_questions(p_limit int default null)
returns table (
  id uuid, topic_id uuid, exam_ids uuid[], year int, question_en text, question_gu text,
  options_en text[], options_gu text[], correct_index smallint, explanation_en text,
  explanation_gu text, difficulty difficulty, is_premium boolean
)
language sql stable as $$
  select id, null::uuid as topic_id, '{}'::uuid[] as exam_ids, null::int as year,
         question_en, question_gu, options_en, options_gu, correct_index,
         explanation_en, explanation_gu, difficulty, is_premium
  from grammar_questions
  where is_active
  order by random()
  limit case when p_limit is null then null else greatest(p_limit, 1) end;
$$;

grant execute on function random_grammar_questions(int) to anon, authenticated;

-- A "report mistake" tap on a Grammar Question Bank question would otherwise
-- violate the FK to `questions` (grammar_questions has its own id space).
-- Drop the FK so reports work for either table; the admin Reports page
-- looks the id up in both.
alter table question_reports drop constraint if exists question_reports_question_id_fkey;
