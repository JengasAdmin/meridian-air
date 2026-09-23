import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { verifyPassword, createSession, destroySession } from "@/lib/auth";
import { apiError, audit } from "@/lib/audit";

export const runtime = "nodejs";

const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });

// naive in-memory rate limit (per process) — production: reverse-proxy/Redis
const attempts = new Map<string, { n: number; ts: number }>();

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") ?? "local";
    const rec = attempts.get(ip);
    if (rec && Date.now() - rec.ts < 60_000 && rec.n >= 10) {
      return Response.json({ error: "Too many attempts, try later", status: 429 }, { status: 429 });
    }
    const body = loginSchema.parse(await req.json());
    const user = await db.user.findUnique({ where: { email: body.email.toLowerCase().trim() } });
    const ok = user?.passwordHash && (await verifyPassword(body.password, user.passwordHash));
    if (!ok || !user) {
      attempts.set(ip, { n: (rec?.n ?? 0) + 1, ts: Date.now() });
      return Response.json({ error: "Invalid email or password", status: 401 }, { status: 401 });
    }
    if (user.status === "SUSPENDED") {
      return Response.json({ error: "Account suspended", status: 403 }, { status: 403 });
    }
    attempts.delete(ip);
    await createSession(user.id);
    await audit({ userId: user.id, action: "LOGIN", ip, userAgent: req.headers.get("user-agent") });
    return Response.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}

export async function DELETE() {
  await destroySession();
  return Response.json({ ok: true });
}
