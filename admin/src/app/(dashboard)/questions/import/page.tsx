"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import * as XLSX from "xlsx";
import { supabaseBrowser, type Exam, type Topic } from "@/lib/supabase";
import { PageHeader, primaryBtn, secondaryBtn } from "@/components/form-controls";

/**
 * Bulk question import from Excel/CSV.
 * Template columns (only question_en, options a-d and correct are required):
 * question_en | option_a | option_b | option_c | option_d | correct | explanation
 * | question_gu | option_a_gu | option_b_gu | option_c_gu | option_d_gu | explanation_gu
 * | topic | exam | year | difficulty | premium
 */

type ParsedRow = {
  rowNumber: number;
  errors: string[];
  payload: Record<string, unknown> | null;
  preview: string;
};

const TEMPLATE_HEADERS = [
  "question_en", "option_a", "option_b", "option_c", "option_d", "correct",
  "explanation", "question_gu", "option_a_gu", "option_b_gu", "option_c_gu",
  "option_d_gu", "explanation_gu", "topic", "exam", "year", "difficulty", "premium",
];

const EXAMPLE_ROWS = [
  {
    question_en: 'Choose the synonym of "Rapid":',
    option_a: "Slow", option_b: "Fast", option_c: "Lazy", option_d: "Weak",
    correct: "B",
    explanation: "Rapid means very fast.",
    question_gu: '"Rapid" નો સમાનાર્થી પસંદ કરો:',
    option_a_gu: "", option_b_gu: "", option_c_gu: "", option_d_gu: "",
    explanation_gu: "Rapid એટલે ખૂબ ઝડપી.",
    topic: "Synonyms", exam: "GSSSB", year: 2023, difficulty: "easy", premium: "no",
  },
  {
    question_en: "She ______ TV when I called her.",
    option_a: "watches", option_b: "watched", option_c: "was watching", option_d: "is watching",
    correct: "C",
    explanation: "Past continuous for an action in progress at a past moment.",
    question_gu: "", option_a_gu: "", option_b_gu: "", option_c_gu: "", option_d_gu: "",
    explanation_gu: "",
    topic: "Tenses", exam: "", year: "", difficulty: "medium", premium: "no",
  },
];

function normalizeHeader(header: string): string {
  return header.trim().toLowerCase().replace(/\s+/g, "_");
}

function parseCorrect(value: unknown): number | null {
  const s = String(value ?? "").trim().toUpperCase();
  if (["A", "B", "C", "D"].includes(s)) return s.charCodeAt(0) - 65;
  if (["1", "2", "3", "4"].includes(s)) return Number(s) - 1;
  return null;
}

