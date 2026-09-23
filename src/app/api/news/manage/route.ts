import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { apiError, audit } from "@/lib/audit";
import { notifySystem } from "@/lib/discord";

export const runtime = "nodejs";

const createSchema = z.object({
  slug: z.string().min(3).max(120),
  titleRu: z.string().min(3), titleEn: z.string().min(3),
  shortRu: z.string().max(300), shortEn: z.string().max(300),
  contentRu: z.string().min(10), contentEn: z.string().min(10),
  category: z.string().default("GENERAL"),
});

export async function POST(req: NextRequest) {
  try {
    const u = await requirePermission("NEWS.CREATE");
    const body = createSchema.parse(await req.json());
    const slug = body.slug.toLowerCase().replace(/[^a-z0-9-]/g, "-");
    const existing = await db.news.findUnique({ where: { slug } });
    if (existing) return Response.json({ error: "Slug already exists", status: 409 }, { status: 409 });
    const news = await db.news.create({
      data: { ...body, slug, authorId: u.id, status: "PUBLISHED" },
    });
    await audit({ userId: u.id, action: "NEWS_CREATED", target: news.slug });
    await notifySystem("MERIDIAN AIR — NEW ARTICLE", body.titleEn);
    return Response.json({ ok: true, slug }, { status: 201 });
  } catch (e) {
    return apiError(e);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const u = await requirePermission("NEWS.DELETE");
    const slug = req.nextUrl.searchParams.get("slug");
    if (!slug) return Response.json({ error: "slug required", status: 400 }, { status: 400 });
    await db.news.delete({ where: { slug } });
    await audit({ userId: u.id, action: "NEWS_DELETED", target: slug });
    return Response.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
