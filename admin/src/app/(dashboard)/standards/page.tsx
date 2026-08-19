"use client";

import { useEffect, useRef, useState } from "react";
import { supabaseBrowser, type Chapter, type EducationLevel, type Standard } from "@/lib/supabase";
import {
  ActiveBadge,
  inputCls,
  PageHeader,
  primaryBtn,
  secondaryBtn,
} from "@/components/form-controls";

const LEVEL_LABEL: Record<EducationLevel, string> = {
  primary: "Primary",
  upper_primary: "Upper Primary",
  secondary: "Secondary",
  higher_secondary: "Higher Secondary",
};

type ChapterForm = {
  name_en: string;
  name_gu: string;
  semester: "sem1" | "sem2";
  is_active: boolean;
};

const EMPTY_CHAPTER: ChapterForm = { name_en: "", name_gu: "", semester: "sem1", is_active: true };

export default function StandardsPage() {
  const [standards, setStandards] = useState<Standard[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [chapterEditing, setChapterEditing] = useState<{ standardId: string; chapterId: string | "new" } | null>(null);
  const [chapterForm, setChapterForm] = useState<ChapterForm>(EMPTY_CHAPTER);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const supabase = supabaseBrowser();
    const [{ data: stdRows, error: stdError }, { data: chapRows }] = await Promise.all([
      supabase.from("standards").select("*").order("sort_order"),
      supabase.from("chapters").select("*").order("sort_order"),
    ]);
    if (stdError) {
      setError(
        stdError.message.includes("standards")
          ? "Tables missing — run supabase/migrations/0010_standards_and_chapters.sql in the SQL Editor first."
          : stdError.message
      );
      return;
    }
    setStandards(stdRows ?? []);
    setChapters(chapRows ?? []);
  }
  useEffect(() => {
    load();
  }, []);

  function publicUrl(path: string) {
    return supabaseBrowser().storage.from("pdfs").getPublicUrl(path).data.publicUrl;
  }

  async function saveChapter() {
    if (!chapterEditing) return;
    setError(null);
    setBusy(true);
    const supabase = supabaseBrowser();

    let pdf_storage_path: string | null | undefined = undefined;
    if (pendingFile) {
      const path = `chapters/${Date.now()}-${pendingFile.name.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`;
      const { error: uploadError } = await supabase.storage.from("pdfs").upload(path, pendingFile, {
        contentType: "application/pdf",
      });
      if (uploadError) {
        setBusy(false);
        setError(
          uploadError.message.includes("Bucket not found")
            ? "Storage bucket missing — run supabase/migrations/0002_storage.sql in the SQL Editor first."
            : uploadError.message
        );
        return;
      }
      pdf_storage_path = path;
    }

    const payload: Record<string, unknown> = {
      name_en: chapterForm.name_en.trim(),
      name_gu: chapterForm.name_gu.trim() || null,
      semester: chapterForm.semester,
      is_active: chapterForm.is_active,
      standard_id: chapterEditing.standardId,
    };
    if (pdf_storage_path !== undefined) payload.pdf_storage_path = pdf_storage_path;

    let error;
    if (chapterEditing.chapterId === "new") {
      const siblingCount = chapters.filter(
        (c) => c.standard_id === chapterEditing.standardId && c.semester === chapterForm.semester
      ).length;
      payload.sort_order = siblingCount;
      ({ error } = await supabase.from("chapters").insert(payload));
    } else {
      ({ error } = await supabase.from("chapters").update(payload).eq("id", chapterEditing.chapterId));
    }
    setBusy(false);
    if (error) return setError(error.message);
    setChapterEditing(null);
    setPendingFile(null);
    load();
  }

  async function removeChapter(chapter: Chapter) {
    if (!confirm(`Delete chapter "${chapter.name_en}"? Its videos/questions stay but lose the chapter tag.`))
      return;
    const supabase = supabaseBrowser();
    if (chapter.pdf_storage_path) await supabase.storage.from("pdfs").remove([chapter.pdf_storage_path]);
    await supabase.from("chapters").delete().eq("id", chapter.id);
    load();
  }

  async function moveChapter(standardId: string, semester: "sem1" | "sem2", chapterId: string, direction: -1 | 1) {
    const group = chapters
      .filter((c) => c.standard_id === standardId && c.semester === semester)
      .sort((a, b) => a.sort_order - b.sort_order);
    const index = group.findIndex((c) => c.id === chapterId);
    const swapIndex = index + direction;
    if (index === -1 || swapIndex < 0 || swapIndex >= group.length) return;
    [group[index], group[swapIndex]] = [group[swapIndex], group[index]];

    const supabase = supabaseBrowser();
    await Promise.all(group.map((c, i) => supabase.from("chapters").update({ sort_order: i }).eq("id", c.id)));
    load();
  }

  return (
    <div>
      <PageHeader title="Standards & Chapters" />
      <p className="mb-4 text-sm text-slate-900">
        Std 1-12 are fixed (seeded automatically). Add chapters under each standard &amp; semester —
        each chapter can have a Textbook PDF, and Videos/Questions can be tagged to it from their
        own pages.
      </p>
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <div className="space-y-3">
        {standards.map((standard) => {
          const stdChapters = chapters.filter((c) => c.standard_id === standard.id);
          const isOpen = open === standard.id;
          return (
            <div key={standard.id} className="rounded-xl bg-white shadow-sm">
              <button
                onClick={() => setOpen(isOpen ? null : standard.id)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left">
                <span className="text-slate-900">{isOpen ? "▾" : "▸"}</span>
                <span className="font-semibold text-slate-800">Std {standard.number}</span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-900">
                  {LEVEL_LABEL[standard.education_level]}
                </span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-900">
                  {stdChapters.length} chapters
                </span>
              </button>

              {isOpen && (
                <div className="border-t border-slate-100 px-4 py-3">
                  {(["sem1", "sem2"] as const).map((sem) => (
                    <div key={sem} className="mb-3">
                      <h3 className="mb-1 text-sm font-semibold text-slate-700">
                        {sem === "sem1" ? "Semester I" : "Semester II"}
                      </h3>
                      {stdChapters
                        .filter((c) => c.semester === sem)
                        .sort((a, b) => a.sort_order - b.sort_order)
                        .map((chapter, i, semChapters) => (
                          <div key={chapter.id} className="flex items-center gap-3 border-b border-slate-50 py-2">
                            <div className="flex flex-col">
                              <button
                                className="leading-none text-slate-500 hover:text-slate-900 disabled:opacity-25"
                                disabled={i === 0}
                                title="Move up"
                                onClick={() => moveChapter(standard.id, sem, chapter.id, -1)}>
                                ▲
                              </button>
                              <button
                                className="leading-none text-slate-500 hover:text-slate-900 disabled:opacity-25"
                                disabled={i === semChapters.length - 1}
                                title="Move down"
                                onClick={() => moveChapter(standard.id, sem, chapter.id, 1)}>
                                ▼
                              </button>
                            </div>
                            <span className="flex-1 text-sm">
                              {chapter.name_en}
                              {chapter.name_gu && <span className="ml-2 text-slate-900">{chapter.name_gu}</span>}
                            </span>
                            {chapter.pdf_storage_path ? (
                              <a href={publicUrl(chapter.pdf_storage_path)} target="_blank" rel="noreferrer"
                                className="text-xs text-blue-600 hover:underline">
                                PDF
                              </a>
                            ) : (
                              <span className="text-xs text-slate-400">no PDF</span>
                            )}
                            <ActiveBadge active={chapter.is_active} />
                            <button
                              className="text-sm text-blue-600 hover:underline"
                              onClick={() => {
                                setChapterEditing({ standardId: standard.id, chapterId: chapter.id });
                                setChapterForm({
                                  name_en: chapter.name_en,
                                  name_gu: chapter.name_gu ?? "",
                                  semester: chapter.semester,
                                  is_active: chapter.is_active,
                                });
                                setPendingFile(null);
                              }}>
                              Edit
                            </button>
                            <button className="text-sm text-red-600 hover:underline" onClick={() => removeChapter(chapter)}>
                              Delete
                            </button>
                          </div>
                        ))}
                    </div>
                  ))}

                  {chapterEditing?.standardId === standard.id ? (
                    <div className="mt-3 grid grid-cols-2 items-end gap-3 lg:grid-cols-6">
                      <label className="text-sm font-medium text-slate-900 lg:col-span-2">
                        Chapter (English)
                        <input className={inputCls} value={chapterForm.name_en}
                          onChange={(e) => setChapterForm({ ...chapterForm, name_en: e.target.value })} />
                      </label>
                      <label className="text-sm font-medium text-slate-900 lg:col-span-2">
                        Chapter (ગુજરાતી)
                        <input className={inputCls} value={chapterForm.name_gu}
                          onChange={(e) => setChapterForm({ ...chapterForm, name_gu: e.target.value })} />
                      </label>
                      <label className="text-sm font-medium text-slate-900">
                        Semester
                        <select className={inputCls} value={chapterForm.semester}
                          onChange={(e) => setChapterForm({ ...chapterForm, semester: e.target.value as ChapterForm["semester"] })}>
                          <option value="sem1">Sem-I</option>
                          <option value="sem2">Sem-II</option>
                        </select>
                      </label>
                      <label className="text-sm font-medium text-slate-900">
                        Textbook PDF
                        <input ref={fileRef} type="file" accept="application/pdf" className={inputCls}
                          onChange={(e) => setPendingFile(e.target.files?.[0] ?? null)} />
                      </label>
                      <label className="flex items-center gap-1 text-sm text-slate-900">
                        <input type="checkbox" checked={chapterForm.is_active}
                          onChange={(e) => setChapterForm({ ...chapterForm, is_active: e.target.checked })} />
                        Active
                      </label>
                      <div className="flex items-center gap-2 lg:col-span-2">
                        <button className={primaryBtn} onClick={saveChapter} disabled={!chapterForm.name_en.trim() || busy}>
                          {busy ? "Saving…" : "Save"}
                        </button>
                        <button className={secondaryBtn} onClick={() => { setChapterEditing(null); setPendingFile(null); }}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      className="mt-2 text-sm font-medium text-red-600 hover:underline"
                      onClick={() => {
                        setChapterEditing({ standardId: standard.id, chapterId: "new" });
                        setChapterForm(EMPTY_CHAPTER);
                        setPendingFile(null);
                      }}>
                      + Add chapter
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
