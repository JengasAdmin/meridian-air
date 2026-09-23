"use client";

import { useEffect, useState } from "react";
import { useLang } from "@/i18n/client";
import { AdminNav } from "@/components/AdminNav";
import { Skeleton } from "@/components/ui";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { t } = useLang();
  const [state, setState] = useState<"loading" | "ok" | "denied">("loading");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        const perms: string[] = d.user?.permissions ?? [];
        setState(perms.length > 0 ? "ok" : "denied");
      })
      .catch(() => setState("denied"));
  }, []);

  return (
    <div className="container-page section">
      <h1 className="heading-lg">{t("admin.title")}</h1>
      <div className="mt-8 grid gap-8 lg:grid-cols-[220px_1fr]">
        <aside><AdminNav /></aside>
        <div className="min-w-0">
          {state === "loading" ? <Skeleton className="h-96" /> : state === "denied" ? (
            <div className="surface p-10 text-center">
              <div className="font-mono text-5xl text-red-400">403</div>
              <p className="mt-4 text-steel">{t("admin.noAccess")}</p>
            </div>
          ) : (
            children
          )}
        </div>
      </div>
    </div>
  );
}
