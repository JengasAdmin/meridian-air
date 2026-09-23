"use client";

import { useEffect, useMemo, useState } from "react";
import { useLang } from "@/i18n/client";
import { SectionTitle, Skeleton, EmptyState, duration } from "@/components/ui";

type Route = {
  id: string; flightNumber: string; origin: string; originCity: string; originCityRu: string | null;
  dest: string; destCity: string; destCityRu: string | null; category: string;
  distanceNm: number; durationMin: number;
};

const CATS = ["PASSENGER", "CARGO", "MILITARY", "GENERAL", "SOVIET"];

export default function RoutesPage() {
  const { t, lang } = useLang();
  const [routes, setRoutes] = useState<Route[] | null>(null);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");

  useEffect(() => {
    fetch("/api/routes").then((r) => r.json()).then((d) => setRoutes(d.routes));
  }, []);

  const filtered = useMemo(() => {
    if (!routes) return null;
    const query = q.toUpperCase();
    return routes.filter(
      (r) =>
        (!cat || r.category === cat) &&
        (!query ||
          r.flightNumber.includes(query) ||
          r.origin.includes(query) ||
          r.dest.includes(query) ||
          r.originCity.toUpperCase().includes(query) ||
          r.destCity.toUpperCase().includes(query))
    );
  }, [routes, q, cat]);

  return (
    <div className="container-page section">
      <SectionTitle title={t("routes.title")} sub={t("routes.sub")} />
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <input
          className="input max-w-xs"
          placeholder={t("routes.searchPlaceholder")}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label={t("routes.searchPlaceholder")}
        />
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setCat("")} className={`btn-sm btn ${cat === "" ? "btn-primary" : "btn-ghost"}`}>
            {t("fleet.filterAll")}
          </button>
          {CATS.map((c) => (
            <button key={c} onClick={() => setCat(c)} className={`btn-sm btn ${cat === c ? "btn-primary" : "btn-ghost"}`}>
              {t(`op.${c}` as never)}
            </button>
          ))}
        </div>
      </div>
      {filtered === null ? (
        <Skeleton className="h-96" />
      ) : filtered.length === 0 ? (
        <EmptyState titleKey="routes.empty" />
      ) : (
        <div className="surface overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-white/10 text-xs uppercase tracking-wider text-steel">
              <tr>
                <th className="px-4 py-3">{t("routes.flight")}</th>
                <th className="px-4 py-3">{t("routes.from")}</th>
                <th className="px-4 py-3">{t("routes.to")}</th>
                <th className="px-4 py-3">{t("routes.category")}</th>
                <th className="px-4 py-3 text-right">{t("routes.distance")}</th>
                <th className="px-4 py-3 text-right">{t("routes.duration")}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-b border-white/5 transition-colors last:border-0 hover:bg-white/5">
                  <td className="px-4 py-3 font-mono font-semibold text-electric">{r.flightNumber}</td>
                  <td className="px-4 py-3">
                    <span className="font-mono">{r.origin}</span>{" "}
                    <span className="text-steel">{lang === "ru" ? r.originCityRu ?? r.originCity : r.originCity}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono">{r.dest}</span>{" "}
                    <span className="text-steel">{lang === "ru" ? r.destCityRu ?? r.destCity : r.destCity}</span>
                  </td>
                  <td className="px-4 py-3 text-steel">{t(`op.${r.category}` as never)}</td>
                  <td className="px-4 py-3 text-right font-mono">{r.distanceNm} {t("routes.nm")}</td>
                  <td className="px-4 py-3 text-right font-mono">{duration(r.durationMin, lang)}</td>
                  <td className="px-4 py-3 text-right">
                    <a href={`/book?route=${r.id}`} className="text-electric hover:underline">{t("routes.book")}</a>
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
