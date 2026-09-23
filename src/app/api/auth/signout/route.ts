import { destroySession } from "@/lib/auth";
import { apiError } from "@/lib/audit";

export const runtime = "nodejs";

export async function POST() {
  try {
    await destroySession();
    return Response.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
