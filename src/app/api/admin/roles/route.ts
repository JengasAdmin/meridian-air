import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { apiError } from "@/lib/audit";

export const runtime = "nodejs";

export async function GET() {
  try {
    await requirePermission("ROLES.READ");
    const roles = await db.role.findMany({
      include: {
        permissions: { include: { permission: true } },
        users: true,
      },
      orderBy: { rank: "asc" },
    });
    return Response.json({
      roles: roles.map((r) => ({
        key: r.key, nameRu: r.nameRu, nameEn: r.nameEn, department: r.department,
        rank: r.rank, isPilotRank: r.isPilotRank, inherits: r.inheritsId,
        permissions: r.permissions.map((p) => p.permission.key),
        userCount: r.users.length,
      })),
    });
  } catch (e) {
    return apiError(e);
  }
}
