"use client";

import { useCallback, useEffect, useState } from "react";
import { useLang } from "@/i18n/client";
import { StatusBadge, Skeleton } from "@/components/ui";

type Pilot = {
  userId: string; pilotId: string; name: string; email: string; status: string;
  rank: { key: string; nameRu: string; nameEn: string } | null;
  hub: string | null; hours: number; flights: number;
};

type Role = { key: string; nameRu: string; nameEn: string };

export default function AdminPilotsPage() {
  const { t, lang } = useLang();
  const [pilots, setPilots] = useState<Pilot[] | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const load = useCallback(async () => {
    const [p, r] = await Promise.all([
      fetch("/api/pilots/admin").then((res) => res.json()),
      fetch("/api/admin/roles").then((res) => res.json()),
    ]);
    setPilots(p.pilots ?? []);
    setRoles((r.roles ?? []).filter((x: Role & { isPilotRank: boolean }) => x.isPilotRank || x.key.startsWith("HUB")));
  }, []);
  useEffect(() => { load(); }, [load]);

  async function patch(userId: string, action: string, extra: Record<string, unknown> = {}) {
    await fetch("/api/pilots/admin", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, action, ...extra }),
    });
    load();
  }

  if (pilots === null) return <Skeleton className="h-96" />;

  const filtered = pilots.filter(
    (p) =>
      (!statusFilter || p.status === statusFilter) &&
      (!q || p.pilotId.includes(q.toUpperCase()) || p.name.toLowerCase().includes(q.toLowerCase()) || p.email.includes(q.toLowerCase()))
  );

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input className="input max-w-xs" placeholder={t("admin.search")} value={q} onChange={(e) => setQ(e.target.value)} aria-label={t("admin.search")} />
        <select className="input max-w-40" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label={t("pilots.status")}>
          <option value="">{t("fleet.filterAll")}</option>
          {["PENDING", "VERIFIED", "ACTIVE", "SUSPENDED"].map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div className="surface overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-white/10 text-xs uppercase tracking-wider text-steel">
            <tr>
              <th className="px-4 py-3">{t("pilots.pilotId")}</th>
              <th className="px-4 py-3">{t("auth.name")}</th>
              <th className="px-4 py-3">{t("pilots.rank")}</th>
              <th className="px-4 py-3">{t("pilots.hub")}</th>
              <th className="px-4 py-3">{t("pilots.status")}</th>
              <th className="px-4 py-3 text-right">{t("admin.save")}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.userId} className="border-b border-white/5 last:border-0">
                <td className="px-4 py-3 font-mono text-electric">{p.pilotId}</td>
                <td className="px-4 py-3">
                  {p.name}
                  <div className="text-xs text-steel">{p.email}</div>
                </td>
                <td className="px-4 py-3">
                  <select
                    className="input max-w-44 py-1.5 text-xs"
                    value={p.rank?.key ?? ""}
                    onChange={(e) => patch(p.userId, "SET_RANK", { roleKey: e.target.value })}
                    aria-label={t("pilots.rank")}
                  >
                    <option value="">—</option>
                    {roles.map((r) => (
                      <option key={r.key} value={r.key}>{lang === "ru" ? r.nameRu : r.nameEn}</option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <select
                    className="input max-w-24 py-1.5 text-xs"
                    value={p.hub ?? ""}
                    onChange={(e) => patch(p.userId, "SET_HUB", { hubCode: e.target.value })}
                    aria-label={t("pilots.hub")}
                  >
                    <option value="">—</option>
                    {["UMKK", "UUEE", "OMDB", "LTFM", "UHHH"].map((c) => <option key={c}>{c}</option>)}
                  </select>
                </td>
                <td className="px-4 py-3"><StatusBadge status={p.status} prefix="pilotStatus" /></td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    {p.status === "PENDING" && (
                      <button className="btn-primary btn-sm" onClick={() => patch(p.userId, "VERIFY")}>{t("admin.verify")}</button>
                    )}
                    {p.status !== "SUSPENDED" ? (
                      <button className="btn-danger btn-sm" onClick={() => patch(p.userId, "SUSPEND")}>⏸</button>
                    ) : (
                      <button className="btn-ghost btn-sm" onClick={() => patch(p.userId, "ACTIVATE")}>▶</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
