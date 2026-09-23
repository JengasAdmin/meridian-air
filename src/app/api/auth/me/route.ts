import { getSessionUser } from "@/lib/auth";
import { apiError } from "@/lib/audit";

export const runtime = "nodejs";

export async function GET() {
  try {
    const u = await getSessionUser();
    if (!u) return Response.json({ user: null });
    return Response.json({
      user: {
        id: u.id, name: u.name, email: u.email, locale: u.locale,
        pilotId: u.pilotId, pilotStatus: u.pilotStatus, roles: u.roles,
        permissions: [...u.permissions],
      },
    });
  } catch (e) {
    return apiError(e);
  }
}
