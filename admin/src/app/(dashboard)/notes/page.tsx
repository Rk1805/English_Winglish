"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser, type Note, type Topic } from "@/lib/supabase";
import {
  ActiveBadge,
  inputCls,
  PageHeader,
  primaryBtn,
  secondaryBtn,
  Table,
} from "@/components/form-controls";

const EMPTY = { title_en: "", title_gu: "", topic_id: "", body_md: "", is_premium: false };

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const supabase = supabaseBrowser();
    const [{ data: noteRows }, { data: topicRows }] = await Promise.all([
      supabase.from("notes").select("*").order("sort_order").order("created_at"),
      supabase.from("topics").select("*").order("sort_order"),
    ]);
    setNotes(noteRows ?? []);
    setTopics(topicRows ?? []);
  }
  useEffect(() => {
    load();
  }, []);

  function startEdit(note?: Note) {
    setError(null);
    if (note) {
      setEditing(note.id);
      setForm({
        title_en: note.title_en,
        title_gu: note.title_gu ?? "",
        topic_id: note.topic_id ?? "",
        body_md: note.body_md,
        is_premium: note.is_premium,
      });
    } else {
      setEditing("new");
      setForm(EMPTY);
    }
  }

  async function save() {
    setError(null);
    const payload = {
      title_en: form.title_en.trim(),
      title_gu: form.title_gu.trim() || null,
      topic_id: form.topic_id || null,
      body_md: form.body_md,
      is_premium: form.is_premium,
    };
    const supabase = supabaseBrowser();
    const { error } =
      editing === "new"
        ? await supabase.from("notes").insert(payload)
        : await supabase.from("notes").update(payload).eq("id", editing!);
    if (error) return setError(error.message);
    setEditing(null);
    load();
  }

  async function remove(note: Note) {
    if (!confirm(`Delete note "${note.title_en}"?`)) return;
    await supabaseBrowser().from("notes").delete().eq("id", note.id);
    load();
  }

  return (
    <div>
      <PageHeader
        title="Notes"
        action={
          <button className={primaryBtn} onClick={() => startEdit()}>
            + Add Note
          </button>
        }
      />

      {editing !== null && (
        <div className="mb-4 space-y-3 rounded-xl bg-white p-4 shadow-sm">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <label className="text-sm font-medium text-slate-700">
              Title (English)
              <input className={inputCls} value={form.title_en}
                onChange={(e) => setForm({ ...form, title_en: e.target.value })} />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Title (ગુજરાતી)
              <input className={inputCls} value={form.title_gu}
                onChange={(e) => setForm({ ...form, title_gu: e.target.value })} />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Topic
              <select className={inputCls} value={form.topic_id}
                onChange={(e) => setForm({ ...form, topic_id: e.target.value })}>
                <option value="">— none —</option>
                {topics.map((t) => <option key={t.id} value={t.id}>{t.name_en}</option>)}
              </select>
            </label>
            <label className="mt-6 flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={form.is_premium}
                onChange={(e) => setForm({ ...form, is_premium: e.target.checked })} />
              Premium only
            </label>
          </div>
          <label className="block text-sm font-medium text-slate-700">
            Content (Markdown supported — headings with #, lists with -, **bold**)
            <textarea rows={10} className={inputCls + " font-mono"} value={form.body_md}
              onChange={(e) => setForm({ ...form, body_md: e.target.value })} />
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button className={primaryBtn} onClick={save} disabled={!form.title_en.trim()}>
              Save Note
            </button>
            <button className={secondaryBtn} onClick={() => setEditing(null)}>Cancel</button>
          </div>
        </div>
      )}

      <Table headers={["Title", "Topic", "Premium", "Status", ""]} empty={notes.length === 0}>
        {notes.map((note) => (
          <tr key={note.id} className="border-b border-slate-100">
            <td className="px-4 py-3 font-medium">
              {note.title_en}
              {note.title_gu && <span className="ml-2 text-slate-500">{note.title_gu}</span>}
            </td>
            <td className="px-4 py-3">{topics.find((t) => t.id === note.topic_id)?.name_en ?? "—"}</td>
            <td className="px-4 py-3">{note.is_premium ? "Yes" : "No"}</td>
            <td className="px-4 py-3"><ActiveBadge active={note.is_active} /></td>
            <td className="px-4 py-3 text-right whitespace-nowrap">
              <button className="mr-3 text-blue-600 hover:underline" onClick={() => startEdit(note)}>
                Edit
              </button>
              <button className="text-red-600 hover:underline" onClick={() => remove(note)}>
                Delete
              </button>
            </td>
          </tr>
        ))}
      </Table>
    </div>
  );
}
