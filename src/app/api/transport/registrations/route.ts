import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";

const getRoleFromSession = async () => {
  const { sessionClaims, userId } = await auth();
  let role = (sessionClaims?.metadata as { role?: string })?.role;

  if (!role && userId) {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    role = (user?.publicMetadata as { role?: string })?.role;
  }

  return role;
};

export async function GET() {
  const role = await getRoleFromSession();
  if (role !== "admin") {
    return NextResponse.json({ error: "Unauthorized: admin access required." }, { status: 403 });
  }

  const registrations = await prisma.busRegistration.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      bus: true,
      student: true,
      parent: true,
      class: true,
    },
  });

  return NextResponse.json({
    registrations: registrations.map((registration) => ({
      id: registration.id,
      busName: registration.bus.name,
      studentName: `${registration.student.name} ${registration.student.surname}`,
      className: registration.class.name,
      parentName: `${registration.parent.name} ${registration.parent.surname}`,
      parentPhone: registration.parent.phone,
      location: registration.location,
      createdAt: registration.createdAt.toISOString(),
    })),
  });
}

export async function POST(request: Request) {
  const role = await getRoleFromSession();
  if (role !== "admin") {
    return NextResponse.json({ error: "Unauthorized: admin access required." }, { status: 403 });
  }

  const payload = await request.json();
  const studentId = payload?.studentId?.toString()?.trim();
  const busId = Number(payload?.busId);
  const location = payload?.location?.toString()?.trim();

  if (!studentId || Number.isNaN(busId) || !location) {
    return NextResponse.json({ error: "Student, bus and location are required." }, { status: 400 });
  }

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: { parent: true, class: true },
  });

  if (!student) {
    return NextResponse.json({ error: "Student not found." }, { status: 404 });
  }

  const bus = await prisma.bus.findUnique({ where: { id: busId } });
  if (!bus) {
    return NextResponse.json({ error: "Bus not found." }, { status: 404 });
  }

  try {
    const registration = await prisma.busRegistration.create({
      data: {
        busId,
        studentId,
        parentId: student.parentId,
        classId: student.classId,
        location,
      },
    });

    return NextResponse.json({
      registration: {
        id: registration.id,
        busName: bus.name,
        studentName: `${student.name} ${student.surname}`,
        className: student.class.name,
        parentName: `${student.parent.name} ${student.parent.surname}`,
        parentPhone: student.parent.phone,
        location: registration.location,
        createdAt: registration.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Bus registration failed:", error);
    const message = error instanceof Error ? error.message : String(error);
    if (process.env.NODE_ENV !== "production") {
      return NextResponse.json({ error: `Unable to register student. ${message}` }, { status: 500 });
    }
    return NextResponse.json({ error: "Unable to register student. Please check server logs for details." }, { status: 500 });
  }
}
