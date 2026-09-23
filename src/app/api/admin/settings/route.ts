import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { apiError, audit } from "@/lib/audit";

export const runtime = "nodejs";

export async function GET() {
  try {
    await requirePermission("SYSTEM.READ");
    const settings = await db.systemSetting.findMany();
    const channels = await db.discordChannel.findMany({ orderBy: { key: "asc" } });
    return Response.json({
      settings: Object.fromEntries(settings.map((s) => [s.key, s.value])),
      channels: channels.map((c) => ({ key: c.key, channelId: c.channelId })),
    });
  } catch (e) {
    return apiError(e);
  }
}

const patchSchema = z.object({
  settings: z.record(z.string(), z.string()).optional(),
  channels: z.array(z.object({ key: z.string(), channelId: z.string() })).optional(),
});

export async function PATCH(req: NextRequest) {
  try {
    const actor = await requirePermission("SYSTEM.CONFIGURE");
    const body = patchSchema.parse(await req.json());
    if (body.settings) {
      for (const [key, value] of Object.entries(body.settings)) {
        await db.systemSetting.upsert({ where: { key }, create: { key, value }, update: { value } });
      }
    }
    if (body.channels) {
      for (const c of body.channels) {
        await db.discordChannel.upsert({
          where: { key: c.key },
          create: { key: c.key, channelId: c.channelId },
          update: { channelId: c.channelId },
        });
      }
    }
    await audit({ userId: actor.id, action: "SYSTEM_SETTINGS_UPDATED", newValue: body });
    return Response.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
