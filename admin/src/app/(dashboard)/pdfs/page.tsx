"use client";

import { useEffect, useRef, useState } from "react";
import { supabaseBrowser, type Exam, type Pdf, type Topic } from "@/lib/supabase";
import {
  ActiveBadge,
  inputCls,
  PageHeader,
  primaryBtn,
  secondaryBtn,
  Table,
} from "@/components/form-controls";

export default function PdfsPage() {
  const [pdfs, setPdfs] = useState<Pdf[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ title_en: "", title_gu: "", topic_id: "", exam_id: "", is_premium: false });
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const supabase = supabaseBrowser();
    const [{ data: pdfRows }, { data: topicRows }, { data: examRows }] = await Promise.all([
      supabase.from("pdfs").select("*").order("sort_order").order("created_at"),
      supabase.from("topics").select("*").order("sort_order"),
      supabase.from("exams").select("*").order("sort_order"),
    ]);
    setPdfs(pdfRows ?? []);
    setTopics(topicRows ?? []);
    setExams(examRows ?? []);
  }
  useEffect(() => {
    load();
  }, []);

  function publicUrl(path: string) {
    return supabaseBrowser().storage.from("pdfs").getPublicUrl(path).data.publicUrl;
  }

  async function upload() {
    const file = fileRef.current?.files?.[0];
    if (!file) return setError("Choose a PDF file first.");
    setError(null);
    setBusy(true);
    const supabase = supabaseBrowser();
    const path = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`;
    const { error: uploadError } = await supabase.storage.from("pdfs").upload(path, file, {
      contentType: "application/pdf",
    });
    if (uploadError) {
      setBusy(false);
      return setError(
        uploadError.message.includes("Bucket not found")
          ? 'Storage bucket missing — run supabase/migrations/0002_storage.sql in the SQL Editor first.'
          : uploadError.message
      );
    }
    const { error: insertError } = await supabase.from("pdfs").insert({
      title_en: form.title_en.trim() || file.name.replace(/\.pdf$/i, ""),
      title_gu: form.title_gu.trim() || null,
      topic_id: form.topic_id || null,
      exam_id: form.exam_id || null,
      storage_path: path,
      is_premium: form.is_premium,
    });
    setBusy(false);
    if (insertError) return setError(insertError.message);
    setAdding(false);
    setForm({ title_en: "", title_gu: "", topic_id: "", exam_id: "", is_premium: false });
    load();
  }

  async function remove(pdf: Pdf) {
    if (!confirm(`Delete PDF "${pdf.title_en}"?`)) return;
    const supabase = supabaseBrowser();
    await supabase.storage.from("pdfs").remove([pdf.storage_path]);
    await supabase.from("pdfs").delete().eq("id", pdf.id);
    load();
  }

  return (
    <div>
      <PageHeader
        title="PDFs"
        action={
          <button className={primaryBtn} onClick={() => setAdding(true)}>
            + Upload PDF
          </button>
        }
      />

      {adding && (
        <div className="mb-4 grid grid-cols-2 items-end gap-3 rounded-xl bg-white p-4 shadow-sm lg:grid-cols-6">
          <label className="text-sm font-medium text-slate-700">
            PDF file
            <input ref={fileRef} type="file" accept="application/pdf" className={inputCls} />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Title (English)
            <input className={inputCls} value={form.title_en} placeholder="defaults to file name"
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
          <label className="text-sm font-medium text-slate-700">
            Exam
            <select className={inputCls} value={form.exam_id}
              onChange={(e) => setForm({ ...form, exam_id: e.target.value })}>
              <option value="">— none —</option>
              {exams.map((x) => <option key={x.id} value={x.id}>{x.name_en}</option>)}
            </select>
          </label>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1 text-sm text-slate-700">
              <input type="checkbox" checked={form.is_premium}
                onChange={(e) => setForm({ ...form, is_premium: e.target.checked })} />
              Premium
            </label>
            <button className={primaryBtn} onClick={upload} disabled={busy}>
              {busy ? "Uploading…" : "Upload"}
            </button>
            <button className={secondaryBtn} onClick={() => setAdding(false)}>Cancel</button>
          </div>
          {error && <p className="col-span-full text-sm text-red-600">{error}</p>}
        </div>
      )}

      <Table headers={["Title", "Topic / Exam", "Premium", "Status", ""]} empty={pdfs.length === 0}>
        {pdfs.map((pdf) => (
          <tr key={pdf.id} className="border-b border-slate-100">
            <td className="px-4 py-3 font-medium">
              <a href={publicUrl(pdf.storage_path)} target="_blank" rel="noreferrer"
                className="text-blue-700 hover:underline">
                {pdf.title_en}
              </a>
              {pdf.title_gu && <span className="ml-2 text-slate-500">{pdf.title_gu}</span>}
            </td>
            <td className="px-4 py-3">
              {topics.find((t) => t.id === pdf.topic_id)?.name_en ??
                exams.find((x) => x.id === pdf.exam_id)?.name_en ??
                "—"}
            </td>
            <td className="px-4 py-3">{pdf.is_premium ? "Yes" : "No"}</td>
            <td className="px-4 py-3"><ActiveBadge active={pdf.is_active} /></td>
            <td className="px-4 py-3 text-right">
              <button className="text-red-600 hover:underline" onClick={() => remove(pdf)}>
                Delete
              </button>
            </td>
          </tr>
        ))}
      </Table>
    </div>
  );
}
