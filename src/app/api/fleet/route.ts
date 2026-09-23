import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { apiError } from "@/lib/audit";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const category = req.nextUrl.searchParams.get("category");
    const fleet = await db.aircraft.findMany({
      where: category ? { category: { key: category } } : undefined,
      include: { category: true, hub: true },
      orderBy: [{ categoryId: "asc" }, { type: "asc" }],
    });
    return Response.json({
      fleet: fleet.map((a) => ({
        id: a.id, registration: a.registration, type: a.type, name: a.name,
        manufacturer: a.manufacturer, category: a.category.key,
        categoryNameRu: a.category.nameRu, categoryNameEn: a.category.nameEn,
        hub: a.hub?.code ?? null, status: a.status,
        capacityPax: a.capacityPax, capacityCargoKg: a.capacityCargoKg,
        isMilitary: a.isMilitary, active: a.active,
      })),
    });
  } catch (e) {
    return apiError(e);
  }
}
