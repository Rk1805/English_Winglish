import type { Category, Exam, Question, Topic } from './models';

/**
 * Bundled demo content shown until Supabase credentials are configured in
 * env.ts. Mirrors the supabase/seed.sql taxonomy.
 */

export const sampleExams: Exam[] = [
  { id: 'e1', slug: 'gpsc', name_en: 'GPSC', name_gu: 'જીપીએસસી' },
  { id: 'e2', slug: 'gsssb', name_en: 'GSSSB', name_gu: 'જીએસએસએસબી' },
  { id: 'e3', slug: 'ssc-cgl', name_en: 'SSC CGL', name_gu: null },
  { id: 'e4', slug: 'talati', name_en: 'Talati', name_gu: 'તલાટી' },
  { id: 'e5', slug: 'tet', name_en: 'TET', name_gu: 'ટેટ' },
  { id: 'e6', slug: 'police', name_en: 'Police', name_gu: 'પોલીસ' },
];

export const sampleCategories: Category[] = [
  { id: 'c1', kind: 'grammar', name_en: 'Parts of Speech', name_gu: 'શબ્દના પ્રકાર' },
  { id: 'c2', kind: 'grammar', name_en: 'Tenses', name_gu: 'કાળ' },
  { id: 'c3', kind: 'grammar', name_en: 'Active Passive Voice', name_gu: null },
  { id: 'c4', kind: 'vocabulary', name_en: 'Vocabulary', name_gu: 'શબ્દભંડોળ' },
];

export const sampleTopics: Topic[] = [
  { id: 't1', category_id: 'c1', name_en: 'Noun', name_gu: 'સંજ્ઞા' },
  { id: 't2', category_id: 'c1', name_en: 'Pronoun', name_gu: 'સર્વનામ' },
  { id: 't3', category_id: 'c1', name_en: 'Verb', name_gu: 'ક્રિયાપદ' },
  { id: 't4', category_id: 'c2', name_en: 'Tenses', name_gu: 'કાળ' },
  { id: 't5', category_id: 'c3', name_en: 'Active Passive Voice', name_gu: null },
  { id: 't6', category_id: 'c4', name_en: 'Synonyms', name_gu: 'સમાનાર્થી' },
];

export const sampleQuestions: Question[] = [
  {
    id: 'q1',
    topic_id: 't1',
    exam_id: null,
    year: null,
    question_en: 'Choose the correct noun form: "Honesty is the best ______."',
    question_gu: null,
    options_en: ['policy', 'police', 'politics', 'polite'],
    options_gu: null,
    correct_index: 0,
    explanation_en: '"Policy" is the abstract noun that completes the proverb.',
    explanation_gu: null,
    difficulty: 'easy',
    is_premium: false,
  },
  {
    id: 'q2',
    topic_id: 't4',
    exam_id: null,
    year: null,
    question_en: 'She ______ to school every day.',
    question_gu: null,
    options_en: ['go', 'goes', 'going', 'gone'],
    options_gu: null,
    correct_index: 1,
    explanation_en: 'Simple present with a third-person singular subject takes "goes".',
    explanation_gu: 'ત્રીજા પુરુષ એકવચન કર્તા સાથે સાદો વર્તમાનકાળ "goes" લે છે.',
    difficulty: 'easy',
    is_premium: false,
  },
  {
    id: 'q3',
    topic_id: 't5',
    exam_id: 'e2',
    year: 2022,
    question_en: 'Passive voice of "Ram writes a letter" is:',
    question_gu: null,
    options_en: [
      'A letter is written by Ram',
      'A letter was written by Ram',
      'A letter is being written by Ram',
      'A letter has been written by Ram',
    ],
    options_gu: null,
    correct_index: 0,
    explanation_en: 'Simple present passive: object + is/are + past participle.',
    explanation_gu: null,
    difficulty: 'medium',
    is_premium: false,
  },
  {
    id: 'q4',
    topic_id: 't6',
    exam_id: 'e4',
    year: 2023,
    question_en: 'Choose the synonym of "Abundant":',
    question_gu: null,
    options_en: ['Scarce', 'Plentiful', 'Rare', 'Limited'],
    options_gu: null,
    correct_index: 1,
    explanation_en: '"Abundant" means existing in large quantities — plentiful.',
    explanation_gu: null,
    difficulty: 'medium',
    is_premium: false,
  },
  {
    id: 'q5',
    topic_id: 't2',
    exam_id: 'e5',
    year: 2021,
    question_en: '______ of the two brothers is intelligent.',
    question_gu: null,
    options_en: ['Each', 'Every', 'All', 'Some'],
    options_gu: null,
    correct_index: 0,
    explanation_en: '"Each" is used for two; "every" needs three or more.',
    explanation_gu: null,
    difficulty: 'hard',
    is_premium: false,
  },
];
