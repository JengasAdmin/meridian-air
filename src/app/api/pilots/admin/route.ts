import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { apiError, audit } from "@/lib/audit";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    await requirePermission("PILOTS.READ");
    const status = req.nextUrl.searchParams.get("status");
    const profiles = await db.pilotProfile.findMany({
      where: status ? { status } : undefined,
      include: { user: true, rank: true, hub: true },
      orderBy: { pilotId: "asc" },
    });
    return Response.json({
      pilots: profiles.map((p) => ({
        id: p.id, userId: p.userId, pilotId: p.pilotId, name: p.user.name, email: p.user.email,
        status: p.status, rank: p.rank ? { key: p.rank.key, nameRu: p.rank.nameRu, nameEn: p.rank.nameEn } : null,
        hub: p.hub?.code ?? null, hours: p.hours, flights: p.flightsCount,
        vatsimCid: p.user.vatsimCid, ivaoVid: p.user.ivaoVid, discordId: p.user.discordId,
        joinDate: p.joinDate,
      })),
    });
  } catch (e) {
    return apiError(e);
  }
}

const patchSchema = z.object({
  userId: z.string(),
  action: z.enum(["VERIFY", "SUSPEND", "ACTIVATE", "SET_RANK", "SET_HUB", "ADD_ROLE", "REMOVE_ROLE"]),
  roleKey: z.string().optional(),
  hubCode: z.string().optional(),
});

export async function PATCH(req: NextRequest) {
  try {
    const actor = await requirePermission("PILOTS.VERIFY");
    const body = patchSchema.parse(await req.json());
    const profile = await db.pilotProfile.findUnique({
      where: { userId: body.userId },
      include: { user: true },
    });
    if (!profile) return Response.json({ error: "Pilot not found", status: 404 }, { status: 404 });

    if (body.action === "VERIFY") {
      if (profile.status !== "PENDING")
        return Response.json({ error: "Pilot is not pending", status: 409 }, { status: 409 });
      const rank = await db.role.findUnique({ where: { key: "MRD_VERIFIED_PILOT" } });
      await db.pilotProfile.update({ where: { id: profile.id }, data: { status: "VERIFIED", rankId: rank?.id } });
      if (rank) {
        const existing = await db.userRole.findFirst({
          where: { userId: profile.userId, roleId: rank.id, hubId: null },
        });
        if (!existing) await db.userRole.create({ data: { userId: profile.userId, roleId: rank.id } });
      }
      await audit({ userId: actor.id, action: "PILOT_VERIFIED", target: profile.pilotId });
      return Response.json({ ok: true });
    }

    if (body.action === "SUSPEND" || body.action === "ACTIVATE") {
      await requirePermission("PILOTS.MANAGE");
      const status = body.action === "SUSPEND" ? "SUSPENDED" : "ACTIVE";
      await db.pilotProfile.update({ where: { id: profile.id }, data: { status } });
      await audit({ userId: actor.id, action: `PILOT_${body.action}`, target: profile.pilotId, newValue: { status } });
      return Response.json({ ok: true });
    }

    if (body.action === "SET_RANK") {
      await requirePermission("PILOTS.MANAGE");
      const role = await db.role.findUnique({ where: { key: body.roleKey ?? "" } });
      if (!role) return Response.json({ error: "Unknown rank", status: 400 }, { status: 400 });
      await db.pilotProfile.update({ where: { id: profile.id }, data: { rankId: role.id } });
      await audit({ userId: actor.id, action: "ROLE_ASSIGNED", target: profile.pilotId, newValue: { rank: role.key } });
      return Response.json({ ok: true });
    }

    if (body.action === "SET_HUB") {
      await requirePermission("PILOTS.MANAGE");
      const hub = await db.airport.findUnique({ where: { code: body.hubCode ?? "" } });
      if (!hub) return Response.json({ error: "Unknown hub", status: 400 }, { status: 400 });
      await db.pilotProfile.update({ where: { id: profile.id }, data: { hubId: hub.id } });
      await audit({ userId: actor.id, action: "PILOT_HUB_SET", target: profile.pilotId, newValue: { hub: hub.code } });
      return Response.json({ ok: true });
    }

    if (body.action === "ADD_ROLE" || body.action === "REMOVE_ROLE") {
      await requirePermission("ROLES.MANAGE");
      const role = await db.role.findUnique({ where: { key: body.roleKey ?? "" } });
      if (!role) return Response.json({ error: "Unknown role", status: 400 }, { status: 400 });
      const existing = await db.userRole.findFirst({
        where: { userId: profile.userId, roleId: role.id, hubId: null },
      });
      if (body.action === "ADD_ROLE") {
        if (!existing) await db.userRole.create({ data: { userId: profile.userId, roleId: role.id } });
      } else if (existing) {
        await db.userRole.delete({ where: { id: existing.id } });
      }
      await audit({
        userId: actor.id, action: body.action === "ADD_ROLE" ? "ROLE_ASSIGNED" : "ROLE_REMOVED",
        target: profile.pilotId, newValue: { role: role.key },
      });
      return Response.json({ ok: true });
    }

    return Response.json({ error: "Unknown action", status: 400 }, { status: 400 });
  } catch (e) {
    return apiError(e);
  }
}
