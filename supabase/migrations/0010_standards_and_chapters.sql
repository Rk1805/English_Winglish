-- Real school-Standard structure for the Textbook tab (Std 1-12, grouped by
-- education level), completely separate from the Grammar categories/topics
-- used by the Grammar tab. Undoes the wrong 0009 approach of tagging
-- grammar topics with a semester — semester belongs to Chapters here.
-- Run in the Supabase SQL Editor after 0009_textbook_hierarchy.sql.

-- ─────────────────────────────────────────────
-- Undo the wrong turn from 0009
-- ─────────────────────────────────────────────
alter table topics drop column if exists semester;

-- ─────────────────────────────────────────────
-- Standards (ધોરણ 1-12)
-- ─────────────────────────────────────────────
create table standards (
  id uuid primary key default gen_random_uuid(),
  number int not null unique check (number between 1 and 12),
  education_level text not null
    check (education_level in ('primary', 'upper_primary', 'secondary', 'higher_secondary')),
  sort_order int not null default 0,
  is_active boolean not null default true
);

insert into standards (number, education_level, sort_order) values
  (1, 'primary', 1), (2, 'primary', 2), (3, 'primary', 3), (4, 'primary', 4), (5, 'primary', 5),
  (6, 'upper_primary', 6), (7, 'upper_primary', 7), (8, 'upper_primary', 8),
  (9, 'secondary', 9), (10, 'secondary', 10),
  (11, 'higher_secondary', 11), (12, 'higher_secondary', 12);

-- ─────────────────────────────────────────────
-- Chapters (પાઠ) — belong to one Standard + one Semester
-- ─────────────────────────────────────────────
create table chapters (
  id uuid primary key default gen_random_uuid(),
  standard_id uuid not null references standards on delete cascade,
  semester text not null check (semester in ('sem1', 'sem2')),
  name_en text not null,
  name_gu text,
  pdf_storage_path text,             -- the chapter's textbook PDF (Supabase Storage 'pdfs' bucket)
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index idx_chapters_standard_sem on chapters (standard_id, semester);

-- ─────────────────────────────────────────────
-- Videos and Questions can link to a Chapter too
-- ─────────────────────────────────────────────
alter table videos add column chapter_id uuid references chapters on delete set null;

alter table questions add column chapter_id uuid references chapters on delete set null;
alter table questions drop constraint if exists questions_has_home;
alter table questions add constraint questions_has_home check (
  topic_id is not null or cardinality(exam_ids) > 0 or chapter_id is not null
);

create index idx_questions_chapter on questions (chapter_id) where is_active;

-- ─────────────────────────────────────────────
-- RLS
-- ─────────────────────────────────────────────
alter table standards enable row level security;
alter table chapters enable row level security;

create policy "read standards" on standards for select using (is_active or is_admin());
create policy "admin write standards" on standards for all using (is_admin());
create policy "read chapters" on chapters for select using (is_active or is_admin());
create policy "admin write chapters" on chapters for all using (is_admin());

-- ─────────────────────────────────────────────
-- Random sampling scoped to one chapter (mirrors random_questions_by_paper)
-- ─────────────────────────────────────────────
create or replace function random_questions_by_chapter(
  p_chapter_id uuid,
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
  where is_active and chapter_id = p_chapter_id
  order by random()
  limit case when p_limit is null then null else greatest(p_limit, 1) end;
$$;

grant execute on function random_questions_by_chapter(uuid, int) to anon, authenticated;
