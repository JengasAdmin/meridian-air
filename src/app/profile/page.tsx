"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLang } from "@/i18n/client";
import { Skeleton, StatusBadge, EmptyState, duration } from "@/components/ui";

type Me = {
  user: { name: string; email: string; pilotId: string | null; pilotStatus: string | null; roles: { nameRu: string; nameEn: string }[] } | null;
};
type Profile = {
  pilotId: string; status: string; hours: number; flights: number; distanceNm: number;
  hub: string | null; joinDate: string; rank: { nameRu: string; nameEn: string } | null;
};
type Booking = {
  id: string; code: string; flightNumber: string; origin: string; dest: string;
  aircraft: string; network: string; status: string; scheduledAt: string; isMine: boolean;
};
type Pirep = {
  id: string; code: string; flightNumber: string; origin: string; destCode: string;
  durationMin: number; status: string; aircraft: string; network: string;
};
type AircraftLite = { id: string; name: string; registration: string };

export default function ProfilePage() {
  const { t, lang } = useLang();
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [pireps, setPireps] = useState<Pirep[] | null>(null);
  const [fleet, setFleet] = useState<AircraftLite[]>([]);
  const [showPirep, setShowPirep] = useState(false);
  const [pirepMsg, setPirepMsg] = useState("");
  const [pirepForm, setPirepForm] = useState({
    aircraftId: "", originCode: "", destCode: "", flightNumber: "", callsign: "",
    network: "VATSIM", depTime: "", arrTime: "", distanceNm: "", remarks: "",
  });

  const load = useCallback(async () => {
    const meRes = await fetch("/api/auth/me");
    const meData: Me = await meRes.json();
    setMe(meData);
    if (meData.user) {
      const [pilotsRes, bookingsRes, pirepsRes, fleetRes] = await Promise.all([
        fetch("/api/pilots"), fetch("/api/bookings"), fetch("/api/pireps"), fetch("/api/fleet"),
      ]);
      const pilots = await pilotsRes.json();
      setProfile(pilots.pilots?.find((p: { pilotId: string | null }) => p.pilotId === meData.user!.pilotId) ?? null);
      setBookings((await bookingsRes.json()).bookings);
      setPireps((await pirepsRes.json()).pireps);
      setFleet((await fleetRes.json()).fleet);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function cancelBooking(id: string) {
    await fetch(`/api/bookings/${id}`, { method: "PATCH" });
    load();
  }

  async function submitPirep(e: React.FormEvent) {
    e.preventDefault();
    setPirepMsg("");
    const res = await fetch("/api/pireps", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        aircraftId: pirepForm.aircraftId,
        originCode: pirepForm.originCode.toUpperCase(),
        destCode: pirepForm.destCode.toUpperCase(),
        flightNumber: pirepForm.flightNumber,
        callsign: pirepForm.callsign,
        network: pirepForm.network,
        depTime: new Date(pirepForm.depTime).toISOString(),
        arrTime: new Date(pirepForm.arrTime).toISOString(),
        distanceNm: parseFloat(pirepForm.distanceNm) || 100,
        remarks: pirepForm.remarks || undefined,
      }),
    });
    if (res.ok) {
      setPirepMsg(t("pirep.submitted"));
      setShowPirep(false);
      setPirepForm({ aircraftId: "", originCode: "", destCode: "", flightNumber: "", callsign: "", network: "VATSIM", depTime: "", arrTime: "", distanceNm: "", remarks: "" });
      load();
    } else {
      const d = await res.json();
      setPirepMsg(d.error ?? t("error.generic"));
    }
  }

  if (me === null) return <div className="container-page section"><Skeleton className="h-96" /></div>;
  if (!me.user) {
    router.push("/login");
    return null;
  }

  return (
    <div className="container-page section">
      {/* Header */}
      <div className="surface flex flex-wrap items-center justify-between gap-6 p-8">
        <div>
          <div className="font-mono text-sm text-electric">{me.user.pilotId}</div>
          <h1 className="heading-md mt-1">{me.user.name}</h1>
          <div className="mt-2 flex flex-wrap gap-2 text-xs">
            {me.user.roles.map((r, i) => (
              <span key={i} className="badge bg-white/5 text-steel">{lang === "ru" ? r.nameRu : r.nameEn}</span>
            ))}
          </div>
        </div>
        <div className="flex gap-8 text-center">
          <div>
            <div className="font-mono text-2xl text-electric">{profile ? Math.round(profile.hours) : "—"}</div>
            <div className="text-xs text-steel">{t("profile.hours")}</div>
          </div>
          <div>
            <div className="font-mono text-2xl text-electric">{profile?.flights ?? "—"}</div>
            <div className="text-xs text-steel">{t("pilots.flights")}</div>
          </div>
          <div>
            <div className="font-mono text-2xl text-electric">{profile ? `${Math.round(profile.distanceNm).toLocaleString()} nm` : "—"}</div>
            <div className="text-xs text-steel">{t("profile.distance")}</div>
          </div>
        </div>
      </div>

      {/* Bookings */}
      <div className="mt-10 flex items-center justify-between">
        <h2 className="heading-md">{t("profile.myBookings")}</h2>
        <div className="flex gap-3">
          <button className="btn-ghost btn-sm" onClick={() => setShowPirep(!showPirep)}>{t("profile.newPirep")}</button>
          <Link href="/book" className="btn-primary btn-sm">{t("home.bookNow")}</Link>
        </div>
      </div>
      <div className="mt-4 space-y-2">
        {bookings === null ? <Skeleton className="h-24" /> : bookings.length === 0 ? (
          <EmptyState titleKey="profile.noBookings" ctaHref="/book" ctaKey="home.bookNow" />
        ) : (
          bookings.map((b) => (
            <div key={b.id} className="surface flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
              <div className="flex items-center gap-4">
                <span className="font-mono text-electric">{b.code}</span>
                <span className="font-mono font-semibold">{b.flightNumber}</span>
                <span>{b.origin} → {b.dest}</span>
                <span className="hidden text-steel sm:inline">{b.aircraft}</span>
                <span className="badge bg-white/5 text-steel">{b.network}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="hidden font-mono text-xs text-steel md:inline">
                  {new Date(b.scheduledAt).toLocaleString(lang === "ru" ? "ru-RU" : "en-US")}
                </span>
                <StatusBadge status={b.status} />
                {b.status === "BOOKED" && b.isMine && (
                  <button className="btn-danger btn-sm" onClick={() => cancelBooking(b.id)}>{t("profile.cancelBooking")}</button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* PIREP form */}
      {showPirep && (
        <form onSubmit={submitPirep} className="surface mt-6 grid gap-4 p-6 sm:grid-cols-3 animate-slide-up">
          <div>
            <label className="label" htmlFor="pf">{t("pirep.flightNumber")}</label>
            <input id="pf" required className="input" placeholder="MRD101" value={pirepForm.flightNumber} onChange={(e) => setPirepForm((f) => ({ ...f, flightNumber: e.target.value }))} />
          </div>
          <div>
            <label className="label" htmlFor="pc">{t("pirep.callsign")}</label>
            <input id="pc" required className="input" placeholder="MRD101" value={pirepForm.callsign} onChange={(e) => setPirepForm((f) => ({ ...f, callsign: e.target.value }))} />
          </div>
          <div>
            <label className="label" htmlFor="pa">{t("pirep.aircraft")}</label>
            <select id="pa" required className="input" value={pirepForm.aircraftId} onChange={(e) => setPirepForm((f) => ({ ...f, aircraftId: e.target.value }))}>
              <option value="">—</option>
              {fleet.map((a) => <option key={a.id} value={a.id}>{a.name} ({a.registration})</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="po">{t("pirep.origin")}</label>
            <input id="po" required maxLength={4} className="input" placeholder="UMKK" value={pirepForm.originCode} onChange={(e) => setPirepForm((f) => ({ ...f, originCode: e.target.value }))} />
          </div>
          <div>
            <label className="label" htmlFor="pd">{t("pirep.dest")}</label>
            <input id="pd" required maxLength={4} className="input" placeholder="UUEE" value={pirepForm.destCode} onChange={(e) => setPirepForm((f) => ({ ...f, destCode: e.target.value }))} />
          </div>
          <div>
            <label className="label" htmlFor="pn">{t("pirep.network")}</label>
            <select id="pn" className="input" value={pirepForm.network} onChange={(e) => setPirepForm((f) => ({ ...f, network: e.target.value }))}>
              {["VATSIM", "IVAO", "OFFLINE"].map((n) => <option key={n}>{n}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="pdep">{t("pirep.depTime")}</label>
            <input id="pdep" required type="datetime-local" className="input" value={pirepForm.depTime} onChange={(e) => setPirepForm((f) => ({ ...f, depTime: e.target.value }))} />
          </div>
          <div>
            <label className="label" htmlFor="parr">{t("pirep.arrTime")}</label>
            <input id="parr" required type="datetime-local" className="input" value={pirepForm.arrTime} onChange={(e) => setPirepForm((f) => ({ ...f, arrTime: e.target.value }))} />
          </div>
          <div>
            <label className="label" htmlFor="pdist">{t("pirep.distance")}</label>
            <input id="pdist" required type="number" min={1} className="input" value={pirepForm.distanceNm} onChange={(e) => setPirepForm((f) => ({ ...f, distanceNm: e.target.value }))} />
          </div>
          <div className="sm:col-span-3">
            <label className="label" htmlFor="prem">{t("pirep.remarks")}</label>
            <input id="prem" className="input" value={pirepForm.remarks} onChange={(e) => setPirepForm((f) => ({ ...f, remarks: e.target.value }))} />
          </div>
          {pirepMsg && <div className="rounded-xl border border-electric/30 bg-electric/10 px-4 py-2.5 text-sm sm:col-span-3">{pirepMsg}</div>}
          <div className="sm:col-span-3">
            <button className="btn-primary" disabled={!pirepForm.aircraftId}>{t("pirep.submit")}</button>
          </div>
        </form>
      )}

      {/* PIREPs */}
      <h2 className="heading-md mt-10">{t("profile.myPireps")}</h2>
      <div className="mt-4 space-y-2">
        {pireps === null ? <Skeleton className="h-24" /> : pireps.length === 0 ? (
          <EmptyState titleKey="profile.noPireps" />
        ) : (
          pireps.map((p) => (
            <div key={p.id} className="surface flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
              <div className="flex items-center gap-4">
                <span className="font-mono text-electric">{p.code}</span>
                <span className="font-mono font-semibold">{p.flightNumber}</span>
                <span>{p.origin} → {p.destCode}</span>
                <span className="text-steel">{duration(p.durationMin, lang)}</span>
                <span className="badge bg-white/5 text-steel">{p.network}</span>
              </div>
              <StatusBadge status={p.status} prefix="pirep.status" />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
