"use client";

import Link from "next/link";
import { useLang } from "@/i18n/client";

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`surface p-6 shadow-card transition-transform duration-200 ${className}`}>{children}</div>;
}

export function SectionTitle({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-10">
      <h2 className="heading-lg">{title}</h2>
      {sub && <p className="mt-2 max-w-2xl text-steel">{sub}</p>}
    </div>
  );
}

export function StatCard({ value, label, accent = false }: { value: string | number; label: string; accent?: boolean }) {
  return (
    <div className="surface p-6">
      <div className={`font-mono text-3xl font-bold tracking-tight sm:text-4xl ${accent ? "text-electric" : "text-mist"}`}>
        {value}
      </div>
      <div className="mt-1.5 text-sm text-steel">{label}</div>
    </div>
  );
}

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-emerald-500/15 text-emerald-400",
  IN_SERVICE: "bg-amber-500/15 text-amber-400",
  MAINTENANCE: "bg-amber-500/15 text-amber-400",
  RESERVED: "bg-sky-500/15 text-sky-400",
  RETIRED: "bg-white/10 text-steel",
  UNAVAILABLE: "bg-red-500/15 text-red-400",
  PENDING: "bg-amber-500/15 text-amber-400",
  VERIFIED: "bg-emerald-500/15 text-emerald-400",
  SUSPENDED: "bg-red-500/15 text-red-400",
  INACTIVE: "bg-white/10 text-steel",
  APPROVED: "bg-emerald-500/15 text-emerald-400",
  REJECTED: "bg-red-500/15 text-red-400",
  CANCELLED: "bg-white/10 text-steel",
  BOOKED: "bg-electric/15 text-electric",
  COMPLETED: "bg-emerald-500/15 text-emerald-400",
  NO_SHOW: "bg-red-500/15 text-red-400",
};

export function StatusBadge({ status, prefix = "status" }: { status: string; prefix?: string }) {
  const { t } = useLang();
  const key = `${prefix}.${status}`;
  const label = t(key as never) === key ? status : t(key as never);
  return (
    <span className={`badge ${STATUS_COLORS[status] ?? "bg-white/10 text-steel"}`}>{label}</span>
  );
}

export function EmptyState({ titleKey, subKey, ctaHref, ctaKey }: { titleKey: string; subKey?: string; ctaHref?: string; ctaKey?: string }) {
  const { t } = useLang();
  return (
    <div className="surface flex flex-col items-center gap-3 px-6 py-14 text-center">
      <div className="text-3xl text-electric" aria-hidden>✈</div>
      <div className="font-semibold text-mist">{t(titleKey as never)}</div>
      {subKey && <p className="max-w-md text-sm text-steel">{t(subKey as never)}</p>}
      {ctaHref && ctaKey && (
        <Link href={ctaHref} className="btn-primary btn-sm mt-2">{t(ctaKey as never)}</Link>
      )}
    </div>
  );
}

export function Skeleton({ className = "h-40" }: { className?: string }) {
  return <div className={`skeleton ${className}`} aria-hidden />;
}

export function duration(minutes: number, lang: string) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return lang === "ru" ? `${h} ч ${m} м` : `${h}h ${m}m`;
}
