"use client";

import { useEffect, useState } from "react";
import { useLang } from "@/i18n/client";
import { Skeleton } from "@/components/ui";

type Role = {
  key: string; nameRu: string; nameEn: string; department: string; rank: number;
  isPilotRank: boolean; permissions: string[]; userCount: number;
};

export default function AdminRolesPage() {
  const { t, lang } = useLang();
  const [roles, setRoles] = useState<Role[] | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/roles").then((r) => r.json()).then((d) => setRoles(d.roles ?? []));
  }, []);

  if (!roles) return <Skeleton className="h-96" />;

  return (
    <div className="space-y-2">
      {roles.map((r) => (
        <div key={r.key} className="surface">
          <button
            className="flex w-full items-center justify-between p-4 text-left text-sm"
            onClick={() => setOpen(open === r.key ? null : r.key)}
            aria-expanded={open === r.key}
          >
            <div>
              <span className="font-medium">{lang === "ru" ? r.nameRu : r.nameEn}</span>
              <span className="ml-3 text-xs text-steel">{r.department} · rank {r.rank}</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-steel">
              <span>{r.permissions.length} perms</span>
              <span>{r.userCount} users</span>
              <span aria-hidden>{open === r.key ? "▴" : "▾"}</span>
            </div>
          </button>
          {open === r.key && (
            <div className="flex flex-wrap gap-1.5 border-t border-white/10 p-4">
              {r.permissions.length === 0 && <span className="text-xs text-steel">—</span>}
              {r.permissions.map((p) => (
                <span key={p} className="badge bg-electric/10 font-mono text-[11px] text-electric">{p}</span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
