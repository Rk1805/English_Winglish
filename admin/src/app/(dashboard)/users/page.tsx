"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser, type Profile } from "@/lib/supabase";
import { inputCls, PageHeader, Table } from "@/components/form-controls";

export default function UsersPage() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [search, setSearch] = useState("");

  async function load() {
    const { data } = await supabaseBrowser()
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    setUsers(data ?? []);
  }
  useEffect(() => {
    load();
  }, []);

  async function togglePremium(user: Profile) {
    await supabaseBrowser()
      .from("profiles")
      .update({ is_premium: !user.is_premium })
      .eq("id", user.id);
    load();
  }

  const filtered = users.filter((u) =>
    (u.full_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (u.phone ?? "").includes(search)
  );

  return (
    <div>
      <PageHeader title={`Users (${users.length})`} />
      <input
        className={inputCls + " mb-4 max-w-sm"}
        placeholder="Search by name or phone…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <Table headers={["Name", "Phone", "Role", "Premium", "Joined", ""]} empty={filtered.length === 0}>
        {filtered.map((user) => (
          <tr key={user.id} className="border-b border-slate-100">
            <td className="px-4 py-3 font-medium">{user.full_name || "(no name)"}</td>
            <td className="px-4 py-3">{user.phone ?? "—"}</td>
            <td className="px-4 py-3 capitalize">
              {user.role === "admin" ? (
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                  admin
                </span>
              ) : (
                "student"
              )}
            </td>
            <td className="px-4 py-3">{user.is_premium ? "⭐ Yes" : "No"}</td>
            <td className="px-4 py-3">{new Date(user.created_at).toLocaleDateString("en-IN")}</td>
            <td className="px-4 py-3 text-right">
              {user.role !== "admin" && (
                <button className="text-blue-600 hover:underline" onClick={() => togglePremium(user)}>
                  {user.is_premium ? "Remove premium" : "Grant premium"}
                </button>
              )}
            </td>
          </tr>
        ))}
      </Table>
      <p className="mt-3 text-xs text-slate-400">
        Note: app users appear here once optional sign-in is added to the app. Premium normally
        activates automatically via Play Billing; manual grant is for special cases.
      </p>
    </div>
  );
}
