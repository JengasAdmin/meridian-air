import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { hashPassword, createSession, getSessionUser } from "@/lib/auth";
import { apiError, audit } from "@/lib/audit";
import { nextPilotId } from "@/lib/operations";

export const runtime = "nodejs";

const registerSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  vatsimCid: z.string().max(16).optional().or(z.literal("")),
  ivaoVid: z.string().max(16).optional().or(z.literal("")),
  discordId: z.string().max(32).optional().or(z.literal("")),
  locale: z.enum(["ru", "en"]).default("ru"),
  hubCode: z.string().optional(),
  interests: z.string().max(200).optional(),
  agreeRules: z.literal(true),
});

export async function POST(req: NextRequest) {
  try {
    const body = registerSchema.parse(await req.json());
    const email = body.email.toLowerCase().trim();
    const existing = await db.user.findUnique({ where: { email } });
    if (existing) return Response.json({ error: "Email already registered", status: 409 }, { status: 409 });

    const user = await db.user.create({
      data: {
        email,
        name: body.name.trim(),
        passwordHash: await hashPassword(body.password),
        vatsimCid: body.vatsimCid || null,
        ivaoVid: body.ivaoVid || null,
        discordId: body.discordId || null,
        locale: body.locale,
      },
    });

    const hub = body.hubCode
      ? await db.airport.findUnique({ where: { code: body.hubCode } })
      : null;
    const pilotId = await nextPilotId();
    await db.pilotProfile.create({
      data: {
        userId: user.id,
        pilotId,
        status: "PENDING",
        hubId: hub?.id,
        achievements: JSON.stringify(body.interests ? [body.interests] : []),
      },
    });

    await createSession(user.id);
    await audit({ userId: user.id, action: "PILOT_APPLICATION", target: pilotId, newValue: { email } });
    return Response.json({ ok: true, pilotId, status: "PENDING" }, { status: 201 });
  } catch (e) {
    return apiError(e);
  }
}

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
