-- Powers the per-topic "Textbook" page (Summary / Important Points / Grammar
-- / Grammar MCQs). A note tagged 'summary' or 'important_points' appears in
-- that named section; untagged notes (section = null, the default — all
-- existing notes stay this way) fall under the general "Grammar" section
-- together with that topic's videos and PDFs. Run after 0006_exam_papers.sql.

alter table notes
  add column section text check (section is null or section in ('summary', 'important_points'));
