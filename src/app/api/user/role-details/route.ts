import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  const role = searchParams.get("role");

  if (!userId || !role) {
    return NextResponse.json({ error: "Missing userId or role" }, { status: 400 });
  }

  try {
    if (role === "teacher") {
      // Fetch teacher subjects
      const teacher = await prisma.teacher.findUnique({
        where: { id: userId },
        select: {
          subjects: { select: { name: true } },
          classes: { select: { name: true } },
        },
      });

      const subjects = teacher?.subjects?.map((s) => s.name) ?? [];
      const supervisorClass = teacher?.classes?.[0]?.name ?? null;

      return NextResponse.json({
        subjects: subjects.length > 0 ? subjects : null,
        supervisorClass,
      });
    }

    if (role === "admin") {
      // Admins don't have specific details to fetch
      return NextResponse.json({
        subjects: null,
        supervisorClass: null,
      });
    }

    if (role === "student") {
      // Fetch student class
      const student = await prisma.student.findUnique({
        where: { id: userId },
        select: { class: { select: { name: true } } },
      });

      return NextResponse.json({
        subjects: null,
        supervisorClass: student?.class?.name ?? null,
      });
    }

    if (role === "parent") {
      const parent = await prisma.parent.findUnique({
        where: { id: userId },
        select: {
          students: { select: { img: true, name: true, surname: true } },
        },
      });

      const studentPictures = parent?.students
        .filter((student) => Boolean(student.img))
        .map((student) => student.img as string) ?? [];

      return NextResponse.json({
        subjects: null,
        supervisorClass: null,
        studentPictures,
      });
    }

    return NextResponse.json({
      subjects: null,
      supervisorClass: null,
    });
  } catch (error) {
    console.error("Error fetching role details:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
