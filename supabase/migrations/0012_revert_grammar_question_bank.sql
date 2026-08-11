-- Reverts 0011: Grammar MCQs and Exam MCQs both use the same `questions`
-- table as everything else (no separate bank) — only the Textbook/Chapter
-- section has its own separately-uploaded pool, via the existing
-- questions.chapter_id column (unaffected by this migration).
-- Run in the Supabase SQL Editor after 0011_grammar_question_bank.sql.

drop function if exists random_grammar_questions(int);
drop table if exists grammar_questions;
