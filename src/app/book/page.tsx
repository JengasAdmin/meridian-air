"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useLang } from "@/i18n/client";
import { Skeleton, duration } from "@/components/ui";

type Me = { user: { pilotId: string | null; pilotStatus: string | null } | null };
type Route = {
  id: string; flightNumber: string; origin: string; originCity: string; originCityRu: string | null;
  dest: string; destCity: string; destCityRu: string | null; category: string;
  distanceNm: number; durationMin: number;
};
type Aircraft = { id: string; registration: string; name: string; type: string; category: string; status: string };
type Booking = { code: string };

const STEPS = ["book.step1", "book.step2", "book.step3", "book.step4", "book.step5", "book.step6", "book.step7"];
const NETWORKS = ["VATSIM", "IVAO", "OFFLINE"];

function BookWizard() {
  const { t, lang } = useLang();
  const router = useRouter();
  const params = useSearchParams();
  const [me, setMe] = useState<Me | null>(null);
  const [step, setStep] = useState(0);
  const [routes, setRoutes] = useState<Route[] | null>(null);
  const [fleet, setFleet] = useState<Aircraft[] | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmed, setConfirmed] = useState<Booking | null>(null);
  const [sel, setSel] = useState<{
    category?: string; route?: Route; aircraft?: Aircraft;
    network?: string; date?: string; time?: string; remarks?: string;
  }>({ network: "VATSIM" });

  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.json()).then(setMe);
    fetch("/api/routes").then((r) => r.json()).then((d) => setRoutes(d.routes));
    fetch("/api/fleet").then((r) => r.json()).then((d) => setFleet(d.fleet));
  }, []);

  // Prefill route from query (?route=...)
  useEffect(() => {
    const rid = params.get("route");
    if (rid && routes) {
      const r = routes.find((x) => x.id === rid);
      if (r) {
        setSel((s) => ({ ...s, category: r.category, route: r }));
        setStep(1);
      }
    }
  }, [params, routes]);

  const availableFleet = useMemo(
    () => (fleet ?? []).filter((a) => a.category === sel.category && ["ACTIVE", "RESERVED"].includes(a.status)),
    [fleet, sel.category]
  );

  async function confirm() {
    setBusy(true);
    setError("");
    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        routeId: sel.route!.id,
        aircraftId: sel.aircraft!.id,
        network: sel.network,
        scheduledAt: new Date(`${sel.date}T${sel.time ?? "12:00"}:00Z`).toISOString(),
        remarks: sel.remarks,
      }),
    });
    setBusy(false);
    if (res.ok) {
      const d = await res.json();
      setConfirmed(d.booking);
      setStep(6);
    } else {
      const d = await res.json();
      setError(d.error ?? t("error.generic"));
      setStep(5);
    }
  }

  if (me === null) return <div className="container-page section"><Skeleton className="h-96" /></div>;

  if (!me.user) {
    return (
      <div className="container-page max-w-md section">
        <div className="surface p-8 text-center">
          <div className="text-3xl text-electric" aria-hidden>✈</div>
          <p className="mt-4">{t("book.pilotOnly")}</p>
          <div className="mt-6 flex justify-center gap-3">
            <Link href="/login" className="btn-primary">{t("auth.signIn")}</Link>
            <Link href="/register" className="btn-ghost">{t("auth.signUp")}</Link>
          </div>
        </div>
      </div>
    );
  }
  if (me.user.pilotStatus === "PENDING") {
    return (
      <div className="container-page max-w-md section">
        <div className="surface p-8 text-center">
          <p className="mt-2">{t("auth.registerSuccess")}</p>
          <div className="mt-4 font-mono text-2xl text-electric">{me.user.pilotId}</div>
        </div>
      </div>
    );
  }

  const cats = ["PASSENGER", "CARGO", "MILITARY", "GENERAL", "SOVIET"];
  const catRoutes = (routes ?? []).filter((r) => r.category === sel.category);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="container-page max-w-3xl section">
      <h1 className="heading-lg">{t("book.title")}</h1>

      {/* Stepper */}
      <ol className="mt-8 mb-10 flex flex-wrap gap-2 text-xs">
        {STEPS.map((s, i) => (
          <li key={s} className={`rounded-full px-3 py-1.5 font-medium ${i === step ? "bg-electric text-white" : i < step ? "bg-electric/15 text-electric" : "bg-white/5 text-steel"}`}>
            {i + 1}. {t(s as never)}
          </li>
        ))}
      </ol>

      {error && <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>}

      {/* STEP 0: operation type */}
      {step === 0 && (
        <div className="grid gap-3 sm:grid-cols-2 animate-fade-in">
          {cats.map((c) => (
            <button key={c} onClick={() => { setSel((s) => ({ ...s, category: c, route: undefined, aircraft: undefined })); setStep(1); }}
              className="surface p-6 text-left transition-all hover:border-electric">
              <div className="font-mono text-xs uppercase tracking-widest text-electric">{c}</div>
              <div className="mt-2 font-semibold">{t(`op.${c}` as never)}</div>
              <div className="mt-1 text-sm text-steel">{t(`op.${c}.desc` as never)}</div>
            </button>
          ))}
        </div>
      )}

      {/* STEP 1: route */}
      {step === 1 && (
        <div className="animate-fade-in">
          <h2 className="heading-md mb-4">{t("book.chooseRoute")}</h2>
          {routes === null ? <Skeleton className="h-64" /> : (
            <div className="grid max-h-96 gap-2 overflow-y-auto pr-1">
              {catRoutes.map((r) => (
                <button key={r.id} onClick={() => { setSel((s) => ({ ...s, route: r })); setStep(2); }}
                  className={`surface flex items-center justify-between p-4 text-left hover:border-electric ${sel.route?.id === r.id ? "border-electric" : ""}`}>
                  <span className="font-mono font-semibold text-electric">{r.flightNumber}</span>
                  <span className="text-sm">
                    <span className="font-mono">{r.origin}</span> <span className="text-steel">{lang === "ru" ? r.originCityRu ?? r.originCity : r.originCity}</span>
                    {" → "}
                    <span className="font-mono">{r.dest}</span> <span className="text-steel">{lang === "ru" ? r.destCityRu ?? r.destCity : r.destCity}</span>
                  </span>
                  <span className="hidden text-xs text-steel sm:inline">{duration(r.durationMin, lang)}</span>
                </button>
              ))}
              {catRoutes.length === 0 && <p className="text-steel">{t("routes.empty")}</p>}
            </div>
          )}
          <div className="mt-6 flex gap-3">
            <button className="btn-ghost" onClick={() => setStep(0)}>{t("book.back")}</button>
          </div>
        </div>
      )}

      {/* STEP 2: aircraft */}
      {step === 2 && (
        <div className="animate-fade-in">
          <h2 className="heading-md mb-4">{t("book.chooseAircraft")}</h2>
          <div className="grid max-h-96 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
            {availableFleet.map((a) => (
              <button key={a.id} onClick={() => { setSel((s) => ({ ...s, aircraft: a })); setStep(3); }}
                className={`surface p-4 text-left hover:border-electric ${sel.aircraft?.id === a.id ? "border-electric" : ""}`}>
                <div className="font-mono text-sm text-electric">{a.registration}</div>
                <div className="mt-1 text-sm font-medium">{a.name}</div>
                <div className="text-xs text-steel">{a.type}</div>
              </button>
            ))}
          </div>
          <div className="mt-6 flex gap-3">
            <button className="btn-ghost" onClick={() => setStep(1)}>{t("book.back")}</button>
          </div>
        </div>
      )}

      {/* STEP 3: network */}
      {step === 3 && (
        <div className="animate-fade-in">
          <h2 className="heading-md mb-4">{t("book.chooseNetwork")}</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {NETWORKS.map((n) => (
              <button key={n} onClick={() => { setSel((s) => ({ ...s, network: n })); setStep(4); }}
                className={`surface p-6 text-center hover:border-electric ${sel.network === n ? "border-electric" : ""}`}>
                <div className="font-mono text-lg font-bold">{n}</div>
              </button>
            ))}
          </div>
          <div className="mt-6"><button className="btn-ghost" onClick={() => setStep(2)}>{t("book.back")}</button></div>
        </div>
      )}

      {/* STEP 4: date/time */}
      {step === 4 && (
        <div className="animate-fade-in">
          <h2 className="heading-md mb-4">{t("book.chooseDate")}</h2>
          <div className="surface max-w-md space-y-4 p-6">
            <div>
              <label className="label" htmlFor="bdate">{t("book.date")}</label>
              <input id="bdate" type="date" className="input" min={today} value={sel.date ?? ""} onChange={(e) => setSel((s) => ({ ...s, date: e.target.value }))} />
            </div>
            <div>
              <label className="label" htmlFor="btime">{t("book.time")}</label>
              <input id="btime" type="time" className="input" value={sel.time ?? ""} onChange={(e) => setSel((s) => ({ ...s, time: e.target.value }))} />
            </div>
            <div>
              <label className="label" htmlFor="bremarks">{t("book.remarks")}</label>
              <input id="bremarks" className="input" value={sel.remarks ?? ""} onChange={(e) => setSel((s) => ({ ...s, remarks: e.target.value }))} />
            </div>
          </div>
          <div className="mt-6 flex gap-3">
            <button className="btn-ghost" onClick={() => setStep(3)}>{t("book.back")}</button>
            <button className="btn-primary" disabled={!sel.date} onClick={() => setStep(5)}>{t("book.next")}</button>
          </div>
        </div>
      )}

      {/* STEP 5: review */}
      {step === 5 && (
        <div className="animate-fade-in">
          <h2 className="heading-md mb-4">{t("book.review")}</h2>
          <div className="surface space-y-3 p-6 text-sm">
            <div className="flex justify-between"><span className="text-steel">{t("routes.category")}</span><span>{t(`op.${sel.category}` as never)}</span></div>
            <div className="flex justify-between"><span className="text-steel">{t("routes.flight")}</span><span className="font-mono">{sel.route?.flightNumber}</span></div>
            <div className="flex justify-between"><span className="text-steel">{t("routes.from")} → {t("routes.to")}</span>
              <span className="font-mono">{sel.route?.origin} → {sel.route?.dest}</span></div>
            <div className="flex justify-between"><span className="text-steel">{t("pirep.aircraft")}</span><span>{sel.aircraft?.name} ({sel.aircraft?.registration})</span></div>
            <div className="flex justify-between"><span className="text-steel">{t("live.network")}</span><span className="font-mono">{sel.network}</span></div>
            <div className="flex justify-between"><span className="text-steel">{t("book.date")}</span>
              <span className="font-mono">{sel.date} {sel.time} {t("misc.utc")}</span></div>
          </div>
          <div className="mt-6 flex gap-3">
            <button className="btn-ghost" onClick={() => setStep(4)}>{t("book.back")}</button>
            <button className="btn-primary" disabled={busy} onClick={confirm}>{busy ? "…" : t("book.confirm")}</button>
          </div>
        </div>
      )}

      {/* STEP 6: confirmation */}
      {step === 6 && confirmed && (
        <div className="surface p-10 text-center animate-slide-up">
          <div className="text-4xl" aria-hidden>✅</div>
          <h2 className="heading-md mt-4">{t("book.booked")}</h2>
          <p className="mt-2 text-steel">{t("book.bookedSub")}</p>
          <div className="mx-auto mt-6 w-fit rounded-2xl border border-electric/40 bg-electric/10 px-8 py-4">
            <div className="text-xs uppercase tracking-wider text-steel">{t("book.bookingId")}</div>
            <div className="font-mono text-2xl font-bold text-electric">{confirmed.code}</div>
          </div>
          <div className="mt-8 flex justify-center gap-3">
            <Link href="/profile" className="btn-primary">{t("profile.myBookings")}</Link>
            <button className="btn-ghost" onClick={() => { setConfirmed(null); setSel({ network: "VATSIM" }); setStep(0); }}>
              {t("home.bookNow")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function BookPage() {
  return <Suspense fallback={<div className="container-page section"><Skeleton className="h-96" /></div>}><BookWizard /></Suspense>;
}
