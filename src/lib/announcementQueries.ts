import type { Prisma } from "@prisma/client";

export function buildAnnouncementWhere(
  role: string | undefined,
  userId: string | undefined
): Prisma.AnnouncementWhereInput {
  const query: Prisma.AnnouncementWhereInput = { isArchived: false };

  if (role === "admin" || !role) {
    return query;
  }

  if (!userId) {
    return { id: { in: [] } };
  }

  const roleConditions = {
    teacher: { lessons: { some: { teacherId: userId } } },
    student: { students: { some: { id: userId } } },
    parent: { students: { some: { parentId: userId } } },
  };

  query.OR = [
    { classId: null },
    {
      class: roleConditions[role as keyof typeof roleConditions] || {},
    },
  ];

  return query;
}
