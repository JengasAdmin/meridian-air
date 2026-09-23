import { db } from "@/lib/db";
import { apiError } from "@/lib/audit";
import { networkPilots } from "@/lib/integrations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [pilots, pireps, hoursAgg, aircraft, routes, hubs, live] = await Promise.all([
      db.pilotProfile.count(),
      db.pirep.count({ where: { status: "APPROVED" } }),
      db.pilotProfile.aggregate({ _sum: { hours: true, distanceNm: true, flightsCount: true } }),
      db.aircraft.count(),
      db.route.count({ where: { active: true } }),
      db.airport.count({ where: { isHub: true } }),
      networkPilots(),
    ]);
    const byHub = await db.pilotProfile.groupBy({ by: ["hubId"], _count: true, _sum: { hours: true } });
    const hubNames = await db.airport.findMany({ where: { isHub: true } });
    const byCategory = await db.aircraft.groupBy({ by: ["categoryId"], _count: true });
    const cats = await db.aircraftCategory.findMany();

    const meridianLive = live.filter((p) => p.callsign.toUpperCase().startsWith("MRD"));

    return Response.json({
      pilots,
      approvedPireps: pireps,
      flights: hoursAgg._sum.flightsCount ?? 0,
      hours: Math.round(hoursAgg._sum.hours ?? 0),
      distanceNm: Math.round(hoursAgg._sum.distanceNm ?? 0),
      aircraft,
      routes,
      hubs,
      liveNow: meridianLive.length,
      byHub: hubNames.map((h) => {
        const row = byHub.find((b) => b.hubId === h.id);
        return { code: h.code, city: h.city, cityRu: h.cityRu, pilots: row?._count ?? 0, hours: Math.round(row?._sum.hours ?? 0) };
      }),
      byFleet: cats.map((c) => ({
        key: c.key, nameRu: c.nameRu, nameEn: c.nameEn,
        count: byCategory.find((b) => b.categoryId === c.id)?._count ?? 0,
      })),
    });
  } catch (e) {
    return apiError(e);
  }
}
