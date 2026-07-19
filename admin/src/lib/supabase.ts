import { createBrowserClient } from "@supabase/ssr";

export function supabaseBrowser() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export type Exam = {
  id: string;
  slug: string;
  name_en: string;
  name_gu: string | null;
  sort_order: number;
  is_active: boolean;
};

export type Category = {
  id: string;
  kind: "grammar" | "vocabulary";
  name_en: string;
  name_gu: string | null;
  sort_order: number;
  is_active: boolean;
};

export type Topic = {
  id: string;
  category_id: string;
  name_en: string;
  name_gu: string | null;
  sort_order: number;
  is_active: boolean;
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
  difficulty: "easy" | "medium" | "hard";
  is_premium: boolean;
  is_active: boolean;
  created_at: string;
};
