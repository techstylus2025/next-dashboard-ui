import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function GET() {
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  // fetch reference data
  const [subjects, classes, teachers, lessons] = await Promise.all([
    prisma.subject.findMany({ select: { id: true, name: true } }),
    prisma.class.findMany({ select: { id: true, name: true } }),
    prisma.teacher.findMany({ select: { id: true, name: true, surname: true } }),
    prisma.lesson.findMany({ select: { id: true, subjectId: true, classId: true, teacherId: true } }),
  ]);

  return NextResponse.json({ subjects, classes, teachers, lessons, currentUserId: userId, role });
}
