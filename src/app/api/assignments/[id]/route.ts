import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentAuthContext } from "@/lib/auth";
import { teacherCanAccessAssignment } from "@/lib/assignmentAccess";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, role } = await getCurrentAuthContext();

    if (!userId || !(role === "admin" || role === "teacher")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    const { id } = await params;

    const body = await req.json();
    const {
      title,
      questions,
      startDate,
      dueDate,
      isArchived,
      id: bodyId,
    } = body;

    let assignmentId = Number.isInteger(Number(id))
      ? Number(id)
      : undefined;

    if (!assignmentId && typeof bodyId === "number" && Number.isInteger(bodyId)) {
      assignmentId = bodyId;
    } else if (
      !assignmentId &&
      typeof bodyId === "string" &&
      /^\d+$/.test(bodyId.trim())
    ) {
      assignmentId = parseInt(bodyId.trim(), 10);
    }

    if (!assignmentId) {
      console.error("Invalid assignment id in PUT /api/assignments/[id]", {
        paramsId: id,
        bodyId,
      });

      return NextResponse.json(
        { success: false, error: "Invalid assignment id" },
        { status: 400 }
      );
    }

    const existing = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      select: { id: true, lessonId: true },
    });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Assignment not found" },
        { status: 404 }
      );
    }

    if (
      role === "teacher" &&
      !(await teacherCanAccessAssignment(userId, existing.lessonId))
    ) {
      return NextResponse.json(
        { success: false, error: "You do not have access to this assignment." },
        { status: 403 }
      );
    }

    if (isArchived !== undefined && typeof isArchived !== "boolean") {
      return NextResponse.json(
        { success: false, error: "Invalid isArchived value" },
        { status: 400 }
      );
    }

    if (title !== undefined && (typeof title !== "string" || !title.trim())) {
      return NextResponse.json(
        { success: false, error: "Assignment title cannot be empty." },
        { status: 400 }
      );
    }
    if (
      questions !== undefined &&
      questions !== null &&
      typeof questions !== "string"
    ) {
      return NextResponse.json(
        { success: false, error: "Assignment instructions must be text." },
        { status: 400 }
      );
    }

    const parsedStartDate =
      startDate !== undefined ? new Date(startDate) : undefined;
    const parsedDueDate = dueDate !== undefined ? new Date(dueDate) : undefined;
    if (
      (parsedStartDate && !Number.isFinite(parsedStartDate.getTime())) ||
      (parsedDueDate && !Number.isFinite(parsedDueDate.getTime())) ||
      (parsedStartDate &&
        parsedDueDate &&
        parsedStartDate.getTime() > parsedDueDate.getTime())
    ) {
      return NextResponse.json(
        { success: false, error: "Enter valid assignment dates." },
        { status: 400 }
      );
    }

    const updated = await prisma.assignment.update({
      where: { id: assignmentId },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(questions !== undefined && {
          questions: typeof questions === "string" && questions.trim() ? questions.trim() : null,
        }),
        ...(parsedStartDate && { startDate: parsedStartDate }),
        ...(parsedDueDate && { dueDate: parsedDueDate }),
        ...(isArchived !== undefined && {
          isArchived,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (err) {
    console.error("Assignment update error:", err);

    const message = err instanceof Error ? err.message : String(err);
    const errorMessage =
      process.env.NODE_ENV === "production"
        ? "Update failed"
        : message;

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId, role } = await getCurrentAuthContext();

  if (!userId || !(role === "admin" || role === "teacher")) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 403 }
    );
  }

  try {
    const { id } = await params;
    const assignmentId = Number(id);
    if (!Number.isInteger(assignmentId) || assignmentId <= 0) {
      return NextResponse.json(
        { success: false, error: "Invalid assignment id" },
        { status: 400 }
      );
    }

    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      select: { lessonId: true },
    });
    if (!assignment) {
      return NextResponse.json(
        { success: false, error: "Assignment not found" },
        { status: 404 }
      );
    }
    if (
      role === "teacher" &&
      !(await teacherCanAccessAssignment(userId, assignment.lessonId))
    ) {
      return NextResponse.json(
        { success: false, error: "You do not have access to this assignment." },
        { status: 403 }
      );
    }

    await prisma.assignment.delete({
      where: { id: assignmentId },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      { success: false, error: "Delete failed" },
      { status: 500 }
    );
  }
}