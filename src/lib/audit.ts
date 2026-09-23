import "server-only";
import { db } from "./db";
import { HttpError } from "./auth";

export async function audit(opts: {
  userId?: string | null;
  actorRole?: string | null;
  action: string;
  target?: string | null;
  oldValue?: unknown;
  newValue?: unknown;
  meta?: unknown;
  ip?: string | null;
  userAgent?: string | null;
}) {
  await db.auditLog.create({
    data: {
      userId: opts.userId ?? undefined,
      actorRole: opts.actorRole ?? undefined,
      action: opts.action,
      target: opts.target ?? undefined,
      oldValue: opts.oldValue != null ? JSON.stringify(opts.oldValue) : undefined,
      newValue: opts.newValue != null ? JSON.stringify(opts.newValue) : undefined,
      meta: opts.meta != null ? JSON.stringify(opts.meta) : undefined,
      ip: opts.ip ?? undefined,
      userAgent: opts.userAgent ?? undefined,
    },
  });
}

/** Wrap an API handler with uniform error responses (no stack traces leak). */
export function apiError(e: unknown) {
  if (e instanceof HttpError) {
    return Response.json({ error: e.message, status: e.status }, { status: e.status });
  }
  console.error("[api]", e);
  return Response.json({ error: "Internal server error", status: 500 }, { status: 500 });
}
