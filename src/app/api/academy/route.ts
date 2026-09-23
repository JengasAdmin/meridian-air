import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { apiError } from "@/lib/audit";

export const runtime = "nodejs";

export async function GET() {
  try {
    const [courses, instructors] = await Promise.all([
      db.trainingCourse.findMany({ where: { active: true }, orderBy: { key: "asc" } }),
      db.userRole.findMany({
        where: { role: { key: { in: ["MRD_CHIEF_INSTRUCTOR", "MRD_INSTRUCTOR", "MRD_SENIOR_INSTRUCTOR", "MRD_HEAD_TRAINING"] } } },
        include: { role: true, user: { include: { pilotProfile: true } } },
        distinct: ["userId"],
      }),
    ]);
    return Response.json({
      courses,
      instructors: instructors.map((i) => ({
        name: i.user.name, pilotId: i.user.pilotProfile?.pilotId,
        roleRu: i.role.nameRu, roleEn: i.role.nameEn,
      })),
    });
  } catch (e) {
    return apiError(e);
  }
}

const enrollSchema = z.object({ courseId: z.string() });

export async function POST(req: NextRequest) {
  try {
    const u = await requireUser();
    const body = enrollSchema.parse(await req.json());
    const course = await db.trainingCourse.findUnique({ where: { id: body.courseId } });
    if (!course) return Response.json({ error: "Course not found", status: 404 }, { status: 404 });
    const existing = await db.trainingRecord.findFirst({
      where: { userId: u.id, courseId: course.id, status: { in: ["ENROLLED", "IN_PROGRESS"] } },
    });
    if (existing) return Response.json({ error: "Already enrolled", status: 409 }, { status: 409 });
    await db.trainingRecord.create({ data: { userId: u.id, courseId: course.id } });
    return Response.json({ ok: true }, { status: 201 });
  } catch (e) {
    return apiError(e);
  }
}
