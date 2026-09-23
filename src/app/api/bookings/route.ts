import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser, requirePermission } from "@/lib/auth";
import { apiError, audit } from "@/lib/audit";
import { assertBookingAllowed, nextBookingCode } from "@/lib/operations";
import { notifyBookingCreated } from "@/lib/discord";

export const runtime = "nodejs";

const createSchema = z.object({
  routeId: z.string().min(1),
  aircraftId: z.string().min(1),
  network: z.enum(["VATSIM", "IVAO", "OFFLINE"]),
  scheduledAt: z.string().datetime(),
  remarks: z.string().max(500).optional(),
});

export async function GET() {
  try {
    const u = await requireUser();
    const canSeeAll = u.permissions.has("BOOKINGS.READ");
    const bookings = await db.booking.findMany({
      where: canSeeAll ? {} : { userId: u.id },
      include: {
        route: { include: { origin: true, dest: true, category: true } },
        aircraft: true,
        user: { include: { pilotProfile: true } },
      },
      orderBy: { scheduledAt: "desc" },
      take: 100,
    });
    return Response.json({
      bookings: bookings.map((b) => ({
        id: b.id, code: b.code, flightNumber: b.flightNumber, network: b.network,
        operationType: b.operationType, status: b.status, scheduledAt: b.scheduledAt,
        remarks: b.remarks,
        origin: b.route.origin.code, dest: b.route.dest.code,
        durationMin: b.route.durationMin, distanceNm: b.route.distanceNm,
        aircraft: b.aircraft.name, aircraftReg: b.aircraft.registration,
        pilot: b.user.pilotProfile?.pilotId ?? b.user.name,
        isMine: b.userId === u.id,
      })),
    });
  } catch (e) {
    return apiError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const u = await requireUser();
    const body = createSchema.parse(await req.json());

    const profile = await db.pilotProfile.findUnique({
      where: { userId: u.id },
      include: { rank: true, user: { include: { roles: { include: { role: true } } } } },
    });
    if (!profile || profile.status === "PENDING")
      return Response.json({ error: "Pilot is not verified yet", status: 403 }, { status: 403 });

    const roleKeys = [...profile.user.roles.map((ur) => ur.role.key)];
    if (profile.rank && !roleKeys.includes(profile.rank.key)) roleKeys.push(profile.rank.key);
    const route = await db.route.findUnique({ where: { id: body.routeId }, include: { category: true } });
    if (!route) return Response.json({ error: "Route not found", status: 404 }, { status: 404 });

    try {
      await assertBookingAllowed({
        userId: u.id,
        aircraftId: body.aircraftId,
        routeId: body.routeId,
        scheduledAt: new Date(body.scheduledAt),
        pilotRoles: roleKeys,
        operation: route.category.key,
      });
    } catch (err) {
      return Response.json({ error: err instanceof Error ? err.message : "Booking rejected", status: 409 }, { status: 409 });
    }

    const booking = await db.booking.create({
      data: {
        code: await nextBookingCode(),
        userId: u.id,
        routeId: body.routeId,
        aircraftId: body.aircraftId,
        originId: route.originId,
        network: body.network,
        operationType: route.category.key,
        flightNumber: route.flightNumber,
        scheduledAt: new Date(body.scheduledAt),
        remarks: body.remarks,
      },
      include: { route: { include: { origin: true, dest: true } }, aircraft: true },
    });

    await audit({
      userId: u.id,
      actorRole: profile.pilotId,
      action: "BOOKING_CREATED",
      target: booking.code,
      newValue: { flight: booking.flightNumber, network: booking.network, scheduledAt: booking.scheduledAt },
    });
    await notifyBookingCreated({
      code: booking.code,
      pilotId: profile.pilotId,
      flightNumber: booking.flightNumber,
      aircraft: booking.aircraft.type,
      origin: booking.route.origin.code,
      dest: booking.route.dest.code,
      network: booking.network,
      scheduledAt: booking.scheduledAt,
    });
    return Response.json({ ok: true, booking: { id: booking.id, code: booking.code } }, { status: 201 });
  } catch (e) {
    return apiError(e);
  }
}
