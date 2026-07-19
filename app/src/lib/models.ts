export type Exam = {
  id: string;
  slug: string;
  name_en: string;
  name_gu: string | null;
};

export type Category = {
  id: string;
  kind: 'grammar' | 'vocabulary';
  name_en: string;
  name_gu: string | null;
};

export type Topic = {
  id: string;
  category_id: string;
  name_en: string;
  name_gu: string | null;
};

export type Question = {
  id: string;
  topic_id: string | null;
  exam_id: string | null;
  year: number | null;
  question_en: string;
  question_gu: string | null;
  options_en: string[];
  options_gu: string[] | null;
  correct_index: number;
  explanation_en: string | null;
  explanation_gu: string | null;
  difficulty: 'easy' | 'medium' | 'hard';
  is_premium: boolean;
};

/** Pick the Gujarati text when the toggle is on and a translation exists. */
export function loc(gu: boolean, en: string, guText?: string | null): string {
  return gu && guText ? guText : en;
}

export function questionText(q: Question, gu: boolean): string {
  return loc(gu, q.question_en, q.question_gu);
}

export function questionOptions(q: Question, gu: boolean): string[] {
  return gu && q.options_gu?.length === 4 ? q.options_gu : q.options_en;
}

export function questionExplanation(q: Question, gu: boolean): string | null {
  return gu ? (q.explanation_gu ?? q.explanation_en) : q.explanation_en;
}

export function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
