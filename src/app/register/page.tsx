"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLang } from "@/i18n/client";

type Hub = { code: string; city: string; cityRu: string | null };

export default function RegisterPage() {
  const { t, lang, setLang } = useLang();
  const router = useRouter();
  const [hubs, setHubs] = useState<Hub[]>([]);
  const [form, setForm] = useState({
    name: "", email: "", password: "", vatsimCid: "", ivaoVid: "",
    discordId: "", hubCode: "UMKK", interests: "", agreeRules: false,
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/hubs").then((r) => r.json()).then((d) => setHubs(d.hubs ?? []));
  }, []);

  function set(key: keyof typeof form, value: string | boolean) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, locale: lang }),
    });
    setBusy(false);
    if (res.ok) {
      router.push("/profile");
      router.refresh();
    } else {
      const d = await res.json();
      setError(d.error ?? t("error.generic"));
    }
  }

  return (
    <div className="container-page flex min-h-[80vh] items-start justify-center py-16">
      <form onSubmit={submit} className="surface w-full max-w-2xl p-8">
        <h1 className="heading-md">{t("auth.signUp")}</h1>
        <p className="mt-2 text-sm text-steel">{t("home.ctaSub")}</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="name">{t("auth.name")} *</label>
            <input id="name" required minLength={2} className="input" value={form.name} onChange={(e) => set("name", e.target.value)} autoComplete="name" />
          </div>
          <div>
            <label className="label" htmlFor="email">{t("auth.email")} *</label>
            <input id="email" type="email" required className="input" value={form.email} onChange={(e) => set("email", e.target.value)} autoComplete="email" />
          </div>
          <div>
            <label className="label" htmlFor="password">{t("auth.password")} *</label>
            <input id="password" type="password" required minLength={8} className="input" value={form.password} onChange={(e) => set("password", e.target.value)} autoComplete="new-password" />
          </div>
          <div>
            <label className="label" htmlFor="vatsim">{t("auth.vatsimCid")}</label>
            <input id="vatsim" className="input" value={form.vatsimCid} onChange={(e) => set("vatsimCid", e.target.value)} inputMode="numeric" />
          </div>
          <div>
            <label className="label" htmlFor="ivao">{t("auth.ivaoVid")}</label>
            <input id="ivao" className="input" value={form.ivaoVid} onChange={(e) => set("ivaoVid", e.target.value)} inputMode="numeric" />
          </div>
          <div>
            <label className="label" htmlFor="discord">{t("auth.discordId")}</label>
            <input id="discord" className="input" value={form.discordId} onChange={(e) => set("discordId", e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="hub">{t("auth.preferredHub")}</label>
            <select id="hub" className="input" value={form.hubCode} onChange={(e) => set("hubCode", e.target.value)}>
              {hubs.map((h) => (
                <option key={h.code} value={h.code}>
                  {h.code} — {lang === "ru" ? h.cityRu ?? h.city : h.city}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="interests">{t("auth.interests")}</label>
            <input id="interests" className="input" value={form.interests} onChange={(e) => set("interests", e.target.value)} placeholder="PASSENGER / CARGO / MILITARY…" />
          </div>
        </div>
        <label className="mt-6 flex items-start gap-3 text-sm text-steel">
          <input type="checkbox" required checked={form.agreeRules} onChange={(e) => set("agreeRules", e.target.checked)} className="mt-1 h-4 w-4 accent-[#1769FF]" />
          {t("auth.agreeRules")}
        </label>
        {error && <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">{error}</div>}
        <button className="btn-primary mt-6 w-full" disabled={busy}>{busy ? t("auth.registering") : t("auth.signUp")}</button>
        <p className="mt-4 text-sm text-steel">
          {t("auth.hasAccount")}{" "}
          <Link href="/login" className="text-electric hover:underline">{t("auth.signIn")}</Link>
        </p>
      </form>
    </div>
  );
}
