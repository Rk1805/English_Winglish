"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser, type Chapter, type Exam, type Standard, type Topic, type Video } from "@/lib/supabase";
import {
  ActiveBadge,
  inputCls,
  PageHeader,
  primaryBtn,
  secondaryBtn,
  Table,
} from "@/components/form-controls";

/** Accepts a full YouTube URL or a bare video id and returns the id. */
function parseYoutubeId(input: string): string {
  const trimmed = input.trim();
  const match =
    trimmed.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{6,})/) ??
    trimmed.match(/^([\w-]{6,})$/);
  return match?.[1] ?? "";
}

const EMPTY = {
  title_en: "",
  title_gu: "",
  topic_id: "",
  exam_id: "",
  chapter_id: "",
  youtube: "",
  is_premium: false,
  is_active: true,
  video_category: "" as "" | "explanation" | "self_study" | "gala" | "grammar",
};

const CATEGORY_LABEL: Record<string, string> = {
  explanation: "Explanation",
  self_study: "Self-Study Notebook",
  gala: "Gala",
  grammar: "Grammar",
};

export default function VideosPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [standards, setStandards] = useState<Standard[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const supabase = supabaseBrowser();
    const [
      { data: videoRows },
      { data: topicRows },
      { data: examRows },
      { data: stdRows },
      { data: chapRows, error: chapError },
    ] = await Promise.all([
      supabase.from("videos").select("*").order("sort_order").order("created_at"),
      supabase.from("topics").select("*").order("sort_order"),
      supabase.from("exams").select("*").order("sort_order"),
      supabase.from("standards").select("*").order("sort_order"),
      supabase.from("chapters").select("*").order("sort_order"),
    ]);
    setVideos(videoRows ?? []);
    setTopics(topicRows ?? []);
    setExams(examRows ?? []);
    setStandards(stdRows ?? []);
    if (chapError) {
      setError(
        chapError.message.includes("chapters")
          ? "Chapters table missing — run supabase/migrations/0010_standards_and_chapters.sql in the SQL Editor first."
          : chapError.message
      );
    } else {
      setChapters(chapRows ?? []);
    }
  }

  function chapterLabel(chapter: Chapter) {
    const std = standards.find((s) => s.id === chapter.standard_id);
    const sem = chapter.semester === "sem1" ? "Sem-I" : "Sem-II";
    return `Std ${std?.number ?? "?"} ${sem}: ${chapter.name_en}`;
  }
  useEffect(() => {
    load();
  }, []);

  function startEdit(video?: Video) {
    setError(null);
    if (video) {
      setEditing(video.id);
      setForm({
        title_en: video.title_en,
        title_gu: video.title_gu ?? "",
        topic_id: video.topic_id ?? "",
        exam_id: video.exam_id ?? "",
        chapter_id: video.chapter_id ?? "",
        youtube: video.youtube_id,
        is_premium: video.is_premium,
        is_active: video.is_active,
        video_category: video.video_category ?? "",
      });
    } else {
      setEditing("new");
      setForm(EMPTY);
    }
  }

  async function save() {
    setError(null);
    const youtubeId = parseYoutubeId(form.youtube);
    if (!youtubeId) return setError("Paste a valid YouTube link or video id.");
    const payload = {
      title_en: form.title_en.trim(),
      title_gu: form.title_gu.trim() || null,
      topic_id: form.topic_id || null,
      exam_id: form.exam_id || null,
      chapter_id: form.chapter_id || null,
      youtube_id: youtubeId,
      is_premium: form.is_premium,
      is_active: form.is_active,
      video_category: form.video_category || null,
    };
    const supabase = supabaseBrowser();
    const { error } =
      editing === "new"
        ? await supabase.from("videos").insert(payload)
        : await supabase.from("videos").update(payload).eq("id", editing!);
    if (error) return setError(error.message);
    setEditing(null);
    setForm(EMPTY);
    load();
  }

  async function remove(video: Video) {
    if (!confirm(`Delete video "${video.title_en}"?`)) return;
    await supabaseBrowser().from("videos").delete().eq("id", video.id);
    load();
  }

  return (
    <div>
      <PageHeader
        title="Videos"
        action={
          <button className={primaryBtn} onClick={() => startEdit()}>
            + Add Video
          </button>
        }
      />

      {error && editing === null && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {editing !== null && (
        <div className="mb-4 grid grid-cols-2 items-end gap-3 rounded-xl bg-white p-4 shadow-sm lg:grid-cols-6">
          <label className="text-sm font-medium text-slate-900 lg:col-span-2">
            YouTube link
            <input className={inputCls} value={form.youtube} placeholder="https://youtube.com/watch?v=…"
              onChange={(e) => setForm({ ...form, youtube: e.target.value })} />
          </label>
          <label className="text-sm font-medium text-slate-900">
            Title (English)
            <input className={inputCls} value={form.title_en}
              onChange={(e) => setForm({ ...form, title_en: e.target.value })} />
          </label>
          <label className="text-sm font-medium text-slate-900">
            Title (ગુજરાતી)
            <input className={inputCls} value={form.title_gu}
              onChange={(e) => setForm({ ...form, title_gu: e.target.value })} />
          </label>
          <label className="text-sm font-medium text-slate-900">
            Topic (grammar)
            <select className={inputCls} value={form.topic_id}
              onChange={(e) => setForm({ ...form, topic_id: e.target.value })}>
              <option value="">— none —</option>
              {topics.map((t) => <option key={t.id} value={t.id}>{t.name_en}</option>)}
            </select>
          </label>
          <label className="text-sm font-medium text-slate-900">
            Exam (PYQ)
            <select className={inputCls} value={form.exam_id}
              onChange={(e) => setForm({ ...form, exam_id: e.target.value })}>
              <option value="">— none —</option>
              {exams.map((x) => <option key={x.id} value={x.id}>{x.name_en}</option>)}
            </select>
          </label>
          <label className="text-sm font-medium text-slate-900">
            Chapter (Textbook)
            <select className={inputCls} value={form.chapter_id}
              onChange={(e) => setForm({ ...form, chapter_id: e.target.value })}>
              <option value="">— none —</option>
              {chapters.map((c) => <option key={c.id} value={c.id}>{chapterLabel(c)}</option>)}
            </select>
          </label>
          <label className="text-sm font-medium text-slate-900">
            Video category
            <select className={inputCls} value={form.video_category}
              onChange={(e) => setForm({ ...form, video_category: e.target.value as typeof form.video_category })}>
              <option value="">— none —</option>
              <option value="explanation">Explanation</option>
              <option value="self_study">Self-Study Notebook</option>
              <option value="gala">Gala</option>
              <option value="grammar">Grammar</option>
            </select>
          </label>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-1 text-sm text-slate-900">
              <input type="checkbox" checked={form.is_premium}
                onChange={(e) => setForm({ ...form, is_premium: e.target.checked })} />
              Premium
            </label>
            <label className="flex items-center gap-1 text-sm text-slate-900">
              <input type="checkbox" checked={form.is_active}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
              Active
            </label>
          </div>
          <div className="flex items-center gap-2">
            <button className={primaryBtn} onClick={save} disabled={!form.title_en.trim()}>
              {editing === "new" ? "Add" : "Save"}
            </button>
            <button className={secondaryBtn} onClick={() => { setEditing(null); setForm(EMPTY); }}>
              Cancel
            </button>
          </div>
          {error && <p className="col-span-full text-sm text-red-600">{error}</p>}
        </div>
      )}

      <Table headers={["Title", "Video", "Topic", "Chapter", "Category", "Premium", "Status", ""]} empty={videos.length === 0}>
        {videos.map((video) => (
          <tr key={video.id} className="border-b border-slate-100">
            <td className="px-4 py-3 font-medium">
              {video.title_en}
              {video.title_gu && <span className="ml-2 text-slate-900">{video.title_gu}</span>}
            </td>
            <td className="px-4 py-3">
              <a href={`https://youtube.com/watch?v=${video.youtube_id}`} target="_blank" rel="noreferrer"
                className="text-blue-700 hover:underline">
                ▶ {video.youtube_id}
              </a>
            </td>
            <td className="px-4 py-3">{topics.find((t) => t.id === video.topic_id)?.name_en ?? "—"}</td>
            <td className="px-4 py-3">
              {(() => {
                const chapter = chapters.find((c) => c.id === video.chapter_id);
                return chapter ? chapterLabel(chapter) : "—";
              })()}
            </td>
            <td className="px-4 py-3">{video.video_category ? CATEGORY_LABEL[video.video_category] : "—"}</td>
            <td className="px-4 py-3">{video.is_premium ? "Yes" : "No"}</td>
            <td className="px-4 py-3"><ActiveBadge active={video.is_active} /></td>
            <td className="px-4 py-3 text-right whitespace-nowrap">
              <button className="mr-3 text-blue-600 hover:underline" onClick={() => startEdit(video)}>
                Edit
              </button>
              <button className="text-red-600 hover:underline" onClick={() => remove(video)}>
                Delete
              </button>
            </td>
          </tr>
        ))}
      </Table>
    </div>
  );
}
