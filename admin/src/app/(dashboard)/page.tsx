"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase";

type Stats = {
  questions: number;
  tests: number;
  users: number;
  openReports: number;
};

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    const supabase = supabaseBrowser();
    async function load() {
      const count = async (table: string, filter?: (q: any) => any) => {
        let q = supabase.from(table).select("*", { count: "exact", head: true });
        if (filter) q = filter(q);
        const { count: c } = await q;
        return c ?? 0;
      };
      setStats({
        questions: await count("questions"),
        tests: await count("tests"),
        users: await count("profiles"),
        openReports: await count("question_reports", (q) => q.eq("status", "open")),
      });
    }
    load();
  }, []);

  const cards = [
    { label: "Questions", value: stats?.questions },
    { label: "Mock Tests", value: stats?.tests },
    { label: "Users", value: stats?.users },
    { label: "Open Reports", value: stats?.openReports },
  ];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-slate-800">Dashboard</h1>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl bg-white p-5 shadow-sm">
            <div className="text-sm text-slate-900">{c.label}</div>
            <div className="mt-1 text-3xl font-bold text-slate-800">
              {c.value ?? "—"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
