import { db } from "@/lib/db";
import { apiError } from "@/lib/audit";

export const runtime = "nodejs";

export async function GET() {
  try {
    const hubs = await db.airport.findMany({ where: { isHub: true }, orderBy: { code: "asc" } });
    const result = [];
    for (const h of hubs) {
      const [aircraft, routesFrom, pilots, staff] = await Promise.all([
        db.aircraft.count({ where: { hubId: h.id } }),
        db.route.count({ where: { originId: h.id, active: true } }),
        db.pilotProfile.count({ where: { hubId: h.id } }),
        db.userRole.findMany({
          where: { hubId: h.id, role: { key: { in: ["HUB_DIRECTOR", "HUB_DEPUTY"] } } },
          include: { role: true, user: { include: { pilotProfile: true } } },
        }),
      ]);
      result.push({
        id: h.id, code: h.code, iata: h.iata, name: h.name,
        city: h.city, cityRu: h.cityRu, country: h.country, countryRu: h.countryRu,
        lat: h.lat, lon: h.lon,
        aircraft, routes: routesFrom, pilots,
        director: staff.find((s) => s.role.key === "HUB_DIRECTOR")?.user.pilotProfile?.pilotId ?? null,
        deputy: staff.find((s) => s.role.key === "HUB_DEPUTY")?.user.pilotProfile?.pilotId ?? null,
      });
    }
    return Response.json({ hubs: result });
  } catch (e) {
    return apiError(e);
  }
}
