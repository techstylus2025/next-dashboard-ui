import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import TransportDashboard from "@/components/transport/TransportDashboard";

export const metadata: Metadata = {
  title: "Transport",
};

export default async function TransportPage() {
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  const parentName = role === "parent" && userId
    ? await prisma.parent
        .findUnique({ where: { id: userId }, select: { name: true, surname: true } })
        .then((parent) => (parent ? `${parent.name} ${parent.surname}` : undefined))
    : undefined;

  const parentStudents =
    role === "parent" && userId
      ? await prisma.student.findMany({
          where: { parentId: userId },
          include: { class: true },
          orderBy: { name: "asc" },
        })
      : [];

  const adminStudentChoices =
    role === "admin"
      ? await prisma.student.findMany({
          include: { class: true, parent: true },
          orderBy: { name: "asc" },
        })
      : [];

  return (
    <div className="flex-1 p-4 min-h-[60vh] rounded-2xl bg-lamaSkyLight">
      <TransportDashboard
        role={role}
        userId={userId}
        parentName={parentName}
        parentStudents={parentStudents.map((student) => ({
          id: student.id,
          name: student.name,
          surname: student.surname,
          classId: student.classId,
          className: student.class.name,
        }))}
        adminStudentChoices={adminStudentChoices.map((student) => ({
          id: student.id,
          name: student.name,
          surname: student.surname,
          classId: student.classId,
          className: student.class.name,
          parentName: `${student.parent.name} ${student.parent.surname}`,
          parentPhone: student.parent.phone,
        }))}
      />
    </div>
  );
}
