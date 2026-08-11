"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabaseBrowser, type Question, type QuestionReport } from "@/lib/supabase";
import { PageHeader, Table } from "@/components/form-controls";

export default function ReportsPage() {
  const [reports, setReports] = useState<QuestionReport[]>([]);
  const [questions, setQuestions] = useState<Record<string, Question>>({});

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
      const { data: questionRows } = await supabase.from("questions").select("*").in("id", ids);
      setQuestions(Object.fromEntries((questionRows ?? []).map((q) => [q.id, q])));
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
        {reports.map((report) => (
          <tr key={report.id} className="border-b border-slate-100">
            <td className="max-w-sm px-4 py-3">
              {questions[report.question_id] ? (
                <Link href={`/questions/${report.question_id}`} className="text-blue-700 hover:underline">
                  {questions[report.question_id].question_en}
                </Link>
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
        ))}
      </Table>
    </div>
  );
}
