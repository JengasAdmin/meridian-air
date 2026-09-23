"use client";

import { useEffect, useState } from "react";
import { useLang } from "@/i18n/client";
import { SectionTitle, Skeleton, StatCard } from "@/components/ui";

type Stats = {
  pilots: number; flights: number; hours: number; distanceNm: number;
  aircraft: number; routes: number; hubs: number; liveNow: number;
  byHub: { code: string; city: string; cityRu: string | null; pilots: number; hours: number }[];
  byFleet: { key: string; nameRu: string; nameEn: string; count: number }[];
};

export default function StatisticsPage() {
  const { t, lang } = useLang();
  const [s, setS] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/statistics").then((r) => r.json()).then(setS);
  }, []);

  if (!s)
    return (
      <div className="container-page section">
        <SectionTitle title={t("stats.title")} sub={t("stats.sub")} />
        <Skeleton className="h-96" />
      </div>
    );

  const maxHubHours = Math.max(1, ...s.byHub.map((h) => h.hours));
  const maxFleet = Math.max(1, ...s.byFleet.map((f) => f.count));

  return (
    <div className="container-page section">
      <SectionTitle title={t("stats.title")} sub={t("stats.sub")} />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard accent value={s.pilots} label={t("home.pilots")} />
        <StatCard accent value={s.flights} label={t("home.flights")} />
        <StatCard accent value={s.hours} label={t("home.hours")} />
        <StatCard accent value={s.liveNow} label={t("home.liveOps")} />
        <StatCard value={s.aircraft} label={t("home.aircraft")} />
        <StatCard value={s.routes} label={t("home.routes")} />
        <StatCard value={s.hubs} label={t("home.hubs")} />
        <StatCard value={`${s.distanceNm.toLocaleString()} nm`} label={t("profile.distance")} />
      </div>

      <div className="mt-14 grid gap-8 lg:grid-cols-2">
        <div className="surface p-6">
          <h3 className="heading-md mb-6">{t("stats.byHub")}</h3>
          <div className="space-y-4">
            {s.byHub.map((h) => (
              <div key={h.code}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="font-mono">{h.code} <span className="text-steel">{lang === "ru" ? h.cityRu ?? h.city : h.city}</span></span>
                  <span className="font-mono text-steel">{h.hours} h · {h.pilots} {t("pilots.title").toLowerCase()}</span>
                </div>
                <div className="h-2 rounded-full bg-white/5">
                  <div className="h-2 rounded-full bg-electric transition-all" style={{ width: `${(h.hours / maxHubHours) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="surface p-6">
          <h3 className="heading-md mb-6">{t("stats.byFleet")}</h3>
          <div className="space-y-4">
            {s.byFleet.map((f) => (
              <div key={f.key}>
                <div className="mb-1 flex justify-between text-sm">
                  <span>{lang === "ru" ? f.nameRu : f.nameEn}</span>
                  <span className="font-mono text-steel">{f.count}</span>
                </div>
                <div className="h-2 rounded-full bg-white/5">
                  <div className="h-2 rounded-full bg-electric transition-all" style={{ width: `${(f.count / maxFleet) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
