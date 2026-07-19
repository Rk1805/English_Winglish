"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser, type Exam, type Topic, type Video } from "@/lib/supabase";
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

const EMPTY = { title_en: "", title_gu: "", topic_id: "", exam_id: "", youtube: "", is_premium: false };

export default function VideosPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const supabase = supabaseBrowser();
    const [{ data: videoRows }, { data: topicRows }, { data: examRows }] = await Promise.all([
      supabase.from("videos").select("*").order("sort_order").order("created_at"),
      supabase.from("topics").select("*").order("sort_order"),
      supabase.from("exams").select("*").order("sort_order"),
    ]);
    setVideos(videoRows ?? []);
    setTopics(topicRows ?? []);
    setExams(examRows ?? []);
  }
  useEffect(() => {
    load();
  }, []);

  async function save() {
    setError(null);
    const youtubeId = parseYoutubeId(form.youtube);
    if (!youtubeId) return setError("Paste a valid YouTube link or video id.");
    const { error } = await supabaseBrowser().from("videos").insert({
      title_en: form.title_en.trim(),
      title_gu: form.title_gu.trim() || null,
      topic_id: form.topic_id || null,
      exam_id: form.exam_id || null,
      youtube_id: youtubeId,
      is_premium: form.is_premium,
    });
    if (error) return setError(error.message);
    setAdding(false);
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
          <button className={primaryBtn} onClick={() => setAdding(true)}>
            + Add Video
          </button>
        }
      />

      {adding && (
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
            Topic
            <select className={inputCls} value={form.topic_id}
              onChange={(e) => setForm({ ...form, topic_id: e.target.value })}>
              <option value="">— none —</option>
              {topics.map((t) => <option key={t.id} value={t.id}>{t.name_en}</option>)}
            </select>
          </label>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1 text-sm text-slate-900">
              <input type="checkbox" checked={form.is_premium}
                onChange={(e) => setForm({ ...form, is_premium: e.target.checked })} />
              Premium
            </label>
            <button className={primaryBtn} onClick={save} disabled={!form.title_en.trim()}>
              Add
            </button>
            <button className={secondaryBtn} onClick={() => setAdding(false)}>Cancel</button>
          </div>
          {error && <p className="col-span-full text-sm text-red-600">{error}</p>}
        </div>
      )}

      <Table headers={["Title", "Video", "Topic", "Premium", "Status", ""]} empty={videos.length === 0}>
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
            <td className="px-4 py-3">{video.is_premium ? "Yes" : "No"}</td>
            <td className="px-4 py-3"><ActiveBadge active={video.is_active} /></td>
            <td className="px-4 py-3 text-right">
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
