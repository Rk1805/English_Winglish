"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser, type GrammarQuestion } from "@/lib/supabase";
import {
  ActiveBadge,
  PageHeader,
  primaryBtn,
  secondaryBtn,
  Table,
} from "@/components/form-controls";

/**
 * Grammar Question Bank — a pool of MCQs completely separate from the main
 * Questions page (which ties questions to a topic, exam, or chapter). This
 * pool is what powers the single "Grammar MCQs" option in the Grammar tab
 * and the "Grammar MCQs" option inside every Textbook chapter.
 */

type Form = {
  question_en: string;
  question_gu: string;
  options_en: string[];
  options_gu: string[];
  correct_index: number;
  explanation_en: string;
  explanation_gu: string;
  difficulty: "easy" | "medium" | "hard";
  is_premium: boolean;
  is_active: boolean;
};

const EMPTY: Form = {
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

export default function GrammarMcqsPage() {
  const [questions, setQuestions] = useState<GrammarQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [form, setForm] = useState<Form>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const { data, error } = await supabaseBrowser()
      .from("grammar_questions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(300);
    if (error) {
      setError(
        error.message.includes("grammar_questions")
          ? "Table missing — run supabase/migrations/0011_grammar_question_bank.sql in the SQL Editor first."
          : error.message
      );
      setLoading(false);
      return;
    }
    setQuestions(data ?? []);
    setLoading(false);
  }
  useEffect(() => {
    load();
  }, []);

  function startEdit(q?: GrammarQuestion) {
    setError(null);
    if (q) {
      setEditing(q.id);
      setForm({
        question_en: q.question_en,
        question_gu: q.question_gu ?? "",
        options_en: q.options_en,
        options_gu: q.options_gu ?? ["", "", "", ""],
        correct_index: q.correct_index,
        explanation_en: q.explanation_en ?? "",
        explanation_gu: q.explanation_gu ?? "",
        difficulty: q.difficulty,
        is_premium: q.is_premium,
        is_active: q.is_active,
      });
    } else {
      setEditing("new");
      setForm(EMPTY);
    }
  }

  function set<K extends keyof Form>(key: K, value: Form[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function save() {
    setError(null);
    if (form.options_en.some((o) => !o.trim())) {
      setError("All four English options are required.");
      return;
    }
    setSaving(true);
    const payload = {
      question_en: form.question_en.trim(),
      question_gu: form.question_gu.trim() || null,
      options_en: form.options_en,
      options_gu: form.options_gu.every((o) => o.trim()) ? form.options_gu : null,
      correct_index: form.correct_index,
      explanation_en: form.explanation_en.trim() || null,
      explanation_gu: form.explanation_gu.trim() || null,
      difficulty: form.difficulty,
      is_premium: form.is_premium,
      is_active: form.is_active,
    };
    const supabase = supabaseBrowser();
    const { error } =
      editing === "new"
        ? await supabase.from("grammar_questions").insert(payload)
        : await supabase.from("grammar_questions").update(payload).eq("id", editing!);
    setSaving(false);
    if (error) return setError(error.message);
    setEditing(null);
    load();
  }

  async function remove(q: GrammarQuestion) {
    if (!confirm("Delete this Grammar Question Bank question permanently?")) return;
    await supabaseBrowser().from("grammar_questions").delete().eq("id", q.id);
    load();
  }

  const input = "mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm";
  const label = "block text-sm font-medium text-slate-900";

  return (
    <div>
      <PageHeader
        title="Grammar Question Bank"
        action={
          <button className={primaryBtn} onClick={() => startEdit()}>
            + Add Question
          </button>
        }
      />
      <p className="mb-4 text-sm text-slate-900">
        These questions are a separate pool from the main Questions page — they power the single
        &quot;Grammar MCQs&quot; option in the Grammar tab and the &quot;Grammar MCQs&quot; option
        inside every Textbook chapter, both drawing from this same bank (25/50/100/Random in the
        Grammar tab, 10/15/25/Random inside chapters).
      </p>
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {editing !== null && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
          className="mb-6 max-w-3xl space-y-5 rounded-xl bg-white p-6 shadow-sm">
          <div className="grid gap-4 lg:grid-cols-2">
            <label className={label}>
              Question (English) *
              <textarea required rows={3} value={form.question_en}
                onChange={(e) => set("question_en", e.target.value)} className={input} />
            </label>
            <label className={label}>
              Question (ગુજરાતી)
              <textarea rows={3} value={form.question_gu}
                onChange={(e) => set("question_gu", e.target.value)} className={input} />
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
                    value={form.options_gu[i]}
                    onChange={(e) => {
                      const next = [...form.options_gu];
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
              <textarea rows={3} value={form.explanation_en}
                onChange={(e) => set("explanation_en", e.target.value)} className={input} />
            </label>
            <label className={label}>
              Explanation (ગુજરાતી)
              <textarea rows={3} value={form.explanation_gu}
                onChange={(e) => set("explanation_gu", e.target.value)} className={input} />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <label className={label}>
              Difficulty
              <select value={form.difficulty}
                onChange={(e) => set("difficulty", e.target.value as Form["difficulty"])} className={input}>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </label>
            <label className="mt-6 flex items-center gap-2 text-sm text-slate-900">
              <input type="checkbox" checked={form.is_premium}
                onChange={(e) => set("is_premium", e.target.checked)} />
              Premium only
            </label>
            <label className="mt-6 flex items-center gap-2 text-sm text-slate-900">
              <input type="checkbox" checked={form.is_active}
                onChange={(e) => set("is_active", e.target.checked)} />
              Active (visible in app)
            </label>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-3">
            <button type="submit" disabled={saving} className={primaryBtn}>
              {saving ? "Saving…" : editing === "new" ? "Add Question" : "Update Question"}
            </button>
            <button type="button" className={secondaryBtn} onClick={() => setEditing(null)}>
              Cancel
            </button>
          </div>
        </form>
      )}

      <Table headers={["Question", "Difficulty", "Premium", "Status", ""]} empty={!loading && questions.length === 0}>
        {loading && (
          <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-900">Loading…</td></tr>
        )}
        {questions.map((q) => (
          <tr key={q.id} className="border-b border-slate-100">
            <td className="max-w-md px-4 py-3">{q.question_en}</td>
            <td className="px-4 py-3 capitalize">{q.difficulty}</td>
            <td className="px-4 py-3">{q.is_premium ? "Yes" : "No"}</td>
            <td className="px-4 py-3"><ActiveBadge active={q.is_active} /></td>
            <td className="px-4 py-3 text-right whitespace-nowrap">
              <button className="mr-3 text-blue-600 hover:underline" onClick={() => startEdit(q)}>
                Edit
              </button>
              <button className="text-red-600 hover:underline" onClick={() => remove(q)}>
                Delete
              </button>
            </td>
          </tr>
        ))}
      </Table>
    </div>
  );
}
