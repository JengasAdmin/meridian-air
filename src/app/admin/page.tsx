"use client";

import { useEffect, useState } from "react";
import { useLang } from "@/i18n/client";
import { StatCard, Skeleton } from "@/components/ui";

type Stats = {
  pilots: number; flights: number; aircraft: number; routes: number; hubs: number; liveNow: number;
};

export default function AdminDashboard() {
  const { t } = useLang();
  const [stats, setStats] = useState<Stats | null>(null);
  const [pilotsPending, setPilotsPending] = useState(0);
  const [bookingsActive, setBookingsActive] = useState(0);
  const [pirepsPending, setPirepsPending] = useState(0);

  useEffect(() => {
    fetch("/api/statistics").then((r) => r.json()).then((d) => setStats(d));
    fetch("/api/pilots/admin")
      .then((r) => r.json())
      .then((d) => setPilotsPending((d.pilots ?? []).filter((p: { status: string }) => p.status === "PENDING").length));
    fetch("/api/bookings")
      .then((r) => r.json())
      .then((d) => setBookingsActive((d.bookings ?? []).filter((b: { status: string }) => b.status === "BOOKED").length));
    fetch("/api/pireps")
      .then((r) => r.json())
      .then((d) => setPirepsPending((d.pireps ?? []).filter((p: { status: string }) => p.status === "PENDING").length));
  }, []);

  if (!stats) return <Skeleton className="h-96" />;

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <StatCard accent value={stats.pilots} label={t("admin.totalPilots")} />
      <StatCard value={pilotsPending} label={t("admin.pendingPilots")} />
      <StatCard value={bookingsActive} label={t("admin.activeBookings")} />
      <StatCard value={pirepsPending} label={t("admin.pendingPireps")} />
      <StatCard value={stats.flights} label={t("admin.totalFlights")} />
      <StatCard value={stats.aircraft} label={t("admin.fleetSize")} />
      <StatCard value={stats.routes} label={t("admin.routes")} />
      <StatCard value={stats.liveNow} label={t("home.liveOps")} />
    </div>
  );
}
