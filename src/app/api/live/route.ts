import { apiError } from "@/lib/audit";
import { networkPilots } from "@/lib/integrations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const pilots = await networkPilots();
    const meridian = pilots.filter((p) => p.callsign.toUpperCase().startsWith("MRD"));
    return Response.json({
      meridian,
      networkTotal: pilots.length,
      updatedAt: new Date().toISOString(),
    });
  } catch (e) {
    return apiError(e);
  }
}
