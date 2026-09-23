"use client";

import { useEffect, useState } from "react";
import { useLang } from "@/i18n/client";
import { Skeleton } from "@/components/ui";

type Log = {
  id: string; action: string; target: string | null; user: string;
  newValue: string | null; ip: string | null; createdAt: string;
};

export default function AdminAuditPage() {
  const { t } = useLang();
  const [logs, setLogs] = useState<Log[] | null>(null);

  useEffect(() => {
    fetch("/api/admin/audit").then((r) => r.json()).then((d) => setLogs(d.logs ?? []));
  }, []);

  if (!logs) return <Skeleton className="h-96" />;

  return (
    <div className="surface overflow-x-auto">
      <table className="w-full min-w-[680px] text-left text-sm">
        <thead className="border-b border-white/10 text-xs uppercase tracking-wider text-steel">
          <tr>
            <th className="px-4 py-3">{t("admin.when")}</th>
            <th className="px-4 py-3">{t("admin.user")}</th>
            <th className="px-4 py-3">{t("admin.action")}</th>
            <th className="px-4 py-3">{t("admin.target")}</th>
            <th className="px-4 py-3">IP</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((l) => (
            <tr key={l.id} className="border-b border-white/5 last:border-0">
              <td className="px-4 py-3 font-mono text-xs text-steel">{new Date(l.createdAt).toLocaleString()}</td>
              <td className="px-4 py-3 font-mono text-electric">{l.user}</td>
              <td className="px-4 py-3">
                <span className="badge bg-white/5 font-mono text-xs">{l.action}</span>
              </td>
              <td className="px-4 py-3 font-mono">{l.target ?? "—"}</td>
              <td className="px-4 py-3 font-mono text-xs text-steel">{l.ip ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
