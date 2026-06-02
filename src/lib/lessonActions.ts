"use server";

import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export type LessonInput = {
  id?: number;
  name: string;
  day: string;
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  subjectId: number;
  classId: number;
  teacherId: string;
};

// Helper to create a date with specific day of week and time
const createLessonDateTime = (dayString: string, timeString: string): Date => {
  // Map day name to day of week (0 = Sunday, 1 = Monday, etc.)
  const dayMap: Record<string, number> = {
    MONDAY: 1,
    TUESDAY: 2,
    WEDNESDAY: 3,
    THURSDAY: 4,
    FRIDAY: 5,
    SATURDAY: 6,
    SUNDAY: 0,
  };

  const targetDayOfWeek = dayMap[dayString.toUpperCase()] || 1;
  
  // Create a date set to that day of week
  const date = new Date();
  const currentDayOfWeek = date.getDay();
  const daysToAdd = targetDayOfWeek - currentDayOfWeek;
  
  date.setDate(date.getDate() + daysToAdd);
  
  // Parse time (HH:mm)
  const [hours, minutes] = timeString.split(":").map(Number);
  date.setHours(hours, minutes, 0, 0);
  
  return date;
};

export async function createLesson(input: LessonInput) {
  try {
    const { userId, sessionClaims } = await auth();
    const role = (sessionClaims?.metadata as { role?: string })?.role;

    if (role !== "admin") {
      return { success: false, error: "Only admins can create lessons" };
    }

    if (!userId) {
      return { success: false, error: "User not authenticated" };
    }

    const startDateTime = createLessonDateTime(input.day, input.startTime);
    const endDateTime = createLessonDateTime(input.day, input.endTime);

    if (endDateTime <= startDateTime) {
      return { success: false, error: "End time must be after start time." };
    }

    const classConflict = await prisma.lesson.findFirst({
      where: {
        classId: input.classId,
        day: input.day as any,
        AND: [
          { startTime: { lt: endDateTime } },
          { endTime: { gt: startDateTime } },
        ],
      },
      include: {
        class: true,
      },
    });

    if (classConflict) {
      return {
        success: false,
        error: `This class already has a lesson scheduled at that time (${classConflict.name}).`,
      };
    }

    const teacherConflict = await prisma.lesson.findFirst({
      where: {
        teacherId: input.teacherId,
        day: input.day as any,
        AND: [
          { startTime: { lt: endDateTime } },
          { endTime: { gt: startDateTime } },
        ],
      },
      include: {
        class: true,
      },
    });

    if (teacherConflict) {
      return {
        success: false,
        error: `This teacher is already assigned to a lesson at that time for class ${teacherConflict.class.name}.`,
      };
    }

    const duplicateSubjectLesson = await prisma.lesson.findFirst({
      where: {
        classId: input.classId,
        subjectId: input.subjectId,
        day: input.day as any,
        startTime: startDateTime,
        endTime: endDateTime,
      },
      include: {
        class: true,
      },
    });

    if (duplicateSubjectLesson) {
      return {
        success: false,
        error: `A lesson with this subject and time already exists for class ${duplicateSubjectLesson.class.name}.`,
      };
    }

    const lesson = await prisma.lesson.create({
      data: {
        name: input.name,
        day: input.day as any,
        startTime: startDateTime,
        endTime: endDateTime,
        subjectId: input.subjectId,
        classId: input.classId,
        teacherId: input.teacherId,
      },
      include: {
        subject: true,
        class: true,
        teacher: true,
      },
    });

    return { success: true, data: lesson };
  } catch (error) {
    console.error("Error creating lesson:", error);
    return { success: false, error: "Failed to create lesson" };
  }
}

export async function updateLesson(input: LessonInput) {
  try {
    const { userId, sessionClaims } = await auth();
    const role = (sessionClaims?.metadata as { role?: string })?.role;

    if (role !== "admin") {
      return { success: false, error: "Only admins can update lessons" };
    }

    if (!userId || !input.id) {
      return { success: false, error: "Invalid input" };
    }

    const startDateTime = createLessonDateTime(input.day, input.startTime);
    const endDateTime = createLessonDateTime(input.day, input.endTime);

    if (endDateTime <= startDateTime) {
      return { success: false, error: "End time must be after start time." };
    }

    const classConflict = await prisma.lesson.findFirst({
      where: {
        classId: input.classId,
        day: input.day as any,
        id: { not: input.id },
        AND: [
          { startTime: { lt: endDateTime } },
          { endTime: { gt: startDateTime } },
        ],
      },
      include: {
        class: true,
      },
    });

    if (classConflict) {
      return {
        success: false,
        error: `This class already has a lesson scheduled at that time (${classConflict.name}).`,
      };
    }

    const teacherConflict = await prisma.lesson.findFirst({
      where: {
        teacherId: input.teacherId,
        day: input.day as any,
        id: { not: input.id },
        AND: [
          { startTime: { lt: endDateTime } },
          { endTime: { gt: startDateTime } },
        ],
      },
      include: {
        class: true,
      },
    });

    if (teacherConflict) {
      return {
        success: false,
        error: `This teacher is already assigned to a lesson at that time for class ${teacherConflict.class.name}.`,
      };
    }

    const duplicateSubjectLesson = await prisma.lesson.findFirst({
      where: {
        classId: input.classId,
        subjectId: input.subjectId,
        day: input.day as any,
        startTime: startDateTime,
        endTime: endDateTime,
        id: { not: input.id },
      },
      include: {
        class: true,
      },
    });

    if (duplicateSubjectLesson) {
      return {
        success: false,
        error: `A lesson with this subject and time already exists for class ${duplicateSubjectLesson.class.name}.`,
      };
    }

    const lesson = await prisma.lesson.update({
      where: { id: input.id },
      data: {
        name: input.name,
        day: input.day as any,
        startTime: startDateTime,
        endTime: endDateTime,
        subjectId: input.subjectId,
        classId: input.classId,
        teacherId: input.teacherId,
      },
      include: {
        subject: true,
        class: true,
        teacher: true,
      },
    });

    return { success: true, data: lesson };
  } catch (error) {
    console.error("Error updating lesson:", error);
    return { success: false, error: "Failed to update lesson" };
  }
}

export async function deleteLesson(id: number) {
  try {
    const { userId, sessionClaims } = await auth();
    const role = (sessionClaims?.metadata as { role?: string })?.role;

    if (role !== "admin") {
      return { success: false, error: "Only admins can delete lessons" };
    }

    if (!userId) {
      return { success: false, error: "User not authenticated" };
    }

    await prisma.lesson.delete({
      where: { id },
    });

    return { success: true };
  } catch (error) {
    console.error("Error deleting lesson:", error);
    return { success: false, error: "Failed to delete lesson" };
  }
}

export async function getLessons(classId?: number, teacherId?: string) {
  try {
    const lessons = await prisma.lesson.findMany({
      where: {
        ...(classId && { classId }),
        ...(teacherId && { teacherId }),
      },
      include: {
        subject: true,
        class: true,
        teacher: true,
      },
      orderBy: [
        { day: "asc" },
        { startTime: "asc" },
      ],
    });

    return lessons;
  } catch (error) {
    console.error("Error fetching lessons:", error);
    return [];
  }
}
