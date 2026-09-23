"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLang } from "@/i18n/client";

const SECTIONS: { href: string; key: string; perm?: string }[] = [
  { href: "/admin", key: "admin.dashboard" },
  { href: "/admin/pilots", key: "admin.pilots", perm: "PILOTS.READ" },
  { href: "/admin/bookings", key: "admin.bookings", perm: "BOOKINGS.READ" },
  { href: "/admin/pireps", key: "admin.pireps", perm: "PIREP.READ" },
  { href: "/admin/fleet", key: "admin.fleet", perm: "FLEET.READ" },
  { href: "/admin/routes", key: "admin.routes", perm: "ROUTES.READ" },
  { href: "/admin/roles", key: "admin.roles", perm: "ROLES.READ" },
  { href: "/admin/news", key: "admin.news", perm: "NEWS.CREATE" },
  { href: "/admin/settings", key: "admin.discord", perm: "SYSTEM.READ" },
  { href: "/admin/audit", key: "admin.logs", perm: "AUDIT.READ" },
];

export function AdminNav() {
  const { t } = useLang();
  const pathname = usePathname();
  const [perms, setPerms] = useState<Set<string> | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setPerms(new Set(d.user?.permissions ?? [])));
  }, []);

  if (perms === null) return null;
  const visible = SECTIONS.filter((s) => !s.perm || perms.has(s.perm) || perms.has("SYSTEM.CONFIGURE"));

  return (
    <nav className="flex flex-wrap gap-1.5 lg:flex-col" aria-label="Admin">
      {visible.map((s) => (
        <Link
          key={s.href}
          href={s.href}
          className={`rounded-xl px-4 py-2.5 text-sm transition-colors ${
            pathname === s.href ? "bg-electric/15 font-semibold text-electric" : "text-steel hover:bg-white/5 hover:text-mist"
          }`}
        >
          {t(s.key as never)}
        </Link>
      ))}
    </nav>
  );
}
