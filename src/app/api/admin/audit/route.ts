import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { apiError } from "@/lib/audit";

export const runtime = "nodejs";

export async function GET() {
  try {
    await requirePermission("AUDIT.READ");
    const logs = await db.auditLog.findMany({
      include: { user: { include: { pilotProfile: true } } },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return Response.json({
      logs: logs.map((l) => ({
        id: l.id, action: l.action, target: l.target,
        user: l.user?.pilotProfile?.pilotId ?? l.user?.name ?? "system",
        oldValue: l.oldValue, newValue: l.newValue, ip: l.ip,
        createdAt: l.createdAt,
      })),
    });
  } catch (e) {
    return apiError(e);
  }
}
