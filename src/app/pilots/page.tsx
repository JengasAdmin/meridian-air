"use client";

import { useEffect, useState } from "react";
import { useLang } from "@/i18n/client";
import { SectionTitle, Skeleton, StatusBadge } from "@/components/ui";

type Pilot = {
  pilotId: string; name: string;
  rank: { key: string | null; nameRu: string | null; nameEn: string | null };
  hub: string | null; status: string; hours: number; flights: number; joinDate: string;
};

export default function PilotsPage() {
  const { t, lang } = useLang();
  const [pilots, setPilots] = useState<Pilot[] | null>(null);

  useEffect(() => {
    fetch("/api/pilots").then((r) => r.json()).then((d) => setPilots(d.pilots));
  }, []);

  return (
    <div className="container-page section">
      <SectionTitle title={t("pilots.title")} sub={t("pilots.sub")} />
      {pilots === null ? (
        <Skeleton className="h-96" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pilots.map((p) => (
            <div key={p.pilotId} className="surface p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-mono text-sm font-bold text-electric">{p.pilotId}</div>
                  <div className="mt-1 font-semibold">{p.name}</div>
                  <div className="text-sm text-steel">
                    {lang === "ru" ? p.rank.nameRu ?? "" : p.rank.nameEn ?? ""}
                  </div>
                </div>
                <StatusBadge status={p.status} prefix="pilotStatus" />
              </div>
              <div className="mt-4 flex gap-6 text-sm">
                <div>
                  <div className="font-mono text-lg">{Math.round(p.hours)}</div>
                  <div className="text-xs text-steel">{t("pilots.hours")}</div>
                </div>
                <div>
                  <div className="font-mono text-lg">{p.flights}</div>
                  <div className="text-xs text-steel">{t("pilots.flights")}</div>
                </div>
                <div>
                  <div className="font-mono text-lg">{p.hub ?? "—"}</div>
                  <div className="text-xs text-steel">{t("pilots.hub")}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