export default function ImportQuestionsPage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [done, setDone] = useState<{ inserted: number; failed: number } | null>(null);
  const [fatal, setFatal] = useState<string | null>(null);

  function downloadTemplate() {
    const sheet = XLSX.utils.json_to_sheet(EXAMPLE_ROWS, { header: TEMPLATE_HEADERS });
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, "Questions");
    XLSX.writeFile(book, "english-winglish-questions-template.xlsx");
  }

  async function handleFile(file: File) {
    setFatal(null);
    setDone(null);
    setRows([]);
    setFileName(file.name);

    const supabase = supabaseBrowser();
    const [{ data: topics }, { data: exams }] = await Promise.all([
      supabase.from("topics").select("*"),
      supabase.from("exams").select("*"),
    ]);
    const topicByName = new Map(
      (topics ?? []).map((t: Topic) => [t.name_en.trim().toLowerCase(), t.id])
    );
    const examByName = new Map<string, string>();
    for (const exam of (exams ?? []) as Exam[]) {
      examByName.set(exam.name_en.trim().toLowerCase(), exam.id);
      examByName.set(exam.slug.trim().toLowerCase(), exam.id);
    }

    let raw: Record<string, unknown>[];
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
    } catch (err) {
      setFatal(`Could not read the file: ${err instanceof Error ? err.message : err}`);
      return;
    }
    if (raw.length === 0) {
      setFatal("The file has no data rows.");
      return;
    }

    const parsed: ParsedRow[] = raw.map((originalRow, i) => {
      const row: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(originalRow)) row[normalizeHeader(key)] = value;

      const errors: string[] = [];
      const text = (key: string) => String(row[key] ?? "").trim();

      const question_en = text("question_en") || text("question");
      if (!question_en) errors.push("question_en missing");

      const options = ["option_a", "option_b", "option_c", "option_d"].map(text);
      if (options.some((o) => !o)) errors.push("all 4 options (a-d) required");

      const correct_index = parseCorrect(row["correct"] ?? row["answer"]);
      if (correct_index === null) errors.push("correct must be A/B/C/D or 1-4");

      const topicName = text("topic").toLowerCase();
      const examName = text("exam").toLowerCase();
      const topic_id = topicName ? topicByName.get(topicName) : undefined;
      const exam_id = examName ? examByName.get(examName) : undefined;
      if (topicName && !topic_id) errors.push(`unknown topic "${text("topic")}"`);
      if (examName && !exam_id) errors.push(`unknown exam "${text("exam")}"`);
      if (!topic_id && !exam_id) errors.push("need a topic or an exam (or both)");

      const difficultyRaw = text("difficulty").toLowerCase() || "medium";
      const difficulty = ["easy", "medium", "hard"].includes(difficultyRaw) ? difficultyRaw : null;
      if (!difficulty) errors.push("difficulty must be easy/medium/hard");

      const yearText = text("year");
      const year = yearText ? Number(yearText) : null;
      if (yearText && (!Number.isInteger(year) || year! < 1990 || year! > 2100))
        errors.push("year must be 1990-2100");

      const optionsGu = ["option_a_gu", "option_b_gu", "option_c_gu", "option_d_gu"].map(text);
      const hasGuOptions = optionsGu.every((o) => o);

      return {
        rowNumber: i + 2, // header is row 1 in the sheet
        errors,
        preview: question_en || "(empty)",
        payload:
          errors.length > 0
            ? null
            : {
                question_en,
                question_gu: text("question_gu") || null,
                options_en: options,
                options_gu: hasGuOptions ? optionsGu : null,
                correct_index,
                explanation_en: text("explanation") || text("explanation_en") || null,
                explanation_gu: text("explanation_gu") || null,
                topic_id: topic_id ?? null,
                exam_id: exam_id ?? null,
                year,
                difficulty,
                is_premium: ["yes", "true", "1"].includes(text("premium").toLowerCase()),
              },
      };
    });
    setRows(parsed);
  }

  async function runImport() {
    const valid = rows.filter((r) => r.payload).map((r) => r.payload!);
    if (valid.length === 0) return;
    setImporting(true);
    const supabase = supabaseBrowser();
    let inserted = 0;
    let failed = 0;
    for (let i = 0; i < valid.length; i += 100) {
      const batch = valid.slice(i, i + 100);
      const { error } = await supabase.from("questions").insert(batch);
      if (error) failed += batch.length;
      else inserted += batch.length;
    }
    setImporting(false);
    setDone({ inserted, failed });
    setRows([]);
  }

  const validCount = rows.filter((r) => r.payload).length;
  const invalidRows = rows.filter((r) => !r.payload);

  return (
    <div>
      <PageHeader
        title="Import Questions from Excel"
        action={
          <Link href="/questions" className={secondaryBtn}>
            ← Back to Questions
          </Link>
        }
      />

      <div className="mb-4 space-y-3 rounded-xl bg-white p-5 shadow-sm">
        <p className="text-sm text-slate-900">
          <b>Step 1:</b> Download the template, fill one question per row (Excel or Google
          Sheets → save as .xlsx or .csv). Required: question, 4 options, correct answer
          (A/B/C/D), and a topic or exam name exactly as it appears in the admin panel.
          Gujarati columns are optional.
        </p>
        <button className={secondaryBtn} onClick={downloadTemplate}>
          ⬇ Download template (.xlsx)
        </button>
        <p className="text-sm text-slate-900">
          <b>Step 2:</b> Upload the filled file — you get a preview with any mistakes before
          anything is saved.
        </p>
        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          className="text-sm"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
        {fatal && <p className="text-sm text-red-600">{fatal}</p>}
        {done && (
          <p className="text-sm font-medium text-green-700">
            ✓ Imported {done.inserted} questions{done.failed > 0 && `, ${done.failed} failed`}.{" "}
            <Link href="/questions" className="underline">View them</Link>
          </p>
        )}
      </div>

      {rows.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm">
            <p className="text-sm">
              <b>{fileName}</b>: {rows.length} rows —{" "}
              <span className="font-medium text-green-700">{validCount} ready</span>
              {invalidRows.length > 0 && (
                <span className="font-medium text-red-600">, {invalidRows.length} with errors (skipped)</span>
              )}
            </p>
            <button className={primaryBtn} onClick={runImport} disabled={importing || validCount === 0}>
              {importing ? "Importing…" : `Import ${validCount} questions`}
            </button>
          </div>

          {invalidRows.length > 0 && (
            <div className="rounded-xl bg-white p-4 shadow-sm">
              <p className="mb-2 text-sm font-semibold text-red-700">Rows with errors (fix in the file and re-upload):</p>
              <ul className="space-y-1 text-sm text-slate-900">
                {invalidRows.slice(0, 30).map((row) => (
                  <li key={row.rowNumber}>
                    <b>Row {row.rowNumber}</b> — {row.errors.join("; ")}{" "}
                    <span className="text-slate-900">({row.preview.slice(0, 60)})</span>
                  </li>
                ))}
                {invalidRows.length > 30 && (
                  <li className="text-slate-900">…and {invalidRows.length - 30} more</li>
                )}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
