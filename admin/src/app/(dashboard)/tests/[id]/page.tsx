"use client";

import { use, useEffect, useState } from "react";
import { supabaseBrowser, type Exam, type Question, type Test, type Topic } from "@/lib/supabase";
import { inputCls, PageHeader, primaryBtn, secondaryBtn } from "@/components/form-controls";

export default function ManageTestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: testId } = use(params);
  const [test, setTest] = useState<Test | null>(null);
  const [assigned, setAssigned] = useState<Set<string>>(new Set());
  const [questions, setQuestions] = useState<Question[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [topicFilter, setTopicFilter] = useState("");
  const [examFilter, setExamFilter] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);

  useEffect(() => {
    const supabase = supabaseBrowser();
    supabase.from("tests").select("*").eq("id", testId).single().then(({ data }) => setTest(data));
    supabase.from("topics").select("*").order("sort_order").then(({ data }) => setTopics(data ?? []));
    supabase.from("exams").select("*").order("sort_order").then(({ data }) => setExams(data ?? []));
    supabase
      .from("test_questions")
      .select("question_id")
      .eq("test_id", testId)
      .then(({ data }) => setAssigned(new Set((data ?? []).map((r) => r.question_id))));
  }, [testId]);

  useEffect(() => {
    const supabase = supabaseBrowser();
    let query = supabase.from("questions").select("*").order("created_at", { ascending: false }).limit(200);
    if (topicFilter) query = query.eq("topic_id", topicFilter);
    if (examFilter) query = query.eq("exam_id", examFilter);
    query.then(({ data }) => setQuestions(data ?? []));
  }, [topicFilter, examFilter]);

  function toggle(questionId: string) {
    setAssigned((prev) => {
      const next = new Set(prev);
      if (next.has(questionId)) next.delete(questionId);
      else next.add(questionId);
      return next;
    });
  }

  async function save() {
    setSaving(true);
    const supabase = supabaseBrowser();
    await supabase.from("test_questions").delete().eq("test_id", testId);
    const rows = [...assigned].map((question_id, i) => ({
      test_id: testId,
      question_id,
      sort_order: i,
    }));
    if (rows.length > 0) await supabase.from("test_questions").insert(rows);
    setSaving(false);
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 2000);
  }

  return (
    <div>
      <PageHeader
        title={test ? `Manage: ${test.title_en}` : "Manage Test"}
        action={
          <div className="flex items-center gap-3">
            {savedMsg && <span className="text-sm font-medium text-green-600">Saved ✓</span>}
            <span className="text-sm text-slate-500">{assigned.size} questions selected</span>
            <button className={primaryBtn} onClick={save} disabled={saving}>
              {saving ? "Saving…" : "Save Test"}
            </button>
          </div>
        }
      />

      <div className="mb-4 flex gap-3">
        <select value={topicFilter} onChange={(e) => setTopicFilter(e.target.value)} className={inputCls + " max-w-56"}>
          <option value="">All topics</option>
          {topics.map((t) => <option key={t.id} value={t.id}>{t.name_en}</option>)}
        </select>
        <select value={examFilter} onChange={(e) => setExamFilter(e.target.value)} className={inputCls + " max-w-56"}>
          <option value="">All exams</option>
          {exams.map((x) => <option key={x.id} value={x.id}>{x.name_en}</option>)}
        </select>
        <button
          className={secondaryBtn}
          onClick={() => setAssigned((prev) => new Set([...prev, ...questions.map((q) => q.id)]))}>
          Select all shown
        </button>
      </div>

      <div className="space-y-2">
        {questions.length === 0 && (
          <p className="rounded-xl bg-white p-8 text-center text-slate-400 shadow-sm">
            No questions match the filters.
          </p>
        )}
        {questions.map((question) => (
          <label
            key={question.id}
            className={`flex cursor-pointer items-start gap-3 rounded-xl border bg-white p-4 shadow-sm ${
              assigned.has(question.id) ? "border-red-400" : "border-transparent"
            }`}>
            <input
              type="checkbox"
              className="mt-1"
              checked={assigned.has(question.id)}
              onChange={() => toggle(question.id)}
            />
            <div>
              <p className="text-sm font-medium text-slate-800">{question.question_en}</p>
              <p className="mt-1 text-xs text-slate-500">
                {topics.find((t) => t.id === question.topic_id)?.name_en ?? "no topic"} ·{" "}
                {exams.find((x) => x.id === question.exam_id)?.name_en ?? "no exam"}
                {question.year ? ` (${question.year})` : ""} · {question.difficulty}
              </p>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}
