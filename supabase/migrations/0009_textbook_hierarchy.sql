-- Full Textbook tab hierarchy: Category ("Standard") -> optional Semester
-- split -> Topic ("Chapter"). Untagged topics (semester = null, the
-- default) fall into Sem-I so nothing disappears if the admin never tags
-- them; a category with zero tagged topics just skips the semester tabs.
--
-- Also: videos can be tagged into the sub-categories shown on a chapter's
-- Videos page (Explanation / Self-study / Gala / Grammar); untagged (null)
-- videos land in a catch-all "Other" group.
-- Run in the Supabase SQL Editor after 0008_grammar_wide_mcqs.sql.

alter table topics
  add column semester text check (semester is null or semester in ('sem1', 'sem2'));

alter table videos
  add column video_category text
  check (video_category is null or video_category in ('explanation', 'self_study', 'gala', 'grammar'));
