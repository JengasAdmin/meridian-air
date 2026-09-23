import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { apiError, audit } from "@/lib/audit";
import { generateFlightNumber } from "@/lib/operations";

export const runtime = "nodejs";

const createSchema = z.object({
  originCode: z.string().length(4),
  destCode: z.string().length(4),
  categoryKey: z.enum(["PASSENGER", "CARGO", "MILITARY", "GENERAL", "SOVIET"]),
  flightNumber: z.string().optional(),
  distanceNm: z.number().positive(),
  durationMin: z.number().int().positive(),
  frequency: z.string().default("DAILY"),
});

export async function POST(req: NextRequest) {
  try {
    const u = await requirePermission("ROUTES.CREATE");
    const body = createSchema.parse(await req.json());
    const [origin, dest, category] = await Promise.all([
      db.airport.findUnique({ where: { code: body.originCode.toUpperCase() } }),
      db.airport.findUnique({ where: { code: body.destCode.toUpperCase() } }),
      db.aircraftCategory.findUnique({ where: { key: body.categoryKey } }),
    ]);
    if (!origin || !dest) return Response.json({ error: "Unknown airport", status: 400 }, { status: 400 });
    if (!category) return Response.json({ error: "Unknown category", status: 400 }, { status: 400 });
    const flightNumber = body.flightNumber?.toUpperCase() || (await generateFlightNumber(body.categoryKey));
    const route = await db.route.create({
      data: {
        flightNumber, originId: origin.id, destId: dest.id,
        categoryId: category.id, distanceNm: body.distanceNm,
        durationMin: body.durationMin, frequency: body.frequency,
      },
    });
    await audit({ userId: u.id, action: "ROUTE_CREATED", target: route.flightNumber });
    return Response.json({ ok: true, id: route.id, flightNumber }, { status: 201 });
  } catch (e) {
    return apiError(e);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const u = await requirePermission("ROUTES.DELETE");
    const id = req.nextUrl.searchParams.get("id");
    if (!id) return Response.json({ error: "id required", status: 400 }, { status: 400 });
    const route = await db.route.findUnique({ where: { id } });
    if (!route) return Response.json({ error: "Not found", status: 404 }, { status: 404 });
    await db.route.update({ where: { id }, data: { active: false } });
    await audit({ userId: u.id, action: "ROUTE_DEACTIVATED", target: route.flightNumber });
    return Response.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
