"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLang } from "@/i18n/client";

export default function LoginPage() {
  const { t } = useLang();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
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
    <div className="container-page flex min-h-[80vh] items-center justify-center py-16">
      <form onSubmit={submit} className="surface w-full max-w-md p-8">
        <h1 className="heading-md">{t("auth.signIn")}</h1>
        <div className="mt-6 space-y-4">
          <div>
            <label className="label" htmlFor="email">{t("auth.email")}</label>
            <input id="email" type="email" required className="input" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          </div>
          <div>
            <label className="label" htmlFor="password">{t("auth.password")}</label>
            <input id="password" type="password" required className="input" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
          </div>
        </div>
        {error && <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">{error}</div>}
        <button className="btn-primary mt-6 w-full" disabled={busy}>{busy ? t("auth.signingIn") : t("auth.signIn")}</button>
        <p className="mt-4 text-sm text-steel">
          {t("auth.noAccount")}{" "}
          <Link href="/register" className="text-electric hover:underline">{t("auth.signUp")}</Link>
        </p>
      </form>
    </div>
  );
}
