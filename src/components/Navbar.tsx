"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useLang } from "@/i18n/client";

type SessionDto = {
  name: string;
  email: string;
  pilotId: string | null;
  pilotStatus: string | null;
  isAdmin: boolean;
} | null;

const PUBLIC_LINKS: [string, string][] = [
  ["/fleet", "nav.fleet"],
  ["/routes", "nav.routes"],
  ["/hubs", "nav.hubs"],
  ["/pilots", "nav.pilots"],
  ["/academy", "nav.academy"],
  ["/news", "nav.news"],
  ["/about", "nav.about"],
];

const OPS_MENU: [string, string, string, string][] = [
  ["/live", "ops.liveFlights", "ops.liveFlightsDesc", "◉"],
  ["/book", "ops.booking", "ops.bookingDesc", "✈"],
  ["/profile", "ops.reports", "ops.reportsDesc", "▤"],
  ["/statistics", "ops.statistics", "ops.statisticsDesc", "▲"],
];

export function Navbar({ session }: { session: SessionDto }) {
  const { t, lang, setLang } = useLang();
  const router = useRouter();
  const [opsOpen, setOpsOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);

  async function signOut() {
    await fetch("/api/auth/signout", { method: "POST" });
    setUserOpen(false);
    router.push("/");
    router.refresh();
  }

  return (
    <header className="glass fixed inset-x-0 top-0 z-50 border-b border-white/10">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <Image src="/tailfin-hero.png" alt="Meridian AIR" width={32} height={32} className="h-8 w-8 rounded-md object-cover" />
          <span className="text-sm font-bold tracking-widest text-mist">
            MERIDIAN <span className="text-electric">AIR</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 text-sm lg:flex" aria-label="Main">
          <div
            className="relative"
            onMouseEnter={() => setOpsOpen(true)}
            onMouseLeave={() => setOpsOpen(false)}
          >
            <button
              className="rounded-lg px-3 py-2 font-medium text-steel transition-colors hover:text-mist"
              aria-expanded={opsOpen}
              aria-haspopup="true"
            >
              {t("nav.operations")} ▾
            </button>
            {opsOpen && (
              <div className="glass absolute left-0 top-full w-80 rounded-2xl p-2 shadow-card animate-fade-in">
                {OPS_MENU.map(([href, title, desc, icon]) => (
                  <Link
                    key={href}
                    href={href}
                    className="flex items-start gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-white/5"
                    onClick={() => setOpsOpen(false)}
                  >
                    <span className="mt-0.5 text-electric">{icon}</span>
                    <span>
                      <span className="block font-semibold text-mist">{t(title)}</span>
                      <span className="block text-xs text-steel">{t(desc)}</span>
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
          {PUBLIC_LINKS.map(([href, key]) => (
            <Link key={href} href={href} className="rounded-lg px-3 py-2 font-medium text-steel transition-colors hover:text-mist">
              {t(key)}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setLang(lang === "ru" ? "en" : "ru")}
            className="rounded-lg border border-white/15 px-2.5 py-1.5 text-xs font-bold text-steel transition-colors hover:border-electric hover:text-electric"
            aria-label={t("misc.language")}
          >
            {lang.toUpperCase()} / {lang === "ru" ? "EN" : "RU"}
          </button>
          <Link href="/book" className="btn-primary btn-sm hidden sm:inline-flex">
            {t("nav.bookFlight")}
          </Link>
          {session ? (
            <div className="relative">
              <button
                onClick={() => setUserOpen(!userOpen)}
                className="flex items-center gap-2 rounded-xl border border-white/15 px-3 py-1.5 text-sm text-mist hover:border-electric"
                aria-haspopup="true"
                aria-expanded={userOpen}
              >
                <span className="hidden max-w-28 truncate sm:inline">{session.pilotId ?? session.name}</span>
                <span aria-hidden>▾</span>
              </button>
              {userOpen && (
                <div className="glass absolute right-0 top-full mt-2 w-52 rounded-2xl p-2 shadow-card animate-fade-in">
                  <Link href="/profile" className="block rounded-xl px-3 py-2 text-sm hover:bg-white/5" onClick={() => setUserOpen(false)}>
                    {t("nav.profile")}
                  </Link>
                  {session.isAdmin && (
                    <Link href="/admin" className="block rounded-xl px-3 py-2 text-sm hover:bg-white/5" onClick={() => setUserOpen(false)}>
                      {t("nav.admin")}
                    </Link>
                  )}
                  <button onClick={signOut} className="block w-full rounded-xl px-3 py-2 text-left text-sm text-red-400 hover:bg-white/5">
                    {t("nav.signOut")}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link href="/login" className="btn-ghost btn-sm">
              {t("nav.signIn")}
            </Link>
          )}
          <button
            className="rounded-lg p-2 text-mist lg:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={t("nav.menu")}
            aria-expanded={mobileOpen}
          >
            ☰
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav className="glass border-t border-white/10 px-4 py-3 lg:hidden animate-fade-in" aria-label="Mobile">
          <div className="flex flex-col gap-1 text-sm">
            {[["/live", "ops.liveFlights"], ["/book", "ops.booking"], ...PUBLIC_LINKS, ["/statistics", "nav.statistics"]].map(
              ([href, key]) => (
                <Link
                  key={href}
                  href={href}
                  className="rounded-lg px-3 py-2.5 text-steel hover:bg-white/5 hover:text-mist"
                  onClick={() => setMobileOpen(false)}
                >
                  {t(key)}
                </Link>
              )
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
