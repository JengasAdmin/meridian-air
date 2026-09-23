"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLang } from "@/i18n/client";
import { EmptyState, Skeleton } from "@/components/ui";

type LiveFlight = {
  callsign: string; aircraft: string | null; departure: string | null;
  arrival: string | null; altitudeFt: number | null; speedKt: number | null;
  network: string;
};

export function LiveOpsTeaser({ full = false }: { full?: boolean }) {
  const { t } = useLang();
  const [flights, setFlights] = useState<LiveFlight[] | null>(null);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const res = await fetch("/api/live");
        const data = await res.json();
        if (alive) {
          setFlights(data.meridian ?? []);
          setTotal(data.networkTotal ?? 0);
        }
      } catch {
        if (alive) setFlights([]);
      }
    };
    load();
    const id = setInterval(load, 60_000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  if (flights === null) return <Skeleton className="h-48" />;
  if (flights.length === 0)
    return <EmptyState titleKey="home.noFlights" subKey="home.noFlightsSub" ctaHref="/book" ctaKey="home.bookNow" />;

  return (
    <div>
      <div className="mb-4 text-xs text-steel">
        {t("live.lastUpdate")}: {new Date().toLocaleTimeString()} · VATSIM online: {total}
      </div>
      <div className={`grid gap-4 ${full ? "" : "lg:grid-cols-3"}`}>
        {flights.slice(0, full ? 50 : 6).map((f) => (
          <div key={f.callsign} className="surface p-5">
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-electric">{f.callsign}</span>
              <span className="badge bg-emerald-500/15 text-emerald-400">LIVE</span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div>
                <div className="text-xs text-steel">{t("live.dep")}</div>
                <div className="font-mono text-mist">{f.departure ?? "—"}</div>
              </div>
              <div>
                <div className="text-xs text-steel">{t("live.arr")}</div>
                <div className="font-mono text-mist">{f.arrival ?? "—"}</div>
              </div>
              <div>
                <div className="text-xs text-steel">{t("live.alt")}</div>
                <div className="font-mono text-mist">{f.altitudeFt ?? "—"}</div>
              </div>
              <div>
                <div className="text-xs text-steel">{t("live.spd")}</div>
                <div className="font-mono text-mist">{f.speedKt ?? "—"}</div>
              </div>
            </div>
            <div className="mt-3 text-xs text-steel">{f.network} · {f.aircraft ?? ""}</div>
          </div>
        ))}
      </div>
      {!full && (
        <div className="mt-6">
          <Link href="/live" className="btn-ghost btn-sm">{t("live.title")} →</Link>
        </div>
      )}
    </div>
  );
}
