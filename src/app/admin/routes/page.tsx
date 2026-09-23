"use client";

import { useCallback, useEffect, useState } from "react";
import { useLang } from "@/i18n/client";
import { Skeleton, duration } from "@/components/ui";

type Route = {
  id: string; flightNumber: string; origin: string; dest: string; category: string;
  distanceNm: number; durationMin: number; frequency: string;
};

export default function AdminRoutesPage() {
  const { t, lang } = useLang();
  const [routes, setRoutes] = useState<Route[] | null>(null);
  const [form, setForm] = useState({ originCode: "", destCode: "", categoryKey: "PASSENGER", flightNumber: "", distanceNm: "", durationMin: "" });
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    setRoutes((await (await fetch("/api/routes")).json()).routes);
  }, []);
  useEffect(() => { load(); }, [load]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    const res = await fetch("/api/admin/routes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        originCode: form.originCode, destCode: form.destCode, categoryKey: form.categoryKey,
        flightNumber: form.flightNumber || undefined,
        distanceNm: parseFloat(form.distanceNm), durationMin: parseInt(form.durationMin, 10),
      }),
    });
    if (res.ok) {
      setForm({ originCode: "", destCode: "", categoryKey: "PASSENGER", flightNumber: "", distanceNm: "", durationMin: "" });
      load();
    } else {
      const d = await res.json();
      setMsg(d.error ?? t("error.generic"));
    }
  }

  async function deactivate(id: string) {
    await fetch(`/api/admin/routes?id=${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <form onSubmit={create} className="surface mb-8 grid gap-3 p-6 sm:grid-cols-3 lg:grid-cols-6">
        <input required maxLength={4} className="input" placeholder="UMKK" value={form.originCode} onChange={(e) => setForm((f) => ({ ...f, originCode: e.target.value.toUpperCase() }))} aria-label="Origin" />
        <input required maxLength={4} className="input" placeholder="UUEE" value={form.destCode} onChange={(e) => setForm((f) => ({ ...f, destCode: e.target.value.toUpperCase() }))} aria-label="Destination" />
        <select className="input" value={form.categoryKey} onChange={(e) => setForm((f) => ({ ...f, categoryKey: e.target.value }))} aria-label="Category">
          {["PASSENGER", "CARGO", "MILITARY", "GENERAL", "SOVIET"].map((c) => <option key={c}>{c}</option>)}
        </select>
        <input className="input" placeholder={t("routes.flight") + " (auto)"} value={form.flightNumber} onChange={(e) => setForm((f) => ({ ...f, flightNumber: e.target.value.toUpperCase() }))} aria-label="Flight number" />
        <div className="grid grid-cols-2 gap-2">
          <input required type="number" className="input" placeholder="nm" value={form.distanceNm} onChange={(e) => setForm((f) => ({ ...f, distanceNm: e.target.value }))} aria-label="Distance" />
          <input required type="number" className="input" placeholder="min" value={form.durationMin} onChange={(e) => setForm((f) => ({ ...f, durationMin: e.target.value }))} aria-label="Duration" />
        </div>
        <button className="btn-primary">{t("admin.create")}</button>
        {msg && <div className="text-sm text-red-400 sm:col-span-3 lg:col-span-6">{msg}</div>}
      </form>

      {routes === null ? <Skeleton className="h-96" /> : (
        <div className="surface overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-white/10 text-xs uppercase tracking-wider text-steel">
              <tr>
                <th className="px-4 py-3">{t("routes.flight")}</th>
                <th className="px-4 py-3">{t("routes.from")} → {t("routes.to")}</th>
                <th className="px-4 py-3">{t("routes.category")}</th>
                <th className="px-4 py-3 text-right">{t("routes.distance")}</th>
                <th className="px-4 py-3 text-right">{t("routes.duration")}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {routes.map((r) => (
                <tr key={r.id} className="border-b border-white/5 last:border-0">
                  <td className="px-4 py-3 font-mono text-electric">{r.flightNumber}</td>
                  <td className="px-4 py-3 font-mono">{r.origin} → {r.dest}</td>
                  <td className="px-4 py-3">{r.category}</td>
                  <td className="px-4 py-3 text-right font-mono">{r.distanceNm} nm</td>
                  <td className="px-4 py-3 text-right font-mono">{duration(r.durationMin, lang)}</td>
                  <td className="px-4 py-3 text-right">
                    <button className="btn-danger btn-sm" onClick={() => deactivate(r.id)}>✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
