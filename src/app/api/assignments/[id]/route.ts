import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, sessionClaims } = await auth();
    const role = (sessionClaims?.metadata as { role?: string })?.role;

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

    if (isArchived !== undefined && typeof isArchived !== "boolean") {
      return NextResponse.json(
        { success: false, error: "Invalid isArchived value" },
        { status: 400 }
      );
    }

    const updated = await prisma.assignment.update({
      where: { id: assignmentId },
      data: {
        ...(title !== undefined && { title }),
        ...(questions !== undefined && { questions }),
        ...(startDate !== undefined && {
          startDate: new Date(startDate),
        }),
        ...(dueDate !== undefined && {
          dueDate: new Date(dueDate),
        }),
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
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  if (!userId || role !== "admin") {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 403 }
    );
  }

  try {
    const { id } = await params;

    await prisma.assignment.delete({
      where: { id: parseInt(id) },
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