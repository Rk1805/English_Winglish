import { createClient, SupabaseClient } from '@supabase/supabase-js';

import { isConfigured, SUPABASE_KEY, SUPABASE_URL } from './env';
import { Category, Exam, Question, shuffle, Topic } from './models';
import { sampleCategories, sampleExams, sampleQuestions, sampleTopics } from './sample-data';

let client: SupabaseClient | null = null;

/** Supabase client when configured in env.ts, otherwise null (sample mode). */
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

const QUESTION_COLUMNS =
  'id, topic_id, exam_id, year, question_en, question_gu, options_en, options_gu, correct_index, explanation_en, explanation_gu, difficulty, is_premium';

export type QuizSource =
  | { kind: 'topic'; id: string }
  | { kind: 'exam'; id: string }
  | { kind: 'random' };

export async function fetchQuestions(source: QuizSource, limit?: number): Promise<Question[]> {
  const supabase = db();
  if (!supabase) {
    let all = sampleQuestions;
    if (source.kind === 'topic') all = all.filter((q) => q.topic_id === source.id);
    if (source.kind === 'exam') all = all.filter((q) => q.exam_id === source.id);
    const shuffled = shuffle(all);
    return limit ? shuffled.slice(0, limit) : shuffled;
  }

  let query = supabase.from('questions').select(QUESTION_COLUMNS).eq('is_active', true);
  if (source.kind === 'topic') query = query.eq('topic_id', source.id);
  if (source.kind === 'exam') query = query.eq('exam_id', source.id);
  // Over-fetch then shuffle client-side; move to a SQL random-sample
  // function once the bank grows past a few thousand rows.
  const fetched = await rows<Question>(limit ? query.limit(limit * 3) : query);
  const shuffled = shuffle(fetched);
  return limit ? shuffled.slice(0, limit) : shuffled;
}
