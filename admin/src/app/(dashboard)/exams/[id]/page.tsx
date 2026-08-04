"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { supabaseBrowser, type Category, type Exam, type Paper, type Topic } from "@/lib/supabase";
import { inputCls, PageHeader, primaryBtn, secondaryBtn } from "@/components/form-controls";

/**
 * Assign topics to an exam, and optionally split PYQ practice into papers
 * (e.g. GPSC has Paper-1 / Paper-2). Papers are optional — an exam with none
 * shows a single "All Questions (PYQ)" card in the app instead.
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

  const [papers, setPapers] = useState<Paper[]>([]);
  const [paperForm, setPaperForm] = useState({ name_en: "", name_gu: "" });
  const [paperError, setPaperError] = useState<string | null>(null);

  async function loadPapers() {
    const { data, error } = await supabaseBrowser()
      .from("papers")
      .select("*")
      .eq("exam_id", examId)
      .order("sort_order");
    if (error) {
      setPaperError(
        error.message.includes("papers")
          ? "Papers table missing — run supabase/migrations/0006_exam_papers.sql in the SQL Editor first."
          : error.message
      );
      return;
    }
    setPapers(data ?? []);
  }

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
    loadPapers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examId]);

  async function addPaper() {
    setPaperError(null);
    const name = paperForm.name_en.trim();
    if (!name) return;
    const { error } = await supabaseBrowser().from("papers").insert({
      exam_id: examId,
      name_en: name,
      name_gu: paperForm.name_gu.trim() || null,
      sort_order: papers.length,
    });
    if (error) return setPaperError(error.message);
    setPaperForm({ name_en: "", name_gu: "" });
    loadPapers();
  }

  async function removePaper(paper: Paper) {
    if (!confirm(`Delete paper "${paper.name_en}"? Questions keep their tags but this paper disappears from the app.`))
      return;
    await supabaseBrowser().from("papers").delete().eq("id", paper.id);
    loadPapers();
  }

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
        title={exam ? `${exam.name_en} — Setup` : "Exam Setup"}
        action={<Link href="/exams" className={secondaryBtn}>← Back</Link>}
      />

      <div className="mb-6 rounded-xl bg-white p-4 shadow-sm">
        <h2 className="mb-1 font-semibold text-slate-800">Papers (optional)</h2>
        <p className="mb-3 text-sm text-slate-900">
          Only needed if this exam is split into papers (e.g. GPSC Paper-1 / Paper-2). Leave empty
          and students get a single &quot;All Questions (PYQ)&quot; button instead. Tag each question
          to a paper from the question form.
        </p>
        {paperError && <p className="mb-3 text-sm text-red-600">{paperError}</p>}

        {papers.length > 0 && (
          <ul className="mb-3 space-y-2">
            {papers.map((paper) => (
              <li key={paper.id} className="flex items-center gap-3 rounded-md border border-slate-200 px-3 py-2 text-sm">
                <span className="flex-1 font-medium text-slate-900">
                  {paper.name_en}
                  {paper.name_gu && <span className="ml-2 text-slate-500">{paper.name_gu}</span>}
                </span>
                <button className="text-red-600 hover:underline" onClick={() => removePaper(paper)}>
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="flex flex-wrap items-end gap-3">
          <label className="text-sm font-medium text-slate-900">
            Paper name (English)
            <input className={inputCls} placeholder="Paper-1" value={paperForm.name_en}
              onChange={(e) => setPaperForm({ ...paperForm, name_en: e.target.value })} />
          </label>
          <label className="text-sm font-medium text-slate-900">
            Paper name (ગુજરાતી)
            <input className={inputCls} placeholder="પેપર-1" value={paperForm.name_gu}
              onChange={(e) => setPaperForm({ ...paperForm, name_gu: e.target.value })} />
          </label>
          <button className={primaryBtn} onClick={addPaper} disabled={!paperForm.name_en.trim()}>
            + Add Paper
          </button>
        </div>
      </div>

      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-semibold text-slate-800">Topics inside this exam</h2>
        <div className="flex items-center gap-3">
          {savedMsg && <span className="text-sm font-medium text-green-600">Saved ✓</span>}
          <span className="text-sm text-slate-900">{selected.size} selected</span>
          <button className={primaryBtn} onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

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
