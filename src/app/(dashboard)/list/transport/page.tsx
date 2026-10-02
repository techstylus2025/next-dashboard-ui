import type { Metadata } from "next";
import prisma from "@/lib/prisma";
import { getCurrentAuthContext } from "@/lib/auth";
import TransportDashboard from "@/components/transport/TransportDashboard";

export const metadata: Metadata = {
  title: "Transport",
};

export default async function TransportPage() {
  const { userId, role: authRole } = await getCurrentAuthContext();
  const role = authRole === "admin" || authRole === "teacher" || authRole === "parent" || authRole === "student"
    ? authRole
    : undefined;

  const parentName = role === "parent" && userId
    ? await prisma.parent
        .findUnique({ where: { id: userId }, select: { name: true, surname: true } })
        .then((parent) => (parent ? `${parent.name} ${parent.surname}` : undefined))
    : undefined;

  const parentStudents =
    role === "parent" && userId
      ? await prisma.student.findMany({
          where: { parentId: userId, isArchived: false },
          include: { class: true },
          orderBy: { name: "asc" },
        })
      : [];

  const adminStudentChoices =
    role === "admin"
      ? await prisma.student.findMany({
          where: { isArchived: false },
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
