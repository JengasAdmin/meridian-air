import { db } from "@/lib/db";
import { apiError } from "@/lib/audit";

export const runtime = "nodejs";

export async function GET() {
  try {
    const profiles = await db.pilotProfile.findMany({
      where: { status: { in: ["VERIFIED", "ACTIVE"] } },
      include: { user: true, rank: true, hub: true },
      orderBy: { hours: "desc" },
      take: 100,
    });
    return Response.json({
      pilots: profiles.map((p) => ({
        pilotId: p.pilotId, name: p.user.name, avatarUrl: p.user.avatarUrl,
        rank: { key: p.rank?.key, nameRu: p.rank?.nameRu, nameEn: p.rank?.nameEn },
        hub: p.hub?.code ?? null, status: p.status,
        hours: p.hours, flights: p.flightsCount, distanceNm: p.distanceNm,
        joinDate: p.joinDate,
      })),
    });
  } catch (e) {
    return apiError(e);
  }
}
