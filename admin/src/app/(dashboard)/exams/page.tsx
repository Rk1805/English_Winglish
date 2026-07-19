"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser, type Exam } from "@/lib/supabase";
import {
  ActiveBadge,
  inputCls,
  PageHeader,
  primaryBtn,
  secondaryBtn,
  Table,
} from "@/components/form-controls";

const EMPTY = { slug: "", name_en: "", name_gu: "", sort_order: 0, is_active: true };

export default function ExamsPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const { data } = await supabaseBrowser().from("exams").select("*").order("sort_order");
    setExams(data ?? []);
  }
  useEffect(() => {
    load();
  }, []);

  function startEdit(exam?: Exam) {
    setError(null);
    if (exam) {
      setEditing(exam.id);
      setForm({
        slug: exam.slug,
        name_en: exam.name_en,
        name_gu: exam.name_gu ?? "",
        sort_order: exam.sort_order,
        is_active: exam.is_active,
      });
    } else {
      setEditing("new");
      setForm({ ...EMPTY, sort_order: (exams.at(-1)?.sort_order ?? 0) + 1 });
    }
  }

  async function save() {
    setError(null);
    const payload = {
      ...form,
      slug: form.slug.trim() || form.name_en.trim().toLowerCase().replace(/\s+/g, "-"),
      name_gu: form.name_gu.trim() || null,
    };
    const supabase = supabaseBrowser();
    const { error } =
      editing === "new"
        ? await supabase.from("exams").insert(payload)
        : await supabase.from("exams").update(payload).eq("id", editing!);
    if (error) return setError(error.message);
    setEditing(null);
    load();
  }

  async function remove(exam: Exam) {
    if (!confirm(`Delete exam "${exam.name_en}"? Its PYQ questions stay but lose the exam tag.`))
      return;
    await supabaseBrowser().from("exams").delete().eq("id", exam.id);
    load();
  }

  return (
    <div>
      <PageHeader
        title="Exams"
        action={
          <button className={primaryBtn} onClick={() => startEdit()}>
            + Add Exam
          </button>
        }
      />

      {editing !== null && (
        <div className="mb-4 grid grid-cols-2 items-end gap-3 rounded-xl bg-white p-4 shadow-sm lg:grid-cols-6">
          <label className="text-sm font-medium text-slate-700 lg:col-span-2">
            Name (English)
            <input className={inputCls} value={form.name_en}
              onChange={(e) => setForm({ ...form, name_en: e.target.value })} />
          </label>
          <label className="text-sm font-medium text-slate-700 lg:col-span-2">
            Name (ગુજરાતી)
            <input className={inputCls} value={form.name_gu}
              onChange={(e) => setForm({ ...form, name_gu: e.target.value })} />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Order
            <input type="number" className={inputCls} value={form.sort_order}
              onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} />
          </label>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={form.is_active}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
              Active
            </label>
            <button className={primaryBtn} onClick={save} disabled={!form.name_en.trim()}>
              Save
            </button>
            <button className={secondaryBtn} onClick={() => setEditing(null)}>
              Cancel
            </button>
          </div>
          {error && <p className="col-span-full text-sm text-red-600">{error}</p>}
        </div>
      )}

      <Table headers={["Name", "ગુજરાતી", "Order", "Status", ""]} empty={exams.length === 0}>
        {exams.map((exam) => (
          <tr key={exam.id} className="border-b border-slate-100">
            <td className="px-4 py-3 font-medium">{exam.name_en}</td>
            <td className="px-4 py-3">{exam.name_gu ?? "—"}</td>
            <td className="px-4 py-3">{exam.sort_order}</td>
            <td className="px-4 py-3"><ActiveBadge active={exam.is_active} /></td>
            <td className="px-4 py-3 text-right whitespace-nowrap">
              <button className="mr-3 text-blue-600 hover:underline" onClick={() => startEdit(exam)}>
                Edit
              </button>
              <button className="text-red-600 hover:underline" onClick={() => remove(exam)}>
                Delete
              </button>
            </td>
          </tr>
        ))}
      </Table>
    </div>
  );
}
