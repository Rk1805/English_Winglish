import { createClient, SupabaseClient } from '@supabase/supabase-js';

import { isConfigured, SUPABASE_KEY, SUPABASE_URL } from './env';
import { Category, Chapter, Exam, Note, Paper, Pdf, Question, shuffle, Standard, Test, TestScore, Topic, Video } from './models';
import { sampleCategories, sampleExams, sampleQuestions, sampleTopics } from './sample-data';

let client: SupabaseClient | null = null;

/** Supabase client when configured in env.ts, otherwise null (sample mode). */
export function getClient(): SupabaseClient | null {
  return db();
}

function db(): SupabaseClient | null {
  if (!isConfigured) return null;
  if (!client) {
    client = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: false }, // no login in the app for now
    });
  }
  return client;
}

async function rows<T>(query: PromiseLike<{ data: T[] | null; error: { message: string } | null }>): Promise<T[]> {
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function fetchExams(): Promise<Exam[]> {
  const supabase = db();
  if (!supabase) return sampleExams;
  return rows<Exam>(
    supabase.from('exams').select('id, slug, name_en, name_gu').eq('is_active', true).order('sort_order')
  );
}

export async function fetchCategories(): Promise<Category[]> {
  const supabase = db();
  if (!supabase) return sampleCategories;
  return rows<Category>(
    supabase.from('categories').select('id, kind, name_en, name_gu').eq('is_active', true).order('sort_order')
  );
}

export async function fetchTopics(categoryId: string): Promise<Topic[]> {
  const supabase = db();
  if (!supabase) return sampleTopics.filter((t) => t.category_id === categoryId);
  return rows<Topic>(
    supabase
      .from('topics')
      .select('id, category_id, name_en, name_gu')
      .eq('category_id', categoryId)
      .eq('is_active', true)
      .order('sort_order')
  );
}

/** Optional filter: only material tagged to a topic, an exam, or a chapter. */
export type MaterialFilter = { topicId?: string; examId?: string; chapterId?: string };

export async function fetchPdfs(filter?: MaterialFilter): Promise<Pdf[]> {
  const supabase = db();
  if (!supabase) return [];
  let query = supabase
    .from('pdfs')
    .select('id, title_en, title_gu, topic_id, exam_id, storage_path, is_premium')
    .eq('is_active', true);
  if (filter?.topicId) query = query.eq('topic_id', filter.topicId);
  if (filter?.examId) query = query.eq('exam_id', filter.examId);
  return rows<Pdf>(query.order('sort_order'));
}

export async function fetchVideos(filter?: MaterialFilter): Promise<Video[]> {
  const supabase = db();
  if (!supabase) return [];
  let query = supabase
    .from('videos')
    .select('id, title_en, title_gu, topic_id, exam_id, youtube_id, is_premium, video_category')
    .eq('is_active', true);
  if (filter?.topicId) query = query.eq('topic_id', filter.topicId);
  if (filter?.examId) query = query.eq('exam_id', filter.examId);
  if (filter?.chapterId) query = query.eq('chapter_id', filter.chapterId);
  return rows<Video>(query.order('sort_order'));
}

/** Standards (ધોરણ 1-12) for the Textbook tab's top-level grid. */
export async function fetchStandards(): Promise<Standard[]> {
  const supabase = db();
  if (!supabase) return [];
  return rows<Standard>(
    supabase
      .from('standards')
      .select('id, number, education_level')
      .eq('is_active', true)
      .order('sort_order')
  );
}

/** All chapters of a standard (both semesters — screens filter client-side). */
export async function fetchChapters(standardId: string): Promise<Chapter[]> {
  const supabase = db();
  if (!supabase) return [];
  return rows<Chapter>(
    supabase
      .from('chapters')
      .select('id, standard_id, semester, name_en, name_gu, pdf_storage_path')
      .eq('standard_id', standardId)
      .eq('is_active', true)
      .order('sort_order')
  );
}

export async function fetchChapter(chapterId: string): Promise<Chapter | null> {
  const supabase = db();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('chapters')
    .select('id, standard_id, semester, name_en, name_gu, pdf_storage_path')
    .eq('id', chapterId)
    .single();
  if (error) throw new Error(error.message);
  return data as Chapter;
}

export async function fetchNotes(filter?: MaterialFilter): Promise<Note[]> {
  const supabase = db();
  if (!supabase) return [];
  let query = supabase
    .from('notes')
    .select('id, title_en, title_gu, topic_id, body_md, is_premium, section')
    .eq('is_active', true);
  if (filter?.topicId) query = query.eq('topic_id', filter.topicId);
  return rows<Note>(query.order('sort_order'));
}

export function pdfPublicUrl(storagePath: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/pdfs/${storagePath}`;
}

export async function fetchTests(): Promise<Test[]> {
  const supabase = db();
  if (!supabase) return [];
  const raw = await rows<Omit<Test, 'question_count'> & { test_questions: { count: number }[] }>(
    supabase
      .from('tests')
      .select('id, title_en, title_gu, exam_id, duration_minutes, is_premium, test_questions(count)')
      .eq('is_active', true)
      .order('sort_order')
      .returns<(Omit<Test, 'question_count'> & { test_questions: { count: number }[] })[]>()
  );
  return raw.map(({ test_questions, ...test }) => ({
    ...test,
    question_count: test_questions?.[0]?.count ?? 0,
  }));
}

export async function fetchTestQuestions(testId: string): Promise<Question[]> {
  const supabase = db();
  if (!supabase) return [];
  const raw = await rows<{ sort_order: number; questions: Question }>(
    supabase
      .from('test_questions')
      .select(`sort_order, questions (${QUESTION_COLUMNS})`)
      .eq('test_id', testId)
      .order('sort_order')
      .returns<{ sort_order: number; questions: Question }[]>()
  );
  return raw.map((r) => r.questions).filter(Boolean);
}

/** Topics the admin assigned to an exam (for the in-exam topic sections). */
export async function fetchExamTopics(examId: string): Promise<Topic[]> {
  const supabase = db();
  if (!supabase) return [];
  const raw = await rows<{ sort_order: number; topics: Topic }>(
    supabase
      .from('exam_topics')
      .select('sort_order, topics (id, category_id, name_en, name_gu)')
      .eq('exam_id', examId)
      .order('sort_order')
      .returns<{ sort_order: number; topics: Topic }[]>()
  );
  return raw.map((r) => r.topics).filter(Boolean);
}

/** Leaderboard: top scores for a mock test (best per device, kept by the server). */
export async function fetchLeaderboard(testId: string): Promise<TestScore[]> {
  const supabase = db();
  if (!supabase) return [];
  return rows<TestScore>(
    supabase
      .from('test_scores')
      .select('*')
      .eq('test_id', testId)
      .order('correct', { ascending: false })
      .order('duration_seconds', { ascending: true })
      .limit(50)
  );
}

export async function submitTestScore(params: {
  deviceId: string;
  testId: string;
  name: string;
  correct: number;
  total: number;
  durationSeconds: number;
}): Promise<void> {
  const supabase = db();
  if (!supabase) return;
  const { error } = await supabase.rpc('submit_test_score', {
    p_device_id: params.deviceId,
    p_test_id: params.testId,
    p_name: params.name,
    p_correct: params.correct,
    p_total: params.total,
    p_duration_seconds: params.durationSeconds,
  });
  if (error) throw new Error(error.message);
}

/** Anonymous "wrong question" report from the app (no login). */
export async function reportQuestion(questionId: string, message: string, deviceId: string): Promise<void> {
  const supabase = db();
  if (!supabase) return;
  const { error } = await supabase.from('question_reports').insert({
    question_id: questionId,
    message,
    device_id: deviceId,
  });
  if (error) throw new Error(error.message);
}

const QUESTION_COLUMNS =
  'id, topic_id, exam_ids, year, question_en, question_gu, options_en, options_gu, correct_index, explanation_en, explanation_gu, difficulty, is_premium';

export type QuizSource =
  | { kind: 'topic'; id: string }
  | { kind: 'exam'; id: string }
  | { kind: 'exam_topic'; examId: string; topicId: string }
  | { kind: 'exam_paper'; paperId: string }
  | { kind: 'chapter'; id: string }
  | { kind: 'chapter_any' }
  | { kind: 'random' };

export async function fetchQuestions(source: QuizSource, limit?: number): Promise<Question[]> {
  const supabase = db();
  if (!supabase) {
    // Papers/chapter/chapter_any are Supabase-only features (not in the bundled sample set).
    if (source.kind === 'exam_paper' || source.kind === 'chapter' || source.kind === 'chapter_any') return [];
    let all = sampleQuestions;
    if (source.kind === 'topic') all = all.filter((q) => q.topic_id === source.id);
    if (source.kind === 'exam') all = all.filter((q) => q.exam_ids.includes(source.id));
    if (source.kind === 'exam_topic')
      all = all.filter((q) => q.topic_id === source.topicId && q.exam_ids.includes(source.examId));
    const shuffled = shuffle(all);
    return limit ? shuffled.slice(0, limit) : shuffled;
  }

  // Random sampling always happens in the database (ORDER BY random()) —
  // fetching the first N matching rows and shuffling client-side is
  // biased toward whichever topic Postgres scans first. A null limit means
  // "unlimited" (every matching question, still in random order).
  if (source.kind === 'exam_paper') {
    const { data, error } = await supabase.rpc('random_questions_by_paper', {
      p_paper_id: source.paperId,
      p_limit: limit ?? null,
    });
    if (error) throw new Error(error.message);
    return (data ?? []) as Question[];
  }

  if (source.kind === 'chapter') {
    const { data, error } = await supabase.rpc('random_questions_by_chapter', {
      p_chapter_id: source.id,
      p_limit: limit ?? null,
    });
    if (error) throw new Error(error.message);
    return (data ?? []) as Question[];
  }

  if (source.kind === 'chapter_any') {
    const { data, error } = await supabase.rpc('random_questions_any_chapter', {
      p_limit: limit ?? null,
    });
    if (error) throw new Error(error.message);
    return (data ?? []) as Question[];
  }

  const topicId = source.kind === 'topic' ? source.id : source.kind === 'exam_topic' ? source.topicId : null;
  const examId = source.kind === 'exam' ? source.id : source.kind === 'exam_topic' ? source.examId : null;
  const { data, error } = await supabase.rpc('random_questions', {
    p_topic_id: topicId,
    p_exam_id: examId,
    p_limit: limit ?? null,
  });
  if (error) throw new Error(error.message);
  return (data ?? []) as Question[];
}

/** Papers configured for an exam (e.g. GPSC Paper-1, Paper-2). Empty if none set up. */
export async function fetchExamPapers(examId: string): Promise<Paper[]> {
  const supabase = db();
  if (!supabase) return [];
  return rows<Paper>(
    supabase.from('papers').select('id, exam_id, name_en, name_gu').eq('exam_id', examId).order('sort_order')
  );
}

/**
 * Question Bank: every matching question for revision — question, correct
 * answer and explanation all shown at once, no session/score. Unlike
 * fetchQuestions (used for timed/scored practice), this is deliberately in a
 * stable order rather than randomized, since the point is to browse the
 * whole set, not sample a fair subset of it.
 */
export async function fetchQuestionBank(source: QuizSource): Promise<Question[]> {
  const supabase = db();
  if (!supabase) {
    if (
      source.kind === 'exam_paper' ||
      source.kind === 'chapter' ||
      source.kind === 'chapter_any' ||
      source.kind === 'random'
    )
      return [];
    let all = sampleQuestions;
    if (source.kind === 'topic') all = all.filter((q) => q.topic_id === source.id);
    if (source.kind === 'exam') all = all.filter((q) => q.exam_ids.includes(source.id));
    if (source.kind === 'exam_topic')
      all = all.filter((q) => q.topic_id === source.topicId && q.exam_ids.includes(source.examId));
    return all;
  }

  if (source.kind === 'random' || source.kind === 'chapter' || source.kind === 'chapter_any') return [];

  if (source.kind === 'exam_paper') {
    const { data, error } = await supabase
      .from('questions')
      .select(`${QUESTION_COLUMNS}, question_papers!inner(paper_id)`)
      .eq('is_active', true)
      .eq('question_papers.paper_id', source.paperId)
      .order('year', { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as Question[];
  }

  let query = supabase.from('questions').select(QUESTION_COLUMNS).eq('is_active', true);
  if (source.kind === 'topic') query = query.eq('topic_id', source.id);
  if (source.kind === 'exam') query = query.contains('exam_ids', [source.id]);
  if (source.kind === 'exam_topic')
    query = query.eq('topic_id', source.topicId).contains('exam_ids', [source.examId]);
  return rows<Question>(query.order('year', { ascending: false }));
}
