import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentAuthContext } from "@/lib/auth";
import { teacherCanCreateAssignmentForLesson } from "@/lib/assignmentAccess";

export async function POST(req: Request) {
  const { userId, role } = await getCurrentAuthContext();

  if (!userId || !(role === "admin" || role === "teacher")) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
  }

  const body = await req.json();
  const { lessonId, title, questions, startDate, dueDate } = body;
  const parsedLessonId = Number(lessonId);
  const parsedStartDate = new Date(startDate);
  const parsedDueDate = new Date(dueDate);

  if (
    !Number.isInteger(parsedLessonId) ||
    parsedLessonId <= 0 ||
    typeof title !== "string" ||
    !title.trim() ||
    !Number.isFinite(parsedStartDate.getTime()) ||
    !Number.isFinite(parsedDueDate.getTime()) ||
    parsedStartDate > parsedDueDate ||
    (questions !== undefined && questions !== null && typeof questions !== "string")
  ) {
    return NextResponse.json({ success: false, error: "Enter a title, lesson, and valid assignment dates." }, { status: 400 });
  }

  if (
    role === "teacher" &&
    !(await teacherCanCreateAssignmentForLesson(userId, parsedLessonId))
  ) {
    return NextResponse.json(
      { success: false, error: "You can only create assignments for your assigned classes and subjects." },
      { status: 403 }
    );
  }

  try {
    const created = await prisma.assignment.create({
      data: {
        title: title.trim(),
        questions: typeof questions === "string" && questions.trim() ? questions.trim() : null,
        startDate: parsedStartDate,
        dueDate: parsedDueDate,
        lesson: { connect: { id: parsedLessonId } },
      },
    });

    return NextResponse.json({ success: true, data: created });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, error: "Create failed" }, { status: 500 });
  }
}
