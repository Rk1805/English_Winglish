"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabaseBrowser, type GrammarQuestion, type Question, type QuestionReport } from "@/lib/supabase";
import { PageHeader, Table } from "@/components/form-controls";

export default function ReportsPage() {
  const [reports, setReports] = useState<QuestionReport[]>([]);
  const [questions, setQuestions] = useState<Record<string, Question>>({});
  const [grammarQuestions, setGrammarQuestions] = useState<Record<string, GrammarQuestion>>({});

  async function load() {
    const supabase = supabaseBrowser();
    const { data: reportRows } = await supabase
      .from("question_reports")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    setReports(reportRows ?? []);
    const ids = [...new Set((reportRows ?? []).map((r) => r.question_id))];
    if (ids.length > 0) {
      // A reported question can be from the main bank (topic/exam/chapter
      // tagged) or the separate Grammar Question Bank — check both.
      const [{ data: questionRows }, { data: grammarRows }] = await Promise.all([
        supabase.from("questions").select("*").in("id", ids),
        supabase.from("grammar_questions").select("*").in("id", ids),
      ]);
      setQuestions(Object.fromEntries((questionRows ?? []).map((q) => [q.id, q])));
      setGrammarQuestions(Object.fromEntries((grammarRows ?? []).map((q) => [q.id, q])));
    }
  }
  useEffect(() => {
    load();
  }, []);

  async function setStatus(report: QuestionReport, status: "resolved" | "rejected") {
    await supabaseBrowser().from("question_reports").update({ status }).eq("id", report.id);
    load();
  }

  return (
    <div>
      <PageHeader title="Question Reports" />
      <Table headers={["Question", "Complaint", "Status", "Date", ""]} empty={reports.length === 0}>
        {reports.map((report) => {
          const question = questions[report.question_id];
          const grammarQuestion = grammarQuestions[report.question_id];
          return (
            <tr key={report.id} className="border-b border-slate-100">
              <td className="max-w-sm px-4 py-3">
                {question ? (
                  <Link href={`/questions/${report.question_id}`} className="text-blue-700 hover:underline">
                    {question.question_en}
                  </Link>
                ) : grammarQuestion ? (
                  <>
                    <Link href="/grammar-mcqs" className="text-blue-700 hover:underline">
                      {grammarQuestion.question_en}
                    </Link>
                    <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-900">
                      Grammar Bank
                    </span>
                  </>
                ) : (
                  <span className="text-slate-900">(question deleted)</span>
                )}
              </td>
              <td className="max-w-md px-4 py-3">{report.message}</td>
              <td className="px-4 py-3">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    report.status === "open"
                      ? "bg-yellow-100 text-yellow-800"
                      : report.status === "resolved"
                        ? "bg-green-100 text-green-700"
                        : "bg-slate-100 text-slate-900"
                  }`}>
                  {report.status}
                </span>
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                {new Date(report.created_at).toLocaleDateString("en-IN")}
              </td>
              <td className="px-4 py-3 text-right whitespace-nowrap">
                {report.status === "open" && (
                  <>
                    <button className="mr-3 text-green-700 hover:underline"
                      onClick={() => setStatus(report, "resolved")}>
                      Resolve
                    </button>
                    <button className="text-slate-900 hover:underline"
                      onClick={() => setStatus(report, "rejected")}>
                      Reject
                    </button>
                  </>
                )}
              </td>
            </tr>
          );
        })}
      </Table>
    </div>
  );
}
