import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";

export const getTeacherAssignmentWhere = (
  teacherId: string
): Prisma.AssignmentWhereInput => ({
  lesson: {
    OR: [
      { teacherId },
      { class: { supervisorId: teacherId } },
      {
        AND: [
          { class: { assignedTeachers: { some: { id: teacherId, isArchived: false } } } },
          { subject: { teachers: { some: { id: teacherId, isArchived: false } } } },
        ],
      },
    ],
  },
});

export const teacherCanCreateAssignmentForLesson = async (
  teacherId: string,
  lessonId: number
) => {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: {
      teacherId: true,
      class: {
        select: {
          assignedTeachers: {
            where: { id: teacherId, isArchived: false },
            select: { id: true },
          },
        },
      },
      subject: {
        select: {
          teachers: {
            where: { id: teacherId, isArchived: false },
            select: { id: true },
          },
        },
      },
    },
  });

  return Boolean(
    lesson &&
      (lesson.teacherId === teacherId ||
        (lesson.class.assignedTeachers.length > 0 &&
          lesson.subject.teachers.length > 0))
  );
};

export const teacherCanAccessAssignment = async (
  teacherId: string,
  lessonId: number
) => {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: {
      teacherId: true,
      class: {
        select: {
          supervisorId: true,
          assignedTeachers: {
            where: { id: teacherId, isArchived: false },
            select: { id: true },
          },
        },
      },
      subject: {
        select: {
          teachers: {
            where: { id: teacherId, isArchived: false },
            select: { id: true },
          },
        },
      },
    },
  });

  return Boolean(
    lesson &&
      (lesson.teacherId === teacherId ||
        lesson.class.supervisorId === teacherId ||
        (lesson.class.assignedTeachers.length > 0 &&
          lesson.subject.teachers.length > 0))
  );
};
