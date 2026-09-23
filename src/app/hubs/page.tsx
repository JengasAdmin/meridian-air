"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLang } from "@/i18n/client";
import { SectionTitle, Skeleton, StatCard } from "@/components/ui";

type Hub = {
  code: string; iata: string | null; name: string; city: string; cityRu: string | null;
  country: string; countryRu: string | null; aircraft: number; routes: number; pilots: number;
  director: string | null; deputy: string | null;
};

export default function HubsPage() {
  const { t, lang } = useLang();
  const [hubs, setHubs] = useState<Hub[] | null>(null);

  useEffect(() => {
    fetch("/api/hubs").then((r) => r.json()).then((d) => setHubs(d.hubs));
  }, []);

  return (
    <div className="container-page section">
      <SectionTitle title={t("hubs.title")} sub={t("hubs.sub")} />
      {hubs === null ? (
        <div className="grid gap-4 lg:grid-cols-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} />)}</div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {hubs.map((h) => (
            <Link key={h.code} href={`/hubs/${h.code}`} className="surface group p-8 transition-all hover:border-electric">
              <div className="flex items-baseline justify-between">
                <div className="font-mono text-3xl font-bold text-mist group-hover:text-electric">{h.code}</div>
                <div className="text-sm text-steel">{h.iata}</div>
              </div>
              <div className="mt-1 text-lg font-medium">{lang === "ru" ? h.cityRu ?? h.city : h.city}</div>
              <div className="text-sm text-steel">{lang === "ru" ? h.countryRu ?? h.country : h.country} · {h.name}</div>
              <div className="mt-6 grid grid-cols-3 gap-3">
                <div><div className="font-mono text-xl text-electric">{h.aircraft}</div><div className="text-xs text-steel">{t("hubs.aircraft")}</div></div>
                <div><div className="font-mono text-xl text-electric">{h.routes}</div><div className="text-xs text-steel">{t("hubs.routes")}</div></div>
                <div><div className="font-mono text-xl text-electric">{h.pilots}</div><div className="text-xs text-steel">{t("hubs.pilots")}</div></div>
              </div>
              <div className="mt-6 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-steel">{t("hubs.director")}</span>
                  <span className="font-mono">{h.director ?? t("hubs.vacant")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-steel">{t("hubs.deputy")}</span>
                  <span className="font-mono">{h.deputy ?? t("hubs.vacant")}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
