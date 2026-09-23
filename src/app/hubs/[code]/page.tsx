import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { serverLang } from "@/i18n/server";
import { StatusBadge } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function HubDetailPage({ params }: { params: { code: string } }) {
  const { lang, dict } = await serverLang();
  const hub = await db.airport.findUnique({ where: { code: params.code.toUpperCase(), isHub: true } });
  if (!hub) notFound();

  const [aircraft, routesFrom, routesTo, pilots, staff] = await Promise.all([
    db.aircraft.findMany({ where: { hubId: hub.id }, include: { category: true } }),
    db.route.findMany({ where: { originId: hub.id, active: true }, include: { dest: true, category: true }, orderBy: { flightNumber: "asc" } }),
    db.route.findMany({ where: { destId: hub.id, active: true }, include: { origin: true }, orderBy: { flightNumber: "asc" } }),
    db.pilotProfile.findMany({ where: { hubId: hub.id }, include: { user: true, rank: true }, orderBy: { hours: "desc" } }),
    db.userRole.findMany({
      where: { hubId: hub.id, role: { key: { in: ["HUB_DIRECTOR", "HUB_DEPUTY"] } } },
      include: { role: true, user: { include: { pilotProfile: true } } },
    }),
  ]);

  return (
    <div className="container-page section">
      <Link href="/hubs" className="link-muted text-sm">← {dict["hubs.back"]}</Link>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="heading-lg font-mono">{hub.code}</h1>
          <p className="mt-1 text-lg text-steel">
            {lang === "ru" ? hub.cityRu ?? hub.city : hub.city}, {lang === "ru" ? hub.countryRu ?? hub.country : hub.country} · {hub.name}
          </p>
        </div>
        <div className="flex gap-6 text-sm">
          <div><div className="font-mono text-2xl text-electric">{aircraft.length}</div><div className="text-xs text-steel">{dict["hubs.aircraft"]}</div></div>
          <div><div className="font-mono text-2xl text-electric">{routesFrom.length}</div><div className="text-xs text-steel">{dict["hubs.routes"]}</div></div>
          <div><div className="font-mono text-2xl text-electric">{pilots.length}</div><div className="text-xs text-steel">{dict["hubs.pilots"]}</div></div>
        </div>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-3">
        <div className="surface p-6">
          <h2 className="heading-md mb-4">{dict["hubs.director"]}</h2>
          {staff.filter((s) => s.role.key === "HUB_DIRECTOR").map((s) => (
            <div key={s.id} className="text-sm">
              <div className="font-mono text-electric">{s.user.pilotProfile?.pilotId}</div>
              <div className="mt-1">{s.user.name}</div>
            </div>
          )) ?? null}
          {staff.filter((s) => s.role.key === "HUB_DIRECTOR").length === 0 && (
            <div className="text-sm text-steel">{dict["hubs.vacant"]}</div>
          )}
          <h2 className="heading-md mb-4 mt-8">{dict["hubs.deputy"]}</h2>
          {staff.filter((s) => s.role.key === "HUB_DEPUTY").map((s) => (
            <div key={s.id} className="text-sm">
              <div className="font-mono text-electric">{s.user.pilotProfile?.pilotId}</div>
              <div className="mt-1">{s.user.name}</div>
            </div>
          ))}
          {staff.filter((s) => s.role.key === "HUB_DEPUTY").length === 0 && (
            <div className="text-sm text-steel">{dict["hubs.vacant"]}</div>
          )}
        </div>

        <div className="surface p-6 lg:col-span-2">
          <h2 className="heading-md mb-4">{dict["fleet.title"]}</h2>
          <div className="grid max-h-72 gap-2 overflow-y-auto pr-2 sm:grid-cols-2">
            {aircraft.map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-xl border border-white/10 px-4 py-2.5 text-sm">
                <div>
                  <span className="font-mono text-electric">{a.registration}</span>
                  <span className="ml-2 text-steel">{a.name}</span>
                </div>
                <StatusBadge status={a.status} />
              </div>
            ))}
            {aircraft.length === 0 && <div className="text-sm text-steel">{dict["fleet.empty"]}</div>}
          </div>
        </div>
      </div>

      <h2 className="heading-md mt-12 mb-4">{dict["routes.title"]}</h2>
      <div className="surface overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="border-b border-white/10 text-xs uppercase tracking-wider text-steel">
            <tr>
              <th className="px-4 py-3">{dict["routes.flight"]}</th>
              <th className="px-4 py-3">{dict["routes.to"]}</th>
              <th className="px-4 py-3">{dict["routes.category"]}</th>
              <th className="px-4 py-3 text-right">{dict["routes.distance"]}</th>
            </tr>
          </thead>
          <tbody>
            {routesFrom.map((r) => (
              <tr key={r.id} className="border-b border-white/5 last:border-0 hover:bg-white/5">
                <td className="px-4 py-3 font-mono text-electric">{r.flightNumber}</td>
                <td className="px-4 py-3 font-mono">{r.dest.code} <span className="text-steel">{lang === "ru" ? r.dest.cityRu ?? r.dest.city : r.dest.city}</span></td>
                <td className="px-4 py-3 text-steel">{dict[`op.${r.category.key}` as keyof typeof dict]}</td>
                <td className="px-4 py-3 text-right font-mono">{r.distanceNm} nm</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
