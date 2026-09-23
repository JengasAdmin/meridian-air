"use client";

import { useCallback, useEffect, useState } from "react";
import { useLang } from "@/i18n/client";
import { StatusBadge, Skeleton, duration } from "@/components/ui";

type Pirep = {
  id: string; code: string; flightNumber: string; origin: string; destCode: string;
  durationMin: number; status: string; pilot: string; network: string; remarks: string | null;
};

export default function AdminPirepsPage() {
  const { t, lang } = useLang();
  const [pireps, setPireps] = useState<Pirep[] | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/pireps");
    setPireps((await res.json()).pireps ?? []);
  }, []);
  useEffect(() => { load(); }, [load]);

  async function review(id: string, decision: "APPROVED" | "REJECTED") {
    await fetch("/api/pireps", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, decision }),
    });
    load();
  }

  if (!pireps) return <Skeleton className="h-96" />;
  return (
    <div className="surface overflow-x-auto">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="border-b border-white/10 text-xs uppercase tracking-wider text-steel">
          <tr>
            <th className="px-4 py-3">ID</th>
            <th className="px-4 py-3">{t("routes.flight")}</th>
            <th className="px-4 py-3">{t("routes.from")} → {t("routes.to")}</th>
            <th className="px-4 py-3">{t("pilots.pilotId")}</th>
            <th className="px-4 py-3">{t("routes.duration")}</th>
            <th className="px-4 py-3">{t("pilots.status")}</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {pireps.map((p) => (
            <tr key={p.id} className="border-b border-white/5 last:border-0">
              <td className="px-4 py-3 font-mono text-electric">{p.code}</td>
              <td className="px-4 py-3 font-mono">{p.flightNumber}</td>
              <td className="px-4 py-3 font-mono">{p.origin} → {p.destCode}</td>
              <td className="px-4 py-3">{p.pilot}</td>
              <td className="px-4 py-3">{duration(p.durationMin, lang)}</td>
              <td className="px-4 py-3"><StatusBadge status={p.status} prefix="pirep.status" /></td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-2">
                  {p.status === "PENDING" && (
                    <>
                      <button className="btn-primary btn-sm" onClick={() => review(p.id, "APPROVED")}>{t("admin.approve")}</button>
                      <button className="btn-danger btn-sm" onClick={() => review(p.id, "REJECTED")}>{t("admin.reject")}</button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
