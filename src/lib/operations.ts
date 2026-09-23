import "server-only";
import { db } from "./db";
import { CATEGORY_ELIGIBILITY, OperationCategory } from "./rbac";

export async function nextBookingCode(): Promise<string> {
  const count = await db.booking.count();
  const start = Number(((await db.systemSetting.findUnique({ where: { key: "booking_seq" } }))?.value) ?? 0);
  const n = Math.max(count, start) + 1;
  await db.systemSetting.upsert({
    where: { key: "booking_seq" },
    create: { key: "booking_seq", value: String(n) },
    update: { value: String(n) },
  });
  return `MRD-BOOK-${String(n).padStart(6, "0")}`;
}

export async function nextPirepCode(): Promise<string> {
  const count = await db.pirep.count();
  const start = Number(((await db.systemSetting.findUnique({ where: { key: "pirep_seq" } }))?.value) ?? 0);
  const n = Math.max(count, start) + 1;
  await db.systemSetting.upsert({
    where: { key: "pirep_seq" },
    create: { key: "pirep_seq", value: String(n) },
    update: { value: String(n) },
  });
  return `MRD-PIREP-${String(n).padStart(6, "0")}`;
}

export async function nextPilotId(): Promise<string> {
  const last = await db.pilotProfile.findFirst({ orderBy: { pilotId: "desc" } });
  const n = last ? parseInt(last.pilotId.split("-")[1], 10) + 1 : 1;
  return `MRD-${String(n).padStart(4, "0")}`;
}

// Flight number ranges per operation type — configurable via SystemSetting
// (JSON: {"PASSENGER":{"base":100,"end":499},...}).
const DEFAULT_RANGES: Record<string, { base: number; end: number }> = {
  PASSENGER: { base: 100, end: 499 },
  CARGO: { base: 500, end: 699 },
  MILITARY: { base: 700, end: 799 },
  GENERAL: { base: 800, end: 849 },
  SOVIET: { base: 850, end: 899 },
};

export async function generateFlightNumber(operation: string): Promise<string> {
  const raw = (await db.systemSetting.findUnique({ where: { key: "flight_number_ranges" } }))?.value;
  const ranges = raw ? (JSON.parse(raw) as typeof DEFAULT_RANGES) : DEFAULT_RANGES;
  const range = ranges[operation] ?? { base: 900, end: 999 };
  const existing = await db.route.findMany({ select: { flightNumber: true } });
  const used = new Set(existing.map((r) => r.flightNumber));
  for (let n = range.base; n <= range.end; n++) {
    const candidate = `MRD${n}`;
    if (!used.has(candidate)) return candidate;
  }
  throw new Error(`Flight number pool exhausted for ${operation}`);
}

export function parseFlightNumberOp(flightNumber: string): string | null {
  const n = parseInt(flightNumber.replace(/\D/g, ""), 10);
  if (!n) return null;
  if (n >= 100 && n <= 499) return "PASSENGER";
  if (n >= 500 && n <= 699) return "CARGO";
  if (n >= 700 && n <= 799) return "MILITARY";
  if (n >= 800 && n <= 849) return "GENERAL";
  if (n >= 850 && n <= 899) return "SOVIET";
  return null;
}

/**
 * Conflict rule: one physical aircraft cannot be double-booked for overlapping
 * windows (scheduled time ± route duration). Multiple future bookings per pilot
 * are allowed; identical route+date for the same pilot is rejected.
 */
export async function assertBookingAllowed(opts: {
  userId: string;
  aircraftId: string;
  routeId: string;
  scheduledAt: Date;
  pilotRoles: string[];
  operation: string;
}) {
  const route = await db.route.findUnique({ where: { id: opts.routeId }, include: { category: true } });
  if (!route || !route.active) throw new Error("Route not found or inactive");

  const aircraft = await db.aircraft.findUnique({ where: { id: opts.aircraftId }, include: { category: true } });
  if (!aircraft || !aircraft.active || aircraft.status === "RETIRED" || aircraft.status === "UNAVAILABLE")
    throw new Error("Aircraft not available");

  if (aircraft.category.key !== route.category.key)
    throw new Error("Aircraft category does not match route operation type");
  if (opts.operation === "MILITARY" && !aircraft.isMilitary && aircraft.category.key !== "MILITARY")
    throw new Error("Military operations require a military aircraft");

  // Pilot qualification: role keys must include at least one eligible for the op.
  const eligible = CATEGORY_ELIGIBILITY[opts.operation as OperationCategory];
  if (!eligible) throw new Error("Unknown operation type");
  if (!opts.pilotRoles.some((r) => eligible.includes(r)))
    throw new Error(`Pilot is not qualified for ${opts.operation} operations`);

  const durMs = route.durationMin * 60_000;
  const from = new Date(opts.scheduledAt.getTime() - 60 * 60_000);
  const to = new Date(opts.scheduledAt.getTime() + durMs + 60 * 60_000);
  const clash = await db.booking.findFirst({
    where: { aircraftId: opts.aircraftId, status: "BOOKED", scheduledAt: { gte: from, lte: to } },
  });
  if (clash) throw new Error(`Aircraft already booked (${clash.code}) in that window`);

  const own = await db.booking.findFirst({
    where: { userId: opts.userId, routeId: opts.routeId, scheduledAt: opts.scheduledAt, status: "BOOKED" },
  });
  if (own) throw new Error("You already have this exact booking");
}

/** PIREP review routing: military/instructor flights need instructor review. */
export function reviewTypeFor(operation: string): "AUTO" | "INSTRUCTOR" | "OPERATIONS" {
  if (operation === "MILITARY") return "INSTRUCTOR";
  if (operation === "GENERAL" || operation === "SOVIET") return "AUTO";
  return "OPERATIONS";
}
