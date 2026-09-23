import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser, requirePermission } from "@/lib/auth";
import { apiError, audit } from "@/lib/audit";
import { nextPirepCode, reviewTypeFor } from "@/lib/operations";
import { notifyPirepCreated } from "@/lib/discord";

export const runtime = "nodejs";

const createSchema = z.object({
  bookingId: z.string().optional(),
  aircraftId: z.string().min(1),
  originCode: z.string().length(4),
  destCode: z.string().length(4),
  flightNumber: z.string().min(3).max(10),
  callsign: z.string().min(3).max(12),
  network: z.enum(["VATSIM", "IVAO", "OFFLINE"]),
  depTime: z.string().datetime(),
  arrTime: z.string().datetime(),
  distanceNm: z.number().positive().max(20000),
  fuelKg: z.number().optional(),
  remarks: z.string().max(1000).optional(),
});

export async function GET() {
  try {
    const u = await requireUser();
    const canReadAll = u.permissions.has("PIREP.READ");
    const pireps = await db.pirep.findMany({
      where: canReadAll ? {} : { userId: u.id },
      include: { user: { include: { pilotProfile: true } }, aircraft: true, origin: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return Response.json({
      pireps: pireps.map((p) => ({
        id: p.id, code: p.code, flightNumber: p.flightNumber, callsign: p.callsign,
        origin: p.origin.code, destCode: p.destCode, network: p.network,
        durationMin: p.durationMin, distanceNm: p.distanceNm, status: p.status,
        reviewType: p.reviewType, depTime: p.depTime, arrTime: p.arrTime,
        remarks: p.remarks, reviewNote: p.reviewNote,
        aircraft: p.aircraft.name,
        pilot: p.user.pilotProfile?.pilotId ?? p.user.name,
        isMine: p.userId === u.id,
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
    const profile = await db.pilotProfile.findUnique({ where: { userId: u.id } });
    if (!profile) return Response.json({ error: "Pilot profile required", status: 403 }, { status: 403 });

    const origin = await db.airport.findUnique({ where: { code: body.originCode.toUpperCase() } });
    if (!origin) return Response.json({ error: "Unknown departure airport", status: 400 }, { status: 400 });
    const durationMin = Math.max(
      5,
      Math.round((new Date(body.arrTime).getTime() - new Date(body.depTime).getTime()) / 60_000)
    );
    if (durationMin > 24 * 60)
      return Response.json({ error: "Flight duration exceeds 24h", status: 400 }, { status: 400 });

    const operation = body.flightNumber.startsWith("MRD")
      ? (parseInt(body.flightNumber.slice(3), 10) >= 500 && parseInt(body.flightNumber.slice(3), 10) < 700 ? "CARGO" : "PASSENGER")
      : "PASSENGER";

    const pirep = await db.pirep.create({
      data: {
        code: await nextPirepCode(),
        bookingId: body.bookingId,
        userId: u.id,
        aircraftId: body.aircraftId,
        originId: origin.id,
        destCode: body.destCode.toUpperCase(),
        flightNumber: body.flightNumber.toUpperCase(),
        callsign: body.callsign.toUpperCase(),
        network: body.network,
        depTime: new Date(body.depTime),
        arrTime: new Date(body.arrTime),
        durationMin,
        distanceNm: body.distanceNm,
        fuelKg: body.fuelKg,
        remarks: body.remarks,
        reviewType: reviewTypeFor(operation),
      },
      include: { origin: true },
    });

    // If filed against a booking, mark it completed.
    if (body.bookingId) {
      await db.booking.updateMany({
        where: { id: body.bookingId, userId: u.id, status: "BOOKED" },
        data: { status: "COMPLETED" },
      });
    }

    await audit({ userId: u.id, actorRole: profile.pilotId, action: "PIREP_FILED", target: pirep.code });
    await notifyPirepCreated({
      code: pirep.code, pilotId: profile.pilotId, flightNumber: pirep.flightNumber,
      origin: pirep.origin.code, dest: pirep.destCode, durationMin: pirep.durationMin,
    });
    return Response.json({ ok: true, pirep: { id: pirep.id, code: pirep.code } }, { status: 201 });
  } catch (e) {
    return apiError(e);
  }
}

export async function PATCH(req: NextRequest) {
  // PIREP review: approve / reject
  try {
    const u = await requirePermission("PIREP.APPROVE");
    const body = z
      .object({ id: z.string(), decision: z.enum(["APPROVED", "REJECTED"]), note: z.string().max(500).optional() })
      .parse(await req.json());
    const pirep = await db.pirep.findUnique({ where: { id: body.id } });
    if (!pirep) return Response.json({ error: "PIREP not found", status: 404 }, { status: 404 });
    if (pirep.status !== "PENDING")
      return Response.json({ error: "PIREP already reviewed", status: 409 }, { status: 409 });

    await db.pirep.update({
      where: { id: pirep.id },
      data: { status: body.decision, reviewedById: u.id, reviewNote: body.note },
    });

    if (body.decision === "APPROVED") {
      const profile = await db.pilotProfile.findUnique({ where: { userId: pirep.userId } });
      if (profile) {
        await db.pilotProfile.update({
          where: { id: profile.id },
          data: {
            hours: profile.hours + pirep.durationMin / 60,
            flightsCount: profile.flightsCount + 1,
            distanceNm: profile.distanceNm + pirep.distanceNm,
          },
        });
      }
    }

    await audit({
      userId: u.id, action: body.decision === "APPROVED" ? "PIREP_APPROVED" : "PIREP_REJECTED",
      target: pirep.code, newValue: { note: body.note },
    });
    return Response.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
