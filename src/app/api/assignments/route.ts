import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function POST(req: Request) {
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  if (!userId || !(role === "admin" || role === "teacher")) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
  }

  const body = await req.json();
  const { lessonId, title, questions, startDate, dueDate } = body;

  if (!lessonId || !dueDate || !startDate) {
    return NextResponse.json({ success: false, error: "Missing fields" }, { status: 400 });
  }

  try {
    const created = await prisma.assignment.create({
      data: {
        title: title || "Assignment",
        questions: questions || null,
        startDate: new Date(startDate),
        dueDate: new Date(dueDate),
        lesson: { connect: { id: lessonId } },
      },
    });

    return NextResponse.json({ success: true, data: created });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, error: "Create failed" }, { status: 500 });
  }
}
