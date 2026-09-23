import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { apiError } from "@/lib/audit";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const category = req.nextUrl.searchParams.get("category");
    const q = req.nextUrl.searchParams.get("q")?.toUpperCase();
    const routes = await db.route.findMany({
      where: {
        active: true,
        ...(category ? { category: { key: category } } : {}),
      },
      include: { origin: true, dest: true, category: true },
      orderBy: { flightNumber: "asc" },
    });
    const filtered = q
      ? routes.filter(
          (r) =>
            r.flightNumber.includes(q) ||
            r.origin.code.includes(q) ||
            r.dest.code.includes(q) ||
            r.origin.city.toUpperCase().includes(q) ||
            r.dest.city.toUpperCase().includes(q)
        )
      : routes;
    return Response.json({
      routes: filtered.map((r) => ({
        id: r.id, flightNumber: r.flightNumber,
        origin: r.origin.code, originCity: r.origin.city, originCityRu: r.origin.cityRu,
        dest: r.dest.code, destCity: r.dest.city, destCityRu: r.dest.cityRu,
        category: r.category.key, distanceNm: r.distanceNm, durationMin: r.durationMin,
        frequency: r.frequency,
      })),
    });
  } catch (e) {
    return apiError(e);
  }
}
