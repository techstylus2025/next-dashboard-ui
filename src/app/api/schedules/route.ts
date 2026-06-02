import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const id = searchParams.get("id");

  if (!type || !id) {
    return NextResponse.json({ error: "Missing schedule type or id." }, { status: 400 });
  }

  if (type !== "teacherId" && type !== "classId") {
    return NextResponse.json({ error: "Invalid schedule type." }, { status: 400 });
  }

  const where =
    type === "teacherId"
      ? { teacherId: id }
      : { classId: Number(id) };

  if (type === "classId" && Number.isNaN(where.classId)) {
    return NextResponse.json({ error: "Invalid class id." }, { status: 400 });
  }

  const lessons = await prisma.lesson.findMany({
    where,
    include: { subject: true },
  });

  const data = lessons.map((lesson) => ({
    title: lesson.subject?.name ? `${lesson.subject.name} • ${lesson.name}` : lesson.name,
    start: lesson.startTime.toISOString(),
    end: lesson.endTime.toISOString(),
  }));

  return NextResponse.json({ data });
}
