"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabaseBrowser, type Exam, type Test } from "@/lib/supabase";
import {
  ActiveBadge,
  inputCls,
  PageHeader,
  primaryBtn,
  secondaryBtn,
  Table,
} from "@/components/form-controls";

const EMPTY = { title_en: "", title_gu: "", exam_id: "", duration_minutes: 60, is_premium: false, is_active: true };

export default function TestsPage() {
  const [tests, setTests] = useState<Test[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const supabase = supabaseBrowser();
    const [{ data: testRows }, { data: examRows }, { data: links }] = await Promise.all([
      supabase.from("tests").select("*").order("sort_order").order("created_at"),
      supabase.from("exams").select("*").order("sort_order"),
      supabase.from("test_questions").select("test_id"),
    ]);
    setTests(testRows ?? []);
    setExams(examRows ?? []);
    const map: Record<string, number> = {};
    for (const row of links ?? []) map[row.test_id] = (map[row.test_id] ?? 0) + 1;
    setCounts(map);
  }
  useEffect(() => {
    load();
  }, []);

  async function create() {
    setError(null);
    const { error } = await supabaseBrowser().from("tests").insert({
      ...form,
      title_gu: form.title_gu.trim() || null,
      exam_id: form.exam_id || null,
    });
    if (error) return setError(error.message);
    setCreating(false);
    setForm(EMPTY);
    load();
  }

  async function remove(test: Test) {
    if (!confirm(`Delete mock test "${test.title_en}"?`)) return;
    await supabaseBrowser().from("tests").delete().eq("id", test.id);
    load();
  }

  return (
    <div>
      <PageHeader
        title="Mock Tests"
        action={
          <button className={primaryBtn} onClick={() => setCreating(true)}>
            + New Test
          </button>
        }
      />

      {creating && (
        <div className="mb-4 grid grid-cols-2 items-end gap-3 rounded-xl bg-white p-4 shadow-sm lg:grid-cols-6">
          <label className="text-sm font-medium text-slate-700 lg:col-span-2">
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
            Exam
            <select className={inputCls} value={form.exam_id}
              onChange={(e) => setForm({ ...form, exam_id: e.target.value })}>
              <option value="">— none —</option>
              {exams.map((x) => <option key={x.id} value={x.id}>{x.name_en}</option>)}
            </select>
          </label>
          <label className="text-sm font-medium text-slate-700">
            Minutes
            <input type="number" className={inputCls} value={form.duration_minutes}
              onChange={(e) => setForm({ ...form, duration_minutes: Number(e.target.value) })} />
          </label>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1 text-sm text-slate-700">
              <input type="checkbox" checked={form.is_premium}
                onChange={(e) => setForm({ ...form, is_premium: e.target.checked })} />
              Premium
            </label>
            <button className={primaryBtn} onClick={create} disabled={!form.title_en.trim()}>
              Create
            </button>
            <button className={secondaryBtn} onClick={() => setCreating(false)}>
              Cancel
            </button>
          </div>
          {error && <p className="col-span-full text-sm text-red-600">{error}</p>}
        </div>
      )}

      <Table
        headers={["Title", "Exam", "Questions", "Duration", "Premium", "Status", ""]}
        empty={tests.length === 0}>
        {tests.map((test) => (
          <tr key={test.id} className="border-b border-slate-100">
            <td className="px-4 py-3 font-medium">{test.title_en}</td>
            <td className="px-4 py-3">{exams.find((x) => x.id === test.exam_id)?.name_en ?? "—"}</td>
            <td className="px-4 py-3">{counts[test.id] ?? 0}</td>
            <td className="px-4 py-3">{test.duration_minutes} min</td>
            <td className="px-4 py-3">{test.is_premium ? "Yes" : "No"}</td>
            <td className="px-4 py-3"><ActiveBadge active={test.is_active} /></td>
            <td className="px-4 py-3 text-right whitespace-nowrap">
              <Link href={`/tests/${test.id}`} className="mr-3 text-blue-600 hover:underline">
                Manage
              </Link>
              <button className="text-red-600 hover:underline" onClick={() => remove(test)}>
                Delete
              </button>
            </td>
          </tr>
        ))}
      </Table>
    </div>
  );
}
