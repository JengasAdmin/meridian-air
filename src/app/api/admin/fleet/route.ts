import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { apiError, audit } from "@/lib/audit";

export const runtime = "nodejs";

const createSchema = z.object({
  registration: z.string().min(3).max(16),
  type: z.string().min(2).max(16),
  name: z.string().min(2),
  manufacturer: z.string().min(2),
  categoryKey: z.enum(["PASSENGER", "CARGO", "MILITARY", "GENERAL", "SOVIET"]),
  hubCode: z.string().optional(),
  status: z.enum(["ACTIVE", "IN_SERVICE", "MAINTENANCE", "RESERVED", "RETIRED", "UNAVAILABLE"]).default("ACTIVE"),
  capacityPax: z.number().int().positive().optional(),
  capacityCargoKg: z.number().int().positive().optional(),
  isMilitary: z.boolean().default(false),
  notes: z.string().max(500).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const u = await requirePermission("FLEET.CREATE");
    const body = createSchema.parse(await req.json());
    const category = await db.aircraftCategory.findUnique({ where: { key: body.categoryKey } });
    if (!category) return Response.json({ error: "Unknown category", status: 400 }, { status: 400 });
    const hub = body.hubCode ? await db.airport.findUnique({ where: { code: body.hubCode } }) : null;
    const aircraft = await db.aircraft.create({
      data: {
        registration: body.registration.toUpperCase(),
        type: body.type.toUpperCase(),
        name: body.name, manufacturer: body.manufacturer,
        categoryId: category.id, hubId: hub?.id, status: body.status,
        capacityPax: body.capacityPax, capacityCargoKg: body.capacityCargoKg,
        isMilitary: body.isMilitary, notes: body.notes,
      },
    });
    await audit({ userId: u.id, action: "FLEET_UPDATED", target: aircraft.registration, newValue: { created: true } });
    return Response.json({ ok: true, id: aircraft.id }, { status: 201 });
  } catch (e) {
    return apiError(e);
  }
}

const patchSchema = z.object({
  id: z.string(),
  status: z.enum(["ACTIVE", "IN_SERVICE", "MAINTENANCE", "RESERVED", "RETIRED", "UNAVAILABLE"]).optional(),
  hubCode: z.string().optional(),
  notes: z.string().max(500).optional(),
  active: z.boolean().optional(),
});

export async function PATCH(req: NextRequest) {
  try {
    const u = await requirePermission("FLEET.EDIT");
    const body = patchSchema.parse(await req.json());
    const aircraft = await db.aircraft.findUnique({ where: { id: body.id } });
    if (!aircraft) return Response.json({ error: "Aircraft not found", status: 404 }, { status: 404 });
    const hub = body.hubCode ? await db.airport.findUnique({ where: { code: body.hubCode } }) : undefined;
    await db.aircraft.update({
      where: { id: aircraft.id },
      data: {
        status: body.status, notes: body.notes, active: body.active,
        hubId: hub?.id,
      },
    });
    await audit({
      userId: u.id, action: "FLEET_UPDATED", target: aircraft.registration,
      oldValue: { status: aircraft.status }, newValue: { status: body.status },
    });
    return Response.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
