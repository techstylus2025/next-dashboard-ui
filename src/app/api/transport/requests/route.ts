import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  const { userId, sessionClaims } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (role === "admin") {
    const requests = await prisma.transportRequest.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        parent: true,
        student: true,
        class: true,
      },
    });
    return NextResponse.json({
      requests: requests.map((request) => ({
        id: request.id,
        parentName: request.parent.name + " " + request.parent.surname,
        studentName: request.student.name + " " + request.student.surname,
        className: request.class.name,
        routine: request.routine,
        status: request.status,
        createdAt: request.createdAt.toISOString(),
        updatedAt: request.updatedAt.toISOString(),
      })),
    });
  }

  if (role === "parent") {
    const requests = await prisma.transportRequest.findMany({
      where: { parentId: userId },
      orderBy: { createdAt: "desc" },
      include: {
        parent: true,
        student: true,
        class: true,
      },
    });
    return NextResponse.json({
      requests: requests.map((request) => ({
        id: request.id,
        parentName: request.parent.name + " " + request.parent.surname,
        studentName: request.student.name + " " + request.student.surname,
        className: request.class.name,
        routine: request.routine,
        status: request.status,
        createdAt: request.createdAt.toISOString(),
        updatedAt: request.updatedAt.toISOString(),
      })),
    });
  }

  return NextResponse.json({ requests: [] });
}

export async function POST(request: Request) {
  const { userId, sessionClaims } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (role !== "parent") {
    return NextResponse.json({ error: "Only parents can create requests." }, { status: 403 });
  }

  const payload = await request.json();
  const studentId = payload?.studentId?.toString()?.trim();
  const routine = payload?.routine?.toString()?.trim();

  if (!studentId || !routine) {
    return NextResponse.json({ error: "Student and routine are required." }, { status: 400 });
  }

  const student = await prisma.student.findFirst({ where: { id: studentId, parentId: userId }, include: { class: true } });
  if (!student) {
    return NextResponse.json({ error: "Student not found for this parent." }, { status: 400 });
  }

  if (!["REGULAR", "RANDOM_DAYS"].includes(routine)) {
    return NextResponse.json({ error: "Invalid transport routine." }, { status: 400 });
  }

  try {
    const transportRequest = await prisma.transportRequest.create({
      data: {
        parentId: userId,
        studentId: student.id,
        classId: student.classId,
        routine,
      },
    });
    return NextResponse.json({
      request: {
        id: transportRequest.id,
        routine: transportRequest.routine,
        status: transportRequest.status,
        createdAt: transportRequest.createdAt.toISOString(),
        updatedAt: transportRequest.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Unable to submit request." }, { status: 500 });
  }
}
