import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { apiError, audit } from "@/lib/audit";

export const runtime = "nodejs";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const u = await requireUser();
    const booking = await db.booking.findUnique({ where: { id: params.id } });
    if (!booking) return Response.json({ error: "Booking not found", status: 404 }, { status: 404 });

    const isOwner = booking.userId === u.id;
    const canManage = u.permissions.has("BOOKINGS.MANAGE") || u.permissions.has("BOOKINGS.CANCEL");
    if (!isOwner && !canManage)
      return Response.json({ error: "Forbidden", status: 403 }, { status: 403 });
    if (booking.status !== "BOOKED")
      return Response.json({ error: "Booking is not cancellable", status: 409 }, { status: 409 });

    await db.booking.update({ where: { id: booking.id }, data: { status: "CANCELLED" } });
    await audit({
      userId: u.id, action: "BOOKING_CANCELLED", target: booking.code,
      oldValue: { status: "BOOKED" }, newValue: { status: "CANCELLED" },
    });
    return Response.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
