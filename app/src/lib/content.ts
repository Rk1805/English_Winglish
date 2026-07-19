import { createClient, SupabaseClient } from '@supabase/supabase-js';

import { isConfigured, SUPABASE_KEY, SUPABASE_URL } from './env';
import { Category, Exam, Note, Pdf, Question, shuffle, Test, TestScore, Topic, Video } from './models';
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

/** Optional filter: only material tagged to a topic or an exam. */
export type MaterialFilter = { topicId?: string; examId?: string };

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
    .select('id, title_en, title_gu, topic_id, exam_id, youtube_id, is_premium')
    .eq('is_active', true);
  if (filter?.topicId) query = query.eq('topic_id', filter.topicId);
  if (filter?.examId) query = query.eq('exam_id', filter.examId);
  return rows<Video>(query.order('sort_order'));
}

export async function fetchNotes(filter?: MaterialFilter): Promise<Note[]> {
  const supabase = db();
  if (!supabase) return [];
  let query = supabase
    .from('notes')
    .select('id, title_en, title_gu, topic_id, body_md, is_premium')
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
  | { kind: 'random' };

export async function fetchQuestions(source: QuizSource, limit?: number): Promise<Question[]> {
  const supabase = db();
  if (!supabase) {
    let all = sampleQuestions;
    if (source.kind === 'topic') all = all.filter((q) => q.topic_id === source.id);
    if (source.kind === 'exam') all = all.filter((q) => q.exam_ids.includes(source.id));
    if (source.kind === 'exam_topic')
      all = all.filter((q) => q.topic_id === source.topicId && q.exam_ids.includes(source.examId));
    const shuffled = shuffle(all);
    return limit ? shuffled.slice(0, limit) : shuffled;
  }

  let query = supabase.from('questions').select(QUESTION_COLUMNS).eq('is_active', true);
  if (source.kind === 'topic') query = query.eq('topic_id', source.id);
  if (source.kind === 'exam') query = query.contains('exam_ids', [source.id]);
  if (source.kind === 'exam_topic')
    query = query.eq('topic_id', source.topicId).contains('exam_ids', [source.examId]);
  // Over-fetch then shuffle client-side; move to a SQL random-sample
  // function once the bank grows past a few thousand rows.
  const fetched = await rows<Question>(limit ? query.limit(limit * 3) : query);
  const shuffled = shuffle(fetched);
  return limit ? shuffled.slice(0, limit) : shuffled;
}
