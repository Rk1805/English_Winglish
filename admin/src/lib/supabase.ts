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

export type Test = {
  id: string;
  title_en: string;
  title_gu: string | null;
  exam_id: string | null;
  duration_minutes: number;
  is_premium: boolean;
  is_active: boolean;
  sort_order: number;
};

export type Pdf = {
  id: string;
  title_en: string;
  title_gu: string | null;
  topic_id: string | null;
  exam_id: string | null;
  storage_path: string;
  is_premium: boolean;
  is_active: boolean;
  sort_order: number;
};

export type Video = {
  id: string;
  title_en: string;
  title_gu: string | null;
  topic_id: string | null;
  exam_id: string | null;
  youtube_id: string;
  is_premium: boolean;
  is_active: boolean;
  sort_order: number;
};

export type Note = {
  id: string;
  title_en: string;
  title_gu: string | null;
  topic_id: string | null;
  body_md: string;
  is_premium: boolean;
  is_active: boolean;
  sort_order: number;
};

export type Profile = {
  id: string;
  full_name: string | null;
  phone: string | null;
  role: "student" | "admin";
  is_premium: boolean;
  premium_until: string | null;
  created_at: string;
};

export type QuestionReport = {
  id: string;
  question_id: string;
  user_id: string;
  message: string;
  status: "open" | "resolved" | "rejected";
  created_at: string;
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
