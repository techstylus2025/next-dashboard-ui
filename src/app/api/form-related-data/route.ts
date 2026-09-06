import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { loadGradingLevels } from "@/lib/gradingData";
import { GRADING_LEVEL_LABELS } from "@/lib/gradingUtils";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const table = url.searchParams.get("table");

  let role: string | undefined;
  let currentUserId: string | undefined;

  try {
    const { sessionClaims } = await auth();
    role = (sessionClaims?.metadata as { role?: string })?.role;
    currentUserId = sessionClaims?.sub;
  } catch {
    role = undefined;
    currentUserId = undefined;
  }

  let relatedData: any = {};

  switch (table) {
    case "subject": {
      const subjectTeachers = await prisma.teacher.findMany({
        where: { isArchived: false },
        select: { id: true, name: true, surname: true },
      });
      relatedData = { teachers: subjectTeachers };
      break;
    }
    case "class": {
      const classGrades = await loadGradingLevels();
      // Fallback: if no grades found in DB, use default grading levels from utils
      const fallbackGrades = Object.entries(GRADING_LEVEL_LABELS).map(([level, label], idx) => ({ id: -(idx + 1), level, label }));
      const finalClassGrades = (classGrades && classGrades.length > 0) ? classGrades : fallbackGrades;
      const classTeachers = await prisma.teacher.findMany({
        where: { isArchived: false },
        select: { id: true, name: true, surname: true },
        orderBy: [{ name: "asc" }, { surname: "asc" }],
      });
      relatedData = { teachers: classTeachers, grades: finalClassGrades };
      break;
    }
    case "teacher": {
      const teacherSubjects = await prisma.subject.findMany({
        select: { id: true, name: true },
      });
      relatedData = { subjects: teacherSubjects };
      break;
    }
    case "student": {
      const studentClasses = await prisma.class.findMany({
        include: { _count: { select: { students: true } } },
      });
      const parents = await prisma.parent.findMany({
        where: { isArchived: false },
        select: { id: true, name: true, surname: true },
        orderBy: { name: "asc" },
      });
      relatedData = { classes: studentClasses, parents };
      break;
    }
    case "exam": {
      const examLessons = await prisma.lesson.findMany({
        where: {
          ...(role === "teacher" ? { teacherId: currentUserId!, teacher: { isArchived: false } } : {}),
        },
        select: { id: true, name: true },
      });
      relatedData = { lessons: examLessons };
      break;
    }
    case "attendance": {
      const attendanceStudents = await prisma.student.findMany({
        where: {
          isArchived: false,
          ...(role === "teacher"
            ? { class: { supervisorId: currentUserId! } }
            : {}),
        },
        include: { class: true },
        orderBy: { name: "asc" },
      });
      const attendanceLessons = await prisma.lesson.findMany({
        where: {
          ...(role === "teacher"
            ? { class: { supervisorId: currentUserId! } }
            : {}),
        },
        include: { class: true, teacher: true },
        orderBy: { name: "asc" },
      });
      const attendanceTeachers =
        role === "admin"
          ? await prisma.teacher.findMany({
              select: { id: true, name: true, surname: true },
              orderBy: { name: "asc" },
            })
          : [];
      relatedData = {
        students: attendanceStudents,
        lessons: attendanceLessons,
        teachers: attendanceTeachers,
      };
      break;
    }
    case "event": {
      const eventClasses = await prisma.class.findMany({
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      });
      relatedData = { classes: eventClasses };
      break;
    }
    default:
      relatedData = {};
  }

  return NextResponse.json(relatedData);
}
