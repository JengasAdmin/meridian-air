"use client";

import { useCallback, useEffect, useState } from "react";
import { useLang } from "@/i18n/client";
import { StatusBadge, Skeleton } from "@/components/ui";

type Aircraft = {
  id: string; registration: string; name: string; type: string; category: string;
  hub: string | null; status: string;
};

const STATUSES = ["ACTIVE", "IN_SERVICE", "MAINTENANCE", "RESERVED", "RETIRED", "UNAVAILABLE"];

export default function AdminFleetPage() {
  const { t } = useLang();
  const [fleet, setFleet] = useState<Aircraft[] | null>(null);
  const [form, setForm] = useState({
    registration: "", type: "", name: "", manufacturer: "", categoryKey: "PASSENGER",
    hubCode: "UMKK", capacityPax: "", isMilitary: false,
  });
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    setFleet((await (await fetch("/api/fleet")).json()).fleet);
  }, []);
  useEffect(() => { load(); }, [load]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    const res = await fetch("/api/admin/fleet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        capacityPax: form.capacityPax ? parseInt(form.capacityPax, 10) : undefined,
      }),
    });
    if (res.ok) {
      setForm({ registration: "", type: "", name: "", manufacturer: "", categoryKey: "PASSENGER", hubCode: "UMKK", capacityPax: "", isMilitary: false });
      load();
    } else {
      const d = await res.json();
      setMsg(d.error ?? t("error.generic"));
    }
  }

  async function setStatus(id: string, status: string) {
    await fetch("/api/admin/fleet", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    load();
  }

  return (
    <div>
      <form onSubmit={create} className="surface mb-8 grid gap-3 p-6 sm:grid-cols-3 lg:grid-cols-7">
        <input required className="input" placeholder="MRD-A321-101" value={form.registration} onChange={(e) => setForm((f) => ({ ...f, registration: e.target.value }))} aria-label="Registration" />
        <input required className="input" placeholder="A321" value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} aria-label="Type" />
        <input required className="input" placeholder="Airbus A321neo" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} aria-label="Name" />
        <input required className="input" placeholder="Airbus" value={form.manufacturer} onChange={(e) => setForm((f) => ({ ...f, manufacturer: e.target.value }))} aria-label="Manufacturer" />
        <select className="input" value={form.categoryKey} onChange={(e) => setForm((f) => ({ ...f, categoryKey: e.target.value }))} aria-label="Category">
          {["PASSENGER", "CARGO", "MILITARY", "GENERAL", "SOVIET"].map((c) => <option key={c}>{c}</option>)}
        </select>
        <select className="input" value={form.hubCode} onChange={(e) => setForm((f) => ({ ...f, hubCode: e.target.value }))} aria-label="Hub">
          {["UMKK", "UUEE", "OMDB", "LTFM", "UHHH"].map((c) => <option key={c}>{c}</option>)}
        </select>
        <button className="btn-primary">{t("admin.create")}</button>
        {msg && <div className="text-sm text-red-400 sm:col-span-3 lg:col-span-7">{msg}</div>}
      </form>

      {fleet === null ? <Skeleton className="h-96" /> : (
        <div className="surface overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-white/10 text-xs uppercase tracking-wider text-steel">
              <tr>
                <th className="px-4 py-3">{t("fleet.registration")}</th>
                <th className="px-4 py-3">{t("fleet.type")}</th>
                <th className="px-4 py-3">{t("routes.category")}</th>
                <th className="px-4 py-3">{t("fleet.hub")}</th>
                <th className="px-4 py-3">{t("fleet.status")}</th>
              </tr>
            </thead>
            <tbody>
              {fleet.map((a) => (
                <tr key={a.id} className="border-b border-white/5 last:border-0">
                  <td className="px-4 py-3 font-mono text-electric">{a.registration}</td>
                  <td className="px-4 py-3">{a.name}</td>
                  <td className="px-4 py-3">{a.category}</td>
                  <td className="px-4 py-3 font-mono">{a.hub ?? "—"}</td>
                  <td className="px-4 py-3">
                    <select
                      className="input max-w-40 py-1.5 text-xs"
                      value={a.status}
                      onChange={(e) => setStatus(a.id, e.target.value)}
                      aria-label={t("fleet.status")}
                    >
                      {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
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
