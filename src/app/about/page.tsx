import Link from "next/link";
import { db } from "@/lib/db";
import { serverLang } from "@/i18n/server";

export const dynamic = "force-dynamic";

export default async function AboutPage() {
  const { lang, dict } = await serverLang();
  const [hubs, cats, fleetCount] = await Promise.all([
    db.airport.findMany({ where: { isHub: true }, orderBy: { code: "asc" } }),
    db.aircraftCategory.findMany(),
    db.aircraft.count(),
  ]);
  const leadership = await db.userRole.findMany({
    where: { role: { key: { in: ["GEN_PRESIDENT", "GEN_GENERAL_DIRECTOR", "GEN_COO", "MRD_HEAD_FCC", "MRD_HEAD_TRAINING", "MRD_HEAD_MIL", "MRD_HEAD_CARGO", "MRD_HEAD_PERSONNEL"] } }, hubId: null },
    include: { role: true, user: { include: { pilotProfile: true } } },
    orderBy: { role: { rank: "asc" } },
  });

  return (
    <div className="container-page max-w-4xl section">
      <h1 className="heading-lg">{dict["about.title"]}</h1>
      <p className="mt-6 text-lg leading-relaxed text-steel">{dict["about.missionText"]}</p>

      <h2 className="heading-md mt-14 mb-5">{dict["about.directions"]}</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {cats.map((c) => (
          <div key={c.id} className="surface p-5">
            <div className="font-mono text-xs uppercase tracking-widest text-electric">{c.key}</div>
            <div className="mt-2 text-sm font-medium">{lang === "ru" ? c.nameRu : c.nameEn}</div>
          </div>
        ))}
      </div>

      <h2 className="heading-md mt-14 mb-5">{dict["about.network"]}</h2>
      <div className="flex flex-wrap gap-3">
        {hubs.map((h) => (
          <Link key={h.id} href={`/hubs/${h.code}`} className="surface px-5 py-3 font-mono text-sm hover:border-electric">
            {h.code} <span className="text-steel">{lang === "ru" ? h.cityRu ?? h.city : h.city}</span>
          </Link>
        ))}
        <div className="surface px-5 py-3 font-mono text-sm text-electric">{fleetCount} aircraft</div>
      </div>

      <h2 className="heading-md mt-14 mb-5">{dict["about.leadership"]}</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {leadership.map((l, i) => (
          <div key={i} className="surface flex items-center justify-between p-4 text-sm">
            <span className="text-steel">{lang === "ru" ? l.role.nameRu : l.role.nameEn}</span>
            <span className="font-mono">{l.user.pilotProfile?.pilotId ?? l.user.name}</span>
          </div>
        ))}
      </div>

      <div className="mt-14 text-xs leading-relaxed text-steel/60">{dict["footer.legal"]}</div>
    </div>
  );
}
