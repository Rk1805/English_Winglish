-- English Winglish — seed: exams + grammar taxonomy
-- Gujarati names can be refined by Nikunj Sir in the admin panel later.

insert into exams (slug, name_en, name_gu, sort_order) values
  ('gpsc',         'GPSC',          'જીપીએસસી',          1),
  ('gsssb',        'GSSSB',         'જીએસએસએસબી',        2),
  ('ssc-cgl',      'SSC CGL',       'એસએસસી CGL',        3),
  ('ssc-chsl',     'SSC CHSL',      'એસએસસી CHSL',       4),
  ('ssc-mts',      'SSC MTS',       'એસએસસી MTS',        5),
  ('ibps',         'IBPS',          'આઈબીપીએસ',          6),
  ('sbi-po',       'SBI PO',        'એસબીઆઈ PO',         7),
  ('sbi-clerk',    'SBI Clerk',     'એસબીઆઈ ક્લાર્ક',      8),
  ('rrb',          'RRB (Railway)', 'આરઆરબી (રેલવે)',     9),
  ('police',       'Police',        'પોલીસ',             10),
  ('forest',       'Forest',        'ફોરેસ્ટ',            11),
  ('talati',       'Talati',        'તલાટી',             12),
  ('junior-clerk', 'Junior Clerk',  'જુનિયર ક્લાર્ક',      13),
  ('tet',          'TET',           'ટેટ',               14),
  ('tat',          'TAT',           'ટાટ',               15),
  ('htat',         'HTAT',          'એચટાટ',             16),
  ('upsc',         'UPSC',          'યુપીએસસી',          17),
  ('nda',          'NDA',           'એનડીએ',             18),
  ('cds',          'CDS',           'સીડીએસ',            19);

-- Grammar categories (each category holds topics; single-topic categories get one topic of the same name)
with cat as (
  insert into categories (kind, name_en, name_gu, sort_order) values
    ('grammar',    'Parts of Speech',         'શબ્દના પ્રકાર',        1),
    ('grammar',    'Tenses',                  'કાળ',                2),
    ('grammar',    'Active Passive Voice',    'કર્તરિ-કર્મણિ પ્રયોગ',   3),
    ('grammar',    'Direct Indirect Speech',  'પ્રત્યક્ષ-પરોક્ષ કથન',    4),
    ('grammar',    'Subject Verb Agreement',  'કર્તા-ક્રિયાપદ સંવાદિતા', 5),
    ('grammar',    'Question Tags',           'પ્રશ્ન ટૅગ',            6),
    ('grammar',    'Transformation',          'રૂપાંતરણ',            7),
    ('grammar',    'Narration',               'કથન',                8),
    ('grammar',    'Modals',                  'મોડલ્સ',              9),
    ('grammar',    'Conditional Sentences',   'શરતી વાક્યો',          10),
    ('vocabulary', 'Vocabulary',              'શબ્દભંડોળ',           11)
  returning id, name_en
)
insert into topics (category_id, name_en, name_gu, sort_order)
select id, t.name_en, t.name_gu, t.sort_order
from cat
join lateral (
  values
    -- Parts of Speech topics
    ('Parts of Speech', 'Noun',         'સંજ્ઞા',       1),
    ('Parts of Speech', 'Pronoun',      'સર્વનામ',      2),
    ('Parts of Speech', 'Verb',         'ક્રિયાપદ',      3),
    ('Parts of Speech', 'Adjective',    'વિશેષણ',       4),
    ('Parts of Speech', 'Adverb',       'ક્રિયાવિશેષણ',   5),
    ('Parts of Speech', 'Articles',     'આર્ટિકલ્સ',     6),
    ('Parts of Speech', 'Preposition',  'નામયોગી',      7),
    ('Parts of Speech', 'Conjunction',  'સંયોજક',       8),
    ('Parts of Speech', 'Interjection', 'ઉદ્ગારવાચક',    9),
    -- Vocabulary topics
    ('Vocabulary', 'Synonyms',        'સમાનાર્થી',      1),
    ('Vocabulary', 'Antonyms',        'વિરુદ્ધાર્થી',     2),
    ('Vocabulary', 'Idioms & Phrases','રૂઢિપ્રયોગ',      3),
    ('Vocabulary', 'One Word Substitution', 'એક શબ્દ', 4),
    -- single-topic categories mirror their category name
    ('Tenses',                 'Tenses',                 'કાળ',                1),
    ('Active Passive Voice',   'Active Passive Voice',   'કર્તરિ-કર્મણિ પ્રયોગ',   1),
    ('Direct Indirect Speech', 'Direct Indirect Speech', 'પ્રત્યક્ષ-પરોક્ષ કથન',    1),
    ('Subject Verb Agreement', 'Subject Verb Agreement', 'કર્તા-ક્રિયાપદ સંવાદિતા', 1),
    ('Question Tags',          'Question Tags',          'પ્રશ્ન ટૅગ',            1),
    ('Transformation',         'Transformation',         'રૂપાંતરણ',            1),
    ('Narration',              'Narration',              'કથન',                1),
    ('Modals',                 'Modals',                 'મોડલ્સ',              1),
    ('Conditional Sentences',  'Conditional Sentences',  'શરતી વાક્યો',          1)
) as t(cat_name, name_en, name_gu, sort_order) on t.cat_name = cat.name_en;

-- Sample questions so the app has something to show before real content entry
insert into questions (topic_id, question_en, question_gu, options_en, options_gu, correct_index, explanation_en, explanation_gu, difficulty)
select t.id,
  'Choose the correct noun form: "Honesty is the best ______."',
  'સાચું સંજ્ઞા સ્વરૂપ પસંદ કરો: "Honesty is the best ______."',
  array['policy', 'police', 'politics', 'polite'],
  array['policy', 'police', 'politics', 'polite'],
  0,
  '"Policy" is the correct abstract noun completing the proverb.',
  'કહેવત પૂર્ણ કરવા માટે "policy" સાચી અમૂર્ત સંજ્ઞા છે.',
  'easy'
from topics t where t.name_en = 'Noun' limit 1;

insert into questions (topic_id, question_en, question_gu, options_en, options_gu, correct_index, explanation_en, explanation_gu, difficulty)
select t.id,
  'She ______ to school every day.',
  'She ______ to school every day.',
  array['go', 'goes', 'going', 'gone'],
  array['go', 'goes', 'going', 'gone'],
  1,
  'Simple present with third-person singular subject takes "goes".',
  'ત્રીજા પુરુષ એકવચન કર્તા સાથે સાદો વર્તમાનકાળ "goes" લે છે.',
  'easy'
from topics t where t.name_en = 'Tenses' limit 1;
