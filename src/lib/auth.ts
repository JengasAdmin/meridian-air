import "server-only";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { db } from "./db";

const SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || "dev-only-secret-change-me"
);
const COOKIE = "mrd_session";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export async function hashPassword(pw: string) {
  return bcrypt.hash(pw, 12);
}
export async function verifyPassword(pw: string, hash: string) {
  return bcrypt.compare(pw, hash);
}

export async function createSession(userId: string) {
  const token = await new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(SECRET);
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: MAX_AGE,
    path: "/",
  });
}

export async function destroySession() {
  (await cookies()).delete(COOKIE);
}

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  locale: string;
  pilotId: string | null;
  pilotStatus: string | null;
  roles: { key: string; nameRu: string; nameEn: string; hubId: string | null }[];
  permissions: Set<string>;
};

export async function getSessionUser(): Promise<SessionUser | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  let sub: string | undefined;
  try {
    const { payload } = await jwtVerify(token, SECRET);
    sub = payload.sub;
  } catch {
    return null;
  }
  if (!sub) return null;

  const user = await db.user.findUnique({
    where: { id: sub },
    include: {
      pilotProfile: true,
      roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } },
    },
  });
  if (!user || user.status === "SUSPENDED") return null;

  // Resolve permissions with role inheritance + hub scope.
  const roleIds = new Set<string>();
  const scoped: { roleId: string; hubId: string | null }[] = [];
  for (const ur of user.roles) {
    scoped.push({ roleId: ur.roleId, hubId: ur.hubId ?? null });
    let r = user.roles.find((x) => x.roleId === ur.roleId)?.role;
    let guard = 0;
    while (r && guard++ < 10) {
      roleIds.add(r.id);
      if (r.inheritsId) {
        const parent = await db.role.findUnique({
          where: { id: r.inheritsId },
          include: { permissions: { include: { permission: true } } },
        });
        if (!parent || roleIds.has(parent.id)) break;
        roleIds.add(parent.id);
        r = parent;
      } else break;
    }
  }
  const perms = new Set<string>();
  const scopedPerms: { hubId: string; perm: string }[] = [];
  const rolesFound = await db.role.findMany({
    where: { id: { in: [...roleIds] } },
    include: { permissions: { include: { permission: true } } },
  });
  for (const sp of scoped) {
    const role = rolesFound.find((r) => r.id === sp.roleId);
    if (!role) continue;
    for (const rp of role.permissions) {
      if (sp.hubId) scopedPerms.push({ hubId: sp.hubId, perm: rp.permission.key });
      else perms.add(rp.permission.key);
    }
  }
  // Keep inheritance global-resolution for simplicity: parents of scoped roles stay scoped.
  const globalKeys = perms; // DB stores fully-qualified DOMAIN.ACTION keys

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
    locale: user.locale,
    pilotId: user.pilotProfile?.pilotId ?? null,
    pilotStatus: user.pilotProfile?.status ?? null,
    roles: user.roles.map((ur) => ({
      key: ur.role.key,
      nameRu: ur.role.nameRu,
      nameEn: ur.role.nameEn,
      hubId: ur.hubId,
    })),
    permissions: new Set(globalKeys),
  };
}

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function requireUser(): Promise<SessionUser> {
  const u = await getSessionUser();
  if (!u) throw new HttpError(401, "Authentication required");
  return u;
}

export async function requirePermission(perm: string, hubId?: string): Promise<SessionUser> {
  const u = await requireUser();
  if (u.permissions.has(perm)) return u;
  if (hubId) {
    const scoped = await db.userRole.findFirst({
      where: { userId: u.id, hubId, role: { permissions: { some: { permission: { key: perm } } } } },
    });
    if (scoped) return u;
  }
  throw new HttpError(403, `Missing permission: ${perm}`);
}
