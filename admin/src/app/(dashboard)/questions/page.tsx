"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabaseBrowser, type Question, type Topic, type Exam } from "@/lib/supabase";

export default function QuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [topicFilter, setTopicFilter] = useState("");
  const [examFilter, setExamFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const supabase = supabaseBrowser();
    supabase.from("topics").select("*").order("sort_order").then(({ data }) => setTopics(data ?? []));
    supabase.from("exams").select("*").order("sort_order").then(({ data }) => setExams(data ?? []));
  }, []);

  useEffect(() => {
    const supabase = supabaseBrowser();
    setLoading(true);
    let q = supabase
      .from("questions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    if (topicFilter) q = q.eq("topic_id", topicFilter);
    if (examFilter) q = q.contains("exam_ids", [examFilter]);
    q.then(({ data }) => {
      setQuestions(data ?? []);
      setSelected(new Set());
      setLoading(false);
    });
  }, [topicFilter, examFilter]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected((prev) =>
      prev.size === questions.length ? new Set() : new Set(questions.map((q) => q.id))
    );
  }

  async function remove(id: string) {
    if (!confirm("Delete this question permanently?")) return;
    await supabaseBrowser().from("questions").delete().eq("id", id);
    setQuestions((qs) => qs.filter((q) => q.id !== id));
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  async function removeSelected() {
    const ids = [...selected];
    if (ids.length === 0) return;
    if (!confirm(`Delete ${ids.length} selected question${ids.length > 1 ? "s" : ""} permanently?`))
      return;
    setDeleting(true);
    const { error } = await supabaseBrowser().from("questions").delete().in("id", ids);
    setDeleting(false);
    if (error) {
      alert(`Could not delete: ${error.message}`);
      return;
    }
    setQuestions((qs) => qs.filter((q) => !selected.has(q.id)));
    setSelected(new Set());
  }

  const allSelected = questions.length > 0 && selected.size === questions.length;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Questions</h1>
        <div className="flex gap-2">
          <Link
            href="/questions/import"
            className="rounded-md border border-red-600 px-4 py-2 font-semibold text-red-600 hover:bg-red-50"
          >
            ⬆ Import Excel
          </Link>
          <Link
            href="/questions/new"
            className="rounded-md bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700"
          >
            + Add Question
          </Link>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <select
          value={topicFilter}
          onChange={(e) => setTopicFilter(e.target.value)}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
        >
          <option value="">All topics</option>
          {topics.map((t) => (
            <option key={t.id} value={t.id}>{t.name_en}</option>
          ))}
        </select>
        <select
          value={examFilter}
          onChange={(e) => setExamFilter(e.target.value)}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
        >
          <option value="">All exams (PYQ)</option>
          {exams.map((x) => (
            <option key={x.id} value={x.id}>{x.name_en}</option>
          ))}
        </select>

        {selected.size > 0 && (
          <div className="ml-auto flex items-center gap-3 rounded-md bg-red-50 px-3 py-2">
            <span className="text-sm font-medium text-red-700">
              {selected.size} selected
            </span>
            <button
              onClick={removeSelected}
              disabled={deleting}
              className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
            >
              {deleting ? "Deleting…" : "Delete selected"}
            </button>
            <button
              onClick={() => setSelected(new Set())}
              className="text-sm text-slate-600 hover:underline"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 text-slate-900">
            <tr>
              <th className="w-10 px-4 py-3">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  aria-label="Select all questions"
                />
              </th>
              <th className="px-4 py-3">Question</th>
              <th className="px-4 py-3">Topic</th>
              <th className="px-4 py-3">Exam / Year</th>
              <th className="px-4 py-3">Difficulty</th>
              <th className="px-4 py-3">Premium</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-900">Loading…</td></tr>
            )}
            {!loading && questions.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-900">No questions found.</td></tr>
            )}
            {questions.map((q) => (
              <tr key={q.id} className={`border-b border-slate-100 ${selected.has(q.id) ? "bg-red-50" : ""}`}>
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selected.has(q.id)}
                    onChange={() => toggle(q.id)}
                    aria-label={`Select question: ${q.question_en}`}
                  />
                </td>
                <td className="max-w-md px-4 py-3">{q.question_en}</td>
                <td className="px-4 py-3">{topics.find((t) => t.id === q.topic_id)?.name_en ?? "—"}</td>
                <td className="px-4 py-3">
                  {q.exam_ids.length > 0
                    ? q.exam_ids
                        .map((id) => exams.find((x) => x.id === id)?.name_en)
                        .filter(Boolean)
                        .join(", ")
                    : "—"}
                  {q.year ? ` (${q.year})` : ""}
                </td>
                <td className="px-4 py-3 capitalize">{q.difficulty}</td>
                <td className="px-4 py-3">{q.is_premium ? "Yes" : "No"}</td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <Link href={`/questions/${q.id}`} className="mr-3 text-blue-600 hover:underline">Edit</Link>
                  <button onClick={() => remove(q.id)} className="text-red-600 hover:underline">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
