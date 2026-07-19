"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser, type Question, type Topic, type Exam } from "@/lib/supabase";

const EMPTY: Omit<Question, "id" | "created_at"> = {
  topic_id: null,
  exam_id: null,
  year: null,
  question_en: "",
  question_gu: "",
  options_en: ["", "", "", ""],
  options_gu: ["", "", "", ""],
  correct_index: 0,
  explanation_en: "",
  explanation_gu: "",
  difficulty: "medium",
  is_premium: false,
  is_active: true,
};

export default function QuestionForm({ questionId }: { questionId?: string }) {
  const router = useRouter();
  const [form, setForm] = useState(EMPTY);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = supabaseBrowser();
    supabase.from("topics").select("*").order("sort_order").then(({ data }) => setTopics(data ?? []));
    supabase.from("exams").select("*").order("sort_order").then(({ data }) => setExams(data ?? []));
    if (questionId) {
      supabase.from("questions").select("*").eq("id", questionId).single().then(({ data }) => {
        if (data) {
          setForm({
            ...data,
            options_gu: data.options_gu ?? ["", "", "", ""],
            question_gu: data.question_gu ?? "",
            explanation_en: data.explanation_en ?? "",
            explanation_gu: data.explanation_gu ?? "",
          });
        }
      });
    }
  }, [questionId]);

  function set<K extends keyof typeof EMPTY>(key: K, value: (typeof EMPTY)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.topic_id && !form.exam_id) {
      setError("Select a topic (grammar) or an exam (PYQ) — at least one.");
      return;
    }
    if (form.options_en.some((o) => !o.trim())) {
      setError("All four English options are required.");
      return;
    }
    setSaving(true);
    const supabase = supabaseBrowser();
    const payload = {
      ...form,
      question_gu: form.question_gu?.trim() || null,
      explanation_en: form.explanation_en?.trim() || null,
      explanation_gu: form.explanation_gu?.trim() || null,
      options_gu: form.options_gu?.every((o) => o.trim()) ? form.options_gu : null,
      year: form.year || null,
    };
    const { error } = questionId
      ? await supabase.from("questions").update(payload).eq("id", questionId)
      : await supabase.from("questions").insert(payload);
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push("/questions");
  }

  const input = "mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm";
  const label = "block text-sm font-medium text-slate-900";

  return (
    <form onSubmit={save} className="max-w-3xl space-y-5 rounded-xl bg-white p-6 shadow-sm">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <label className={label}>
          Topic (grammar)
          <select value={form.topic_id ?? ""} onChange={(e) => set("topic_id", e.target.value || null)} className={input}>
            <option value="">— none —</option>
            {topics.map((t) => <option key={t.id} value={t.id}>{t.name_en}</option>)}
          </select>
        </label>
        <label className={label}>
          Exam (PYQ)
          <select value={form.exam_id ?? ""} onChange={(e) => set("exam_id", e.target.value || null)} className={input}>
            <option value="">— none —</option>
            {exams.map((x) => <option key={x.id} value={x.id}>{x.name_en}</option>)}
          </select>
        </label>
        <label className={label}>
          Year
          <input type="number" min={1990} max={2100} value={form.year ?? ""}
            onChange={(e) => set("year", e.target.value ? Number(e.target.value) : null)} className={input} />
        </label>
        <label className={label}>
          Difficulty
          <select value={form.difficulty} onChange={(e) => set("difficulty", e.target.value as Question["difficulty"])} className={input}>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </label>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <label className={label}>
          Question (English) *
          <textarea required rows={3} value={form.question_en} onChange={(e) => set("question_en", e.target.value)} className={input} />
        </label>
        <label className={label}>
          Question (ગુજરાતી)
          <textarea rows={3} value={form.question_gu ?? ""} onChange={(e) => set("question_gu", e.target.value)} className={input} />
        </label>
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-slate-900">
          Options — select the correct answer *
        </legend>
        <div className="space-y-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <input
                type="radio"
                name="correct"
                checked={form.correct_index === i}
                onChange={() => set("correct_index", i)}
                className="h-4 w-4 accent-green-600"
                title="Correct answer"
              />
              <input
                placeholder={`Option ${String.fromCharCode(65 + i)} (English)`}
                value={form.options_en[i]}
                onChange={(e) => {
                  const next = [...form.options_en];
                  next[i] = e.target.value;
                  set("options_en", next);
                }}
                className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
              <input
                placeholder={`વિકલ્પ ${String.fromCharCode(65 + i)} (ગુજરાતી)`}
                value={form.options_gu?.[i] ?? ""}
                onChange={(e) => {
                  const next = [...(form.options_gu ?? ["", "", "", ""])];
                  next[i] = e.target.value;
                  set("options_gu", next);
                }}
                className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4 lg:grid-cols-2">
        <label className={label}>
          Explanation (English)
          <textarea rows={3} value={form.explanation_en ?? ""} onChange={(e) => set("explanation_en", e.target.value)} className={input} />
        </label>
        <label className={label}>
          Explanation (ગુજરાતી)
          <textarea rows={3} value={form.explanation_gu ?? ""} onChange={(e) => set("explanation_gu", e.target.value)} className={input} />
        </label>
      </div>

      <div className="flex gap-6">
        <label className="flex items-center gap-2 text-sm text-slate-900">
          <input type="checkbox" checked={form.is_premium} onChange={(e) => set("is_premium", e.target.checked)} />
          Premium only
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-900">
          <input type="checkbox" checked={form.is_active} onChange={(e) => set("is_active", e.target.checked)} />
          Active (visible in app)
        </label>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-3">
        <button type="submit" disabled={saving}
          className="rounded-md bg-red-600 px-5 py-2 font-semibold text-white hover:bg-red-700 disabled:opacity-50">
          {saving ? "Saving…" : questionId ? "Update Question" : "Add Question"}
        </button>
        <button type="button" onClick={() => router.push("/questions")}
          className="rounded-md border border-slate-300 px-5 py-2 text-slate-900 hover:bg-slate-50">
          Cancel
        </button>
      </div>
    </form>
  );
}
