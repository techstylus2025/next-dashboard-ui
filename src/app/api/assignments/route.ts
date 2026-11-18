import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentAuthContext } from "@/lib/auth";
import { isCloudinaryAssignmentImage } from "@/lib/assignmentImages";
import {
  teacherCanCreateAssignmentForLesson,
} from "@/lib/assignmentAccess";

export async function POST(req: Request) {
  const { userId, role } = await getCurrentAuthContext();

  if (!userId || !(role === "admin" || role === "teacher")) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
  }

  const body = await req.json();
  const { lessonId, title, questions, startDate, dueDate, imageUrl } = body;
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

  if (imageUrl !== undefined && imageUrl !== null && !isCloudinaryAssignmentImage(imageUrl)) {
    return NextResponse.json(
      { success: false, error: "Choose a valid uploaded assignment image." },
      { status: 400 }
    );
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
        imageUrl: imageUrl ?? null,
        startDate: parsedStartDate,
        dueDate: parsedDueDate,
        lesson: { connect: { id: parsedLessonId } },
      },
    });

    return NextResponse.json({ success: true, data: created });
  } catch (err) {
    console.error("Assignment creation failed:", err);

    const code =
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      typeof err.code === "string"
        ? err.code
        : null;
    const message =
      err instanceof Error ? err.message : "Unable to save the assignment.";
    const error =
      process.env.NODE_ENV !== "production"
        ? message
        : code === "P1001" || code === "P1002"
          ? "The database connection is unavailable. Please try again shortly."
          : code === "P2021" || code === "P2022"
            ? "The assignment database schema is out of date. Apply pending database migrations."
            : "Create failed";

    return NextResponse.json({ success: false, error }, { status: 500 });
  }
}
