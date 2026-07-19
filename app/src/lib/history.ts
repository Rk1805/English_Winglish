import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Attempt history stored on the device (no login in the app).
 * Powers the Progress tab. Kept to the most recent 100 attempts.
 */

export type AttemptRecord = {
  date: string; // ISO
  title: string;
  total: number;
  correct: number;
  wrong: number;
  skipped: number;
  accuracy: number; // 0-100 over attempted questions
};

const KEY = 'attempt_history';
const MAX = 100;

export async function saveAttempt(record: AttemptRecord): Promise<void> {
  const attempts = await getAttempts();
  attempts.unshift(record);
  await AsyncStorage.setItem(KEY, JSON.stringify(attempts.slice(0, MAX)));
}

export async function getAttempts(): Promise<AttemptRecord[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as AttemptRecord[]) : [];
  } catch {
    return [];
  }
}

export type ProgressStats = {
  attempts: number;
  questionsSolved: number;
  correct: number;
  avgAccuracy: number;
};

export function computeStats(attempts: AttemptRecord[]): ProgressStats {
  const attempted = attempts.reduce((sum, a) => sum + a.correct + a.wrong, 0);
  const correct = attempts.reduce((sum, a) => sum + a.correct, 0);
  return {
    attempts: attempts.length,
    questionsSolved: attempted,
    correct,
    avgAccuracy: attempted === 0 ? 0 : Math.round((correct * 100) / attempted),
  };
}
