import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentAuthContext } from "@/lib/auth";

export async function GET() {
  const { userId, role } = await getCurrentAuthContext();

  if (!userId || !(role === "admin" || role === "teacher")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const lessons = await prisma.lesson.findMany({
    where:
      role === "teacher"
        ? {
            OR: [
              { teacherId: userId },
              {
                AND: [
                  { class: { assignedTeachers: { some: { id: userId, isArchived: false } } } },
                  { subject: { teachers: { some: { id: userId, isArchived: false } } } },
                ],
              },
            ],
          }
        : undefined,
    select: {
      id: true,
      name: true,
      subjectId: true,
      classId: true,
      teacherId: true,
      subject: { select: { name: true } },
      class: { select: { name: true } },
    },
    orderBy: [{ class: { name: "asc" } }, { subject: { name: "asc" } }],
  });

  const [subjects, classes, teachers] = await Promise.all([
    role === "teacher"
      ? prisma.subject.findMany({
          where: { lessons: { some: { id: { in: lessons.map((lesson) => lesson.id) } } } },
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        })
      : prisma.subject.findMany({
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        }),
    role === "teacher"
      ? prisma.class.findMany({
          where: { lessons: { some: { id: { in: lessons.map((lesson) => lesson.id) } } } },
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        })
      : prisma.class.findMany({
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        }),
    role === "admin"
      ? prisma.teacher.findMany({
          where: { isArchived: false },
          select: { id: true, name: true, surname: true },
          orderBy: [{ name: "asc" }, { surname: "asc" }],
        })
      : prisma.teacher.findMany({
          where: { id: userId, isArchived: false },
          select: { id: true, name: true, surname: true },
        }),
  ]);

  return NextResponse.json({ subjects, classes, teachers, lessons, currentUserId: userId, role });
}
