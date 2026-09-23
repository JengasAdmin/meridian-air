import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { apiError } from "@/lib/audit";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const slug = req.nextUrl.searchParams.get("slug");
    if (slug) {
      const news = await db.news.findUnique({ where: { slug }, include: { author: true } });
      if (!news) return Response.json({ error: "Not found", status: 404 }, { status: 404 });
      return Response.json({ news });
    }
    const news = await db.news.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { publishedAt: "desc" },
      take: 30,
    });
    return Response.json({ news });
  } catch (e) {
    return apiError(e);
  }
}
