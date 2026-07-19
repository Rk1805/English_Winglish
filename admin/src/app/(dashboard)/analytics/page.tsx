"use client";

import { useCallback, useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase";
import { inputCls, PageHeader, primaryBtn } from "@/components/form-controls";

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

const today = () => new Date().toISOString().slice(0, 10);

type DayRow = { day: string; users: number };

export default function AnalyticsPage() {
  const [online, setOnline] = useState<number | null>(null);
  const [todayUsers, setTodayUsers] = useState<number | null>(null);
  const [week, setWeek] = useState<number | null>(null);
  const [month, setMonth] = useState<number | null>(null);
  const [totalDevices, setTotalDevices] = useState<number | null>(null);

  const [from, setFrom] = useState(isoDaysAgo(13));
  const [to, setTo] = useState(today());
  const [rangeRows, setRangeRows] = useState<DayRow[] | null>(null);
  const [rangeUnique, setRangeUnique] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function distinctUsersSince(fromDay: string): Promise<number> {
    const { data } = await supabaseBrowser()
      .from("app_activity")
      .select("device_id")
      .gte("day", fromDay);
    return new Set((data ?? []).map((r) => r.device_id)).size;
  }

  async function loadCards() {
    const supabase = supabaseBrowser();
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const [{ count: onlineCount }, { count: deviceCount }] = await Promise.all([
      supabase.from("devices").select("*", { count: "exact", head: true }).gte("last_seen", fiveMinAgo),
      supabase.from("devices").select("*", { count: "exact", head: true }),
    ]);
    setOnline(onlineCount ?? 0);
    setTotalDevices(deviceCount ?? 0);
    setTodayUsers(await distinctUsersSince(today()));
    setWeek(await distinctUsersSince(isoDaysAgo(6)));
    setMonth(await distinctUsersSince(isoDaysAgo(29)));
  }

  const loadRange = useCallback(async () => {
    setError(null);
    const supabase = supabaseBrowser();
    const { data, error } = await supabase.rpc("activity_stats", { p_from: from, p_to: to });
    if (error) {
      setError(
        error.message.includes("activity_stats")
          ? "Analytics tables missing — run supabase/migrations/0003_analytics_and_reports.sql in the SQL Editor."
          : error.message
      );
      return;
    }
    setRangeRows((data as DayRow[]) ?? []);
    const { data: uniqueRows } = await supabase
      .from("app_activity")
      .select("device_id")
      .gte("day", from)
      .lte("day", to);
    setRangeUnique(new Set((uniqueRows ?? []).map((r) => r.device_id)).size);
  }, [from, to]);

  useEffect(() => {
    loadCards();
    loadRange();
    const interval = setInterval(loadCards, 60_000); // refresh "online now" every minute
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const maxUsers = Math.max(1, ...(rangeRows ?? []).map((r) => r.users));

  const cards = [
    { label: "Online now (last 5 min)", value: online, accent: "text-green-600" },
    { label: "Today's users", value: todayUsers, accent: "text-slate-800" },
    { label: "Last 7 days", value: week, accent: "text-slate-800" },
    { label: "Last 30 days", value: month, accent: "text-slate-800" },
    { label: "Total devices ever", value: totalDevices, accent: "text-slate-800" },
  ];

  return (
    <div>
      <PageHeader title="Analytics" />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
        {cards.map((card) => (
          <div key={card.label} className="rounded-xl bg-white p-5 shadow-sm">
            <div className="text-xs text-slate-500">{card.label}</div>
            <div className={`mt-1 text-3xl font-bold ${card.accent}`}>{card.value ?? "—"}</div>
          </div>
        ))}
      </div>

      <div className="rounded-xl bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-end gap-3">
          <h2 className="mr-auto text-lg font-semibold text-slate-800">Daily users by date</h2>
          <label className="text-sm text-slate-600">
            From
            <input type="date" className={inputCls} value={from} max={to}
              onChange={(e) => setFrom(e.target.value)} />
          </label>
          <label className="text-sm text-slate-600">
            To
            <input type="date" className={inputCls} value={to} min={from} max={today()}
              onChange={(e) => setTo(e.target.value)} />
          </label>
          <button className={primaryBtn} onClick={loadRange}>Apply</button>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {!error && rangeRows && (
          <>
            <p className="mb-3 text-sm text-slate-600">
              <b>{rangeUnique ?? "—"}</b> unique users in this period
            </p>
            {rangeRows.length === 0 ? (
              <p className="py-6 text-center text-slate-400">
                No activity in this period yet. Data appears once students open the app.
              </p>
            ) : (
              <div className="space-y-1">
                {rangeRows.map((row) => (
                  <div key={row.day} className="flex items-center gap-3 text-sm">
                    <span className="w-24 shrink-0 text-slate-500">
                      {new Date(row.day + "T00:00:00").toLocaleDateString("en-IN", {
                        day: "2-digit", month: "short",
                      })}
                    </span>
                    <div className="h-5 rounded bg-red-500"
                      style={{ width: `${Math.max(2, (row.users / maxUsers) * 100)}%` }} />
                    <span className="font-medium text-slate-700">{row.users}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <p className="mt-4 text-xs text-slate-400">
        A &quot;user&quot; is a unique app installation (anonymous device id — no login needed).
        Ad statistics (impressions, video ad plays, earnings) will appear in the Google AdMob
        console once ads are integrated — they are not tracked here.
      </p>
    </div>
  );
}
