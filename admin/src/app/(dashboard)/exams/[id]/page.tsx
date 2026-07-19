"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { supabaseBrowser, type Category, type Exam, type Topic } from "@/lib/supabase";
import { PageHeader, primaryBtn, secondaryBtn } from "@/components/form-controls";

/**
 * Assign topics to an exam. Assigned topics appear as sections inside the
 * exam in the app, showing that topic's material + questions tagged with
 * both the topic and this exam.
 */
export default function ExamTopicsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: examId } = use(params);
  const [exam, setExam] = useState<Exam | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = supabaseBrowser();
    supabase.from("exams").select("*").eq("id", examId).single().then(({ data }) => setExam(data));
    supabase.from("categories").select("*").order("sort_order").then(({ data }) => setCategories(data ?? []));
    supabase.from("topics").select("*").order("sort_order").then(({ data }) => setTopics(data ?? []));
    supabase
      .from("exam_topics")
      .select("topic_id")
      .eq("exam_id", examId)
      .then(({ data, error }) => {
        if (error) {
          setError(
            error.message.includes("exam_topics")
              ? "Table missing — run supabase/migrations/0004_multi_exam_topics_leaderboard.sql in the SQL Editor first."
              : error.message
          );
          return;
        }
        setSelected(new Set((data ?? []).map((r) => r.topic_id)));
      });
  }, [examId]);

  function toggle(topicId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(topicId)) next.delete(topicId);
      else next.add(topicId);
      return next;
    });
  }

  async function save() {
    setSaving(true);
    setError(null);
    const supabase = supabaseBrowser();
    await supabase.from("exam_topics").delete().eq("exam_id", examId);
    const orderedTopicIds = topics.filter((t) => selected.has(t.id)).map((t) => t.id);
    if (orderedTopicIds.length > 0) {
      const { error } = await supabase.from("exam_topics").insert(
        orderedTopicIds.map((topic_id, i) => ({ exam_id: examId, topic_id, sort_order: i }))
      );
      if (error) {
        setSaving(false);
        return setError(error.message);
      }
    }
    setSaving(false);
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 2000);
  }

  return (
    <div>
      <PageHeader
        title={exam ? `Topics inside ${exam.name_en}` : "Exam Topics"}
        action={
          <div className="flex items-center gap-3">
            {savedMsg && <span className="text-sm font-medium text-green-600">Saved ✓</span>}
            <span className="text-sm text-slate-900">{selected.size} selected</span>
            <Link href="/exams" className={secondaryBtn}>← Back</Link>
            <button className={primaryBtn} onClick={save} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        }
      />

      <p className="mb-4 text-sm text-slate-900">
        Ticked topics appear as sections inside this exam in the app. Students see the topic&apos;s
        videos/PDFs/notes plus only the questions tagged with both the topic and this exam.
      </p>
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <div className="space-y-4">
        {categories.map((category) => {
          const catTopics = topics.filter((t) => t.category_id === category.id);
          if (catTopics.length === 0) return null;
          return (
            <div key={category.id} className="rounded-xl bg-white p-4 shadow-sm">
              <h2 className="mb-2 font-semibold text-slate-800">{category.name_en}</h2>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-3 lg:grid-cols-4">
                {catTopics.map((topic) => (
                  <label key={topic.id} className="flex items-center gap-2 text-sm text-slate-900">
                    <input
                      type="checkbox"
                      checked={selected.has(topic.id)}
                      onChange={() => toggle(topic.id)}
                    />
                    {topic.name_en}
                  </label>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
