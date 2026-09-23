"use client";

import Link from "next/link";
import { useLang } from "@/i18n/client";

export function Footer() {
  const { t } = useLang();
  return (
    <footer className="border-t border-white/10 bg-navy/40">
      <div className="container-page grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="text-sm font-bold tracking-widest text-mist">
            MERIDIAN <span className="text-electric">AIR</span>
          </div>
          <p className="mt-3 text-sm text-steel">{t("footer.tagline")}</p>
          <p className="mt-2 text-xs text-steel/70">{t("footer.networks")}</p>
        </div>
        <div>
          <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-steel">{t("footer.operations")}</div>
          <ul className="space-y-2 text-sm">
            {[["/live", "ops.liveFlights"], ["/book", "ops.booking"], ["/profile", "ops.reports"], ["/statistics", "ops.statistics"]].map(
              ([href, key]) => (
                <li key={href}>
                  <Link href={href} className="link-muted">{t(key)}</Link>
                </li>
              )
            )}
          </ul>
        </div>
        <div>
          <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-steel">{t("footer.company")}</div>
          <ul className="space-y-2 text-sm">
            {[["/fleet", "nav.fleet"], ["/hubs", "nav.hubs"], ["/academy", "nav.academy"], ["/news", "nav.news"], ["/about", "nav.about"]].map(
              ([href, key]) => (
                <li key={href}>
                  <Link href={href} className="link-muted">{t(key)}</Link>
                </li>
              )
            )}
          </ul>
        </div>
        <div className="text-xs leading-relaxed text-steel/70">
          <div className="mb-2 flex gap-2">
            <span className="badge bg-electric/15 text-electric">VATSIM</span>
            <span className="badge bg-electric/15 text-electric">IVAO</span>
          </div>
          {t("footer.legal")}
        </div>
      </div>
      <div className="border-t border-white/5 py-5 text-center text-xs text-steel/60">
        © {new Date().getFullYear()} Meridian AIR · ICAO: MRD
      </div>
    </footer>
  );
}
