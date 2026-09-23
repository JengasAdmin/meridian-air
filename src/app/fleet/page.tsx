"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLang } from "@/i18n/client";
import { SectionTitle, StatusBadge, Skeleton, EmptyState } from "@/components/ui";

type Aircraft = {
  id: string; registration: string; type: string; name: string; manufacturer: string;
  category: string; hub: string | null; status: string;
  capacityPax: number | null; capacityCargoKg: number | null;
};

const CATS = ["PASSENGER", "CARGO", "MILITARY", "GENERAL", "SOVIET"];

function FleetPage() {
  const { t, lang } = useLang();
  const params = useSearchParams();
  const [cat, setCat] = useState<string>(params.get("cat") ?? "");
  const [fleet, setFleet] = useState<Aircraft[] | null>(null);

  useEffect(() => {
    fetch("/api/fleet" + (cat ? `?category=${cat}` : ""))
      .then((r) => r.json())
      .then((d) => setFleet(d.fleet));
  }, [cat]);

  return (
    <div className="container-page section">
      <SectionTitle title={t("fleet.title")} sub={t("fleet.sub")} />
      <div className="mb-8 flex flex-wrap gap-2">
        <button onClick={() => setCat("")} className={`btn-sm btn ${cat === "" ? "btn-primary" : "btn-ghost"}`}>
          {t("fleet.filterAll")}
        </button>
        {CATS.map((c) => (
          <button key={c} onClick={() => setCat(c)} className={`btn-sm btn ${cat === c ? "btn-primary" : "btn-ghost"}`}>
            {t(`op.${c}` as never)}
          </button>
        ))}
      </div>
      {fleet === null ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} />)}
        </div>
      ) : fleet.length === 0 ? (
        <EmptyState titleKey="fleet.empty" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {fleet.map((a) => (
            <div key={a.id} className="surface p-6 transition-all hover:border-electric/40">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-mono text-sm text-electric">{a.registration}</div>
                  <div className="mt-1 font-semibold">{a.name}</div>
                  <div className="text-xs text-steel">{a.manufacturer}</div>
                </div>
                <StatusBadge status={a.status} />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-steel">
                <span>{t("fleet.type")}: <span className="text-mist">{a.type}</span></span>
                <span>{t("fleet.hub")}: <span className="text-mist">{a.hub ?? "—"}</span></span>
                {a.capacityPax && <span>{a.capacityPax} {t("fleet.pax")}</span>}
                {a.capacityCargoKg && <span>{a.capacityCargoKg.toLocaleString(lang)} {t("fleet.cargo")}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Page() {
  return <Suspense fallback={null}><FleetPage /></Suspense>;
}
