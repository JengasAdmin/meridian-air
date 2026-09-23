"use client";

import { useLang } from "@/i18n/client";
import { StatusBadge, Skeleton, duration } from "@/components/ui";
import { useAdminData } from "@/hooks/useAdminData";

type Booking = {
  id: string; code: string; flightNumber: string; origin: string; dest: string;
  aircraft: string; network: string; status: string; scheduledAt: string; pilot: string;
};
type Pirep = {
  id: string; code: string; flightNumber: string; origin: string; destCode: string;
  durationMin: number; status: string; pilot: string; network: string; remarks: string | null;
};

export default function AdminBookingsPage() {
  const { t, lang } = useLang();
  const { data: bookings, load } = useAdminData<Booking>("/api/bookings");

  async function cancel(id: string) {
    await fetch(`/api/bookings/${id}`, { method: "PATCH" });
    load();
  }

  if (!bookings) return <Skeleton className="h-96" />;
  return (
    <div className="surface overflow-x-auto">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead className="border-b border-white/10 text-xs uppercase tracking-wider text-steel">
          <tr>
            <th className="px-4 py-3">ID</th>
            <th className="px-4 py-3">{t("routes.flight")}</th>
            <th className="px-4 py-3">{t("routes.from")} → {t("routes.to")}</th>
            <th className="px-4 py-3">{t("pilots.pilotId")}</th>
            <th className="px-4 py-3">{t("live.network")}</th>
            <th className="px-4 py-3">{t("book.date")}</th>
            <th className="px-4 py-3">{t("pilots.status")}</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {bookings.map((b) => (
            <tr key={b.id} className="border-b border-white/5 last:border-0">
              <td className="px-4 py-3 font-mono text-electric">{b.code}</td>
              <td className="px-4 py-3 font-mono">{b.flightNumber}</td>
              <td className="px-4 py-3 font-mono">{b.origin} → {b.dest}</td>
              <td className="px-4 py-3">{b.pilot}</td>
              <td className="px-4 py-3">{b.network}</td>
              <td className="px-4 py-3 font-mono text-xs">{new Date(b.scheduledAt).toLocaleString(lang === "ru" ? "ru-RU" : "en-US")}</td>
              <td className="px-4 py-3"><StatusBadge status={b.status} /></td>
              <td className="px-4 py-3 text-right">
                {b.status === "BOOKED" && (
                  <button className="btn-danger btn-sm" onClick={() => cancel(b.id)}>{t("admin.cancel")}</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
