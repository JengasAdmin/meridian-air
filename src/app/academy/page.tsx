"use client";

import { useEffect, useState } from "react";
import { useLang } from "@/i18n/client";
import { SectionTitle, Skeleton } from "@/components/ui";

type Course = { id: string; key: string; titleRu: string; titleEn: string; descriptionRu: string; descriptionEn: string; category: string; durationH: number };
type Instructor = { name: string; pilotId: string | null; roleRu: string; roleEn: string };

export default function AcademyPage() {
  const { t, lang } = useLang();
  const [data, setData] = useState<{ courses: Course[]; instructors: Instructor[] } | null>(null);
  const [enrolled, setEnrolled] = useState<Record<string, boolean>>({});
  const [msg, setMsg] = useState("");

  async function load() {
    const res = await fetch("/api/academy");
    setData(await res.json());
  }
  useEffect(() => {
    load();
  }, []);

  async function enroll(courseId: string) {
    setMsg("");
    const res = await fetch("/api/academy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId }),
    });
    if (res.ok) {
      setEnrolled((e) => ({ ...e, [courseId]: true }));
      setMsg(t("academy.enrolled"));
    } else {
      const d = await res.json();
      setMsg(d.error ?? t("error.generic"));
    }
  }

  return (
    <div className="container-page section">
      <SectionTitle title={t("academy.title")} sub={t("academy.sub")} />
      {msg && <div className="mb-6 rounded-xl border border-electric/30 bg-electric/10 px-4 py-3 text-sm">{msg}</div>}
      {data === null ? (
        <Skeleton className="h-96" />
      ) : (
        <>
          <h2 className="heading-md mb-6">{t("academy.courses")}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.courses.map((c) => (
              <div key={c.id} className="surface flex flex-col p-6">
                <div className="text-xs uppercase tracking-widest text-electric">{c.category}</div>
                <div className="mt-2 font-semibold">{lang === "ru" ? c.titleRu : c.titleEn}</div>
                <p className="mt-2 flex-1 text-sm text-steel">{lang === "ru" ? c.descriptionRu : c.descriptionEn}</p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs text-steel">{t("academy.duration")}: {c.durationH} {t("academy.hours")}</span>
                  <button className="btn-primary btn-sm" onClick={() => enroll(c.id)} disabled={enrolled[c.id]}>
                    {t("academy.enroll")}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <h2 className="heading-md mb-6 mt-14">{t("academy.instructors")}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {data.instructors.map((i, idx) => (
              <div key={idx} className="surface p-5">
                <div className="font-mono text-sm text-electric">{i.pilotId ?? "—"}</div>
                <div className="mt-1 font-medium">{i.name}</div>
                <div className="text-xs text-steel">{lang === "ru" ? i.roleRu : i.roleEn}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
