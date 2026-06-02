"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { PrismaClient } from "@prisma/client";

const SETTINGS_PATH = "/list/settings";
const db = prisma as unknown as PrismaClient;

async function requireAdmin(): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await auth();
  const role = (session?.sessionClaims?.metadata as { role?: string })?.role;
  if (role !== "admin") {
    return { ok: false, error: "Only administrators can manage settings." };
  }
  return { ok: true };
}

export type TermInput = {
  termNumber: number;
  days: number;
  weeks: number;
  startDate: string;
  endDate: string;
};

type ArchiveCategory =
  | "fee"
  | "attendance"
  | "exams"
  | "assignments"
  | "events"
  | "announcements"
  | "results";

type ArchiveSelection = Record<ArchiveCategory, boolean>;

type PersonArchiveSelection = {
  attendance: boolean;
  exams: boolean;
  assignments: boolean;
  results: boolean;
};

export async function createAcademicYear(input: {
  label: string;
  numberOfTerms: number;
  terms: TermInput[];
  setAsActive?: boolean;
}): Promise<{ success: boolean; error: string | null }> {
  const authCheck = await requireAdmin();
  if (!authCheck.ok) return { success: false, error: authCheck.error };

  const label = input.label.trim();
  if (!label) return { success: false, error: "Academic year label is required." };
  if (input.numberOfTerms < 1 || input.numberOfTerms > 4) {
    return { success: false, error: "Number of terms must be between 1 and 4." };
  }
  if (input.terms.length !== input.numberOfTerms) {
    return {
      success: false,
      error: "Provide days, weeks, and dates for each term.",
    };
  }

  for (const term of input.terms) {
    if (term.days < 1 || term.weeks < 1) {
      return {
        success: false,
        error: `Term ${term.termNumber}: days and weeks must be at least 1.`,
      };
    }
    const start = new Date(term.startDate + "T00:00:00");
    const end = new Date(term.endDate + "T23:59:59");
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return { success: false, error: "Invalid term dates." };
    }
    if (end <= start) {
      return {
        success: false,
        error: `Term ${term.termNumber} end date must be after start date.`,
      };
    }
  }

  try {
    await db.$transaction(async (tx) => {
      if (input.setAsActive) {
        await tx.academicYear.updateMany({
          where: { isActive: true },
          data: { isActive: false },
        });
      }

      await tx.academicYear.create({
        data: {
          label,
          numberOfTerms: input.numberOfTerms,
          isActive: Boolean(input.setAsActive),
          terms: {
            create: input.terms.map((t) => ({
              termNumber: t.termNumber,
              days: t.days,
              weeks: t.weeks,
              startDate: new Date(t.startDate + "T00:00:00"),
              endDate: new Date(t.endDate + "T23:59:59"),
            })),
          },
        },
      });
    });

    revalidatePath(SETTINGS_PATH);
    return { success: true, error: null };
  } catch (e: unknown) {
    if ((e as { code?: string })?.code === "P2002") {
      return { success: false, error: "This academic year already exists." };
    }
    console.error(e);
    return { success: false, error: "Could not create academic year." };
  }
}

export async function archiveAcademicYear(
  academicYearId: number
): Promise<{
  success: boolean;
  error: string | null;
  summary?: string;
  counts?: {
    fee: number;
    attendance: number;
    exams: number;
    assignments: number;
    events: number;
    announcements: number;
    results: number;
  };
}> {
  const authCheck = await requireAdmin();
  if (!authCheck.ok) return { success: false, error: authCheck.error };

  try {
    const summary = await db.$transaction(async (tx) => {
      const year = await tx.academicYear.findUnique({
        where: { id: academicYearId },
        include: { terms: true },
      });

      if (!year) throw new Error("NOT_FOUND");
      if (year.isArchived) throw new Error("ALREADY_ARCHIVED");

      const starts = year.terms.map((t) => t.startDate.getTime());
      const ends = year.terms.map((t) => t.endDate.getTime());
      const rangeStart = new Date(Math.min(...starts));
      const rangeEnd = new Date(Math.max(...ends));

      await tx.academicYear.update({
        where: { id: academicYearId },
        data: {
          isArchived: true,
          isActive: false,
          archivedAt: new Date(),
        },
      });

      const fee = await tx.feeSchedule.updateMany({
        where: { academicYear: year.label, isArchived: false },
        data: { isArchived: true },
      });

      const attendance = await tx.attendance.updateMany({
        where: {
          isArchived: false,
          date: { gte: rangeStart, lte: rangeEnd },
        },
        data: { isArchived: true },
      });

      const exams = await tx.exam.updateMany({
        where: {
          isArchived: false,
          startTime: { gte: rangeStart, lte: rangeEnd },
        },
        data: { isArchived: true },
      });

      const assignments = await tx.assignment.updateMany({
        where: {
          isArchived: false,
          startDate: { gte: rangeStart, lte: rangeEnd },
        },
        data: { isArchived: true },
      });

      const events = await tx.event.updateMany({
        where: {
          isArchived: false,
          startTime: { gte: rangeStart, lte: rangeEnd },
        },
        data: { isArchived: true },
      });

      const announcements = await tx.announcement.updateMany({
        where: {
          isArchived: false,
          date: { gte: rangeStart, lte: rangeEnd },
        },
        data: { isArchived: true },
      });

      const resultsExam = await tx.result.updateMany({
        where: { isArchived: false, exam: { isArchived: true } },
        data: { isArchived: true },
      });

      const resultsAssignment = await tx.result.updateMany({
        where: { isArchived: false, assignment: { isArchived: true } },
        data: { isArchived: true },
      });

      const resultsCount = resultsExam.count + resultsAssignment.count;

      return {
        summary: `Archived ${year.label}: ${fee.count} fee schedules, ${attendance.count} attendance, ${exams.count} exams, ${assignments.count} assignments, ${events.count} events, ${announcements.count} announcements, ${resultsCount} results.`,
        counts: {
          fee: fee.count,
          attendance: attendance.count,
          exams: exams.count,
          assignments: assignments.count,
          events: events.count,
          announcements: announcements.count,
          results: resultsCount,
        },
      };
    });

    revalidatePath(SETTINGS_PATH);
    return {
      success: true,
      error: null,
      summary: (summary as any).summary,
      counts: (summary as any).counts,
    };
  } catch (e: unknown) {
    if (e instanceof Error) {
      if (e.message === "NOT_FOUND") {
        return { success: false, error: "Academic year not found." };
      }
      if (e.message === "ALREADY_ARCHIVED") {
        return { success: false, error: "This academic year is already archived." };
      }
    }
    console.error(e);
    return { success: false, error: "Could not archive academic year." };
  }
}

export async function archiveAcademicYearWithSelection(
  academicYearId: number,
  selection: ArchiveSelection
): Promise<{
  success: boolean;
  error: string | null;
  summary?: string;
  counts?: Record<ArchiveCategory, number>;
}> {
  const authCheck = await requireAdmin();
  if (!authCheck.ok) return { success: false, error: authCheck.error };

  try {
    const summary = await db.$transaction(async (tx) => {
      const year = await tx.academicYear.findUnique({
        where: { id: academicYearId },
        include: { terms: true },
      });

      if (!year) throw new Error("NOT_FOUND");
      if (year.isArchived) throw new Error("ALREADY_ARCHIVED");

      const starts = year.terms.map((t) => t.startDate.getTime());
      const ends = year.terms.map((t) => t.endDate.getTime());
      const rangeStart = new Date(Math.min(...starts));
      const rangeEnd = new Date(Math.max(...ends));

      await tx.academicYear.update({
        where: { id: academicYearId },
        data: {
          isArchived: true,
          isActive: false,
          archivedAt: new Date(),
        },
      });

      const counts: Record<ArchiveCategory, number> = {
        fee: 0,
        attendance: 0,
        exams: 0,
        assignments: 0,
        events: 0,
        announcements: 0,
        results: 0,
      };

      if (selection.fee) {
        const fee = await tx.feeSchedule.updateMany({
          where: { academicYear: year.label, isArchived: false },
          data: { isArchived: true },
        });
        counts.fee = fee.count;
      }

      if (selection.attendance) {
        const attendance = await tx.attendance.updateMany({
          where: {
            isArchived: false,
            date: { gte: rangeStart, lte: rangeEnd },
          },
          data: { isArchived: true },
        });
        counts.attendance = attendance.count;
      }

      if (selection.exams) {
        const exams = await tx.exam.updateMany({
          where: {
            isArchived: false,
            startTime: { gte: rangeStart, lte: rangeEnd },
          },
          data: { isArchived: true },
        });
        counts.exams = exams.count;
      }

      if (selection.assignments) {
        const assignments = await tx.assignment.updateMany({
          where: {
            isArchived: false,
            startDate: { gte: rangeStart, lte: rangeEnd },
          },
          data: { isArchived: true },
        });
        counts.assignments = assignments.count;
      }

      if (selection.events) {
        const events = await tx.event.updateMany({
          where: {
            isArchived: false,
            startTime: { gte: rangeStart, lte: rangeEnd },
          },
          data: { isArchived: true },
        });
        counts.events = events.count;
      }

      if (selection.announcements) {
        const announcements = await tx.announcement.updateMany({
          where: {
            isArchived: false,
            date: { gte: rangeStart, lte: rangeEnd },
          },
          data: { isArchived: true },
        });
        counts.announcements = announcements.count;
      }

      if (selection.results) {
        const results = await tx.result.updateMany({
          where: {
            isArchived: false,
            OR: [
              { exam: { startTime: { gte: rangeStart, lte: rangeEnd } } },
              { assignment: { startDate: { gte: rangeStart, lte: rangeEnd } } },
            ],
          },
          data: { isArchived: true },
        });
        counts.results = results.count;
      }

      return {
        summary: `Archived ${year.label}: ${counts.fee} fee schedules, ${counts.attendance} attendance, ${counts.exams} exams, ${counts.assignments} assignments, ${counts.events} events, ${counts.announcements} announcements, ${counts.results} results.`,
        counts,
      };
    });

    revalidatePath(SETTINGS_PATH);
    return {
      success: true,
      error: null,
      summary: (summary as any).summary,
      counts: (summary as any).counts,
    };
  } catch (e: unknown) {
    if (e instanceof Error) {
      if (e.message === "NOT_FOUND") {
        return { success: false, error: "Academic year not found." };
      }
      if (e.message === "ALREADY_ARCHIVED") {
        return { success: false, error: "This academic year is already archived." };
      }
    }
    console.error(e);
    return { success: false, error: "Could not archive academic year." };
  }
}

export async function unarchiveAcademicYear(
  academicYearId: number
): Promise<{ success: boolean; error: string | null; summary?: string }> {
  const authCheck = await requireAdmin();
  if (!authCheck.ok) return { success: false, error: authCheck.error };

  try {
    const summary = await db.$transaction(async (tx) => {
      const year = await tx.academicYear.findUnique({
        where: { id: academicYearId },
        include: { terms: true },
      });

      if (!year) throw new Error("NOT_FOUND");
      if (!year.isArchived) throw new Error("NOT_ARCHIVED");

      const starts = year.terms.map((t) => t.startDate.getTime());
      const ends = year.terms.map((t) => t.endDate.getTime());
      const rangeStart = new Date(Math.min(...starts));
      const rangeEnd = new Date(Math.max(...ends));

      await tx.academicYear.update({
        where: { id: academicYearId },
        data: {
          isArchived: false,
          archivedAt: null,
        },
      });

      const fee = await tx.feeSchedule.updateMany({
        where: { academicYear: year.label, isArchived: true },
        data: { isArchived: false },
      });

      const attendance = await tx.attendance.updateMany({
        where: {
          isArchived: true,
          date: { gte: rangeStart, lte: rangeEnd },
        },
        data: { isArchived: false },
      });

      const exams = await tx.exam.updateMany({
        where: {
          isArchived: true,
          startTime: { gte: rangeStart, lte: rangeEnd },
        },
        data: { isArchived: false },
      });

      const assignments = await tx.assignment.updateMany({
        where: {
          isArchived: true,
          startDate: { gte: rangeStart, lte: rangeEnd },
        },
        data: { isArchived: false },
      });

      const events = await tx.event.updateMany({
        where: {
          isArchived: true,
          startTime: { gte: rangeStart, lte: rangeEnd },
        },
        data: { isArchived: false },
      });

      const announcements = await tx.announcement.updateMany({
        where: {
          isArchived: true,
          date: { gte: rangeStart, lte: rangeEnd },
        },
        data: { isArchived: false },
      });

      const results = await tx.result.updateMany({
        where: {
          isArchived: true,
          OR: [
            { exam: { startTime: { gte: rangeStart, lte: rangeEnd } } },
            { assignment: { startDate: { gte: rangeStart, lte: rangeEnd } } },
          ],
        },
        data: { isArchived: false },
      });

      return {
        summary: `Unarchived ${year.label}: ${fee.count} fee schedules, ${attendance.count} attendance, ${exams.count} exams, ${assignments.count} assignments, ${events.count} events, ${announcements.count} announcements, ${results.count} results.`,
      };
    });

    revalidatePath(SETTINGS_PATH);
    return { success: true, error: null, summary: (summary as any).summary };
  } catch (e: unknown) {
    if (e instanceof Error) {
      if (e.message === "NOT_FOUND") {
        return { success: false, error: "Academic year not found." };
      }
      if (e.message === "NOT_ARCHIVED") {
        return { success: false, error: "Academic year is not archived." };
      }
    }
    console.error(e);
    return { success: false, error: "Could not unarchive academic year." };
  }
}

export async function resetAppData(): Promise<{ success: boolean; error: string | null }> {
  const authCheck = await requireAdmin();
  if (!authCheck.ok) return { success: false, error: authCheck.error };

  try {
    await db.$executeRawUnsafe(`
      TRUNCATE TABLE
        "PasswordChangeRequest",
        "Message",
        "FeePayment",
        "StudentFeeAssignment",
        "Result",
        "ExamQuestionUpload",
        "Exam",
        "Assignment",
        "Attendance",
        "Announcement",
        "BookOrderItem",
        "BookOrder",
        "Book",
        "TermlyReportSubjectLine",
        "TermlyReport",
        "AcademicTerm",
        "AcademicYear",
        "FeeSchedule",
        "Lesson",
        "Subject",
        "Class",
        "Student",
        "Parent",
        "Teacher",
        "Grade",
        "SchoolSetting",
        "Admin"
      RESTART IDENTITY CASCADE;
    `);

    revalidatePath(SETTINGS_PATH);
    return { success: true, error: null };
  } catch (e: unknown) {
    console.error(e);
    return { success: false, error: "Could not reset application data." };
  }
}

export async function setActiveAcademicYear(
  academicYearId: number
): Promise<{ success: boolean; error: string | null }> {
  const authCheck = await requireAdmin();
  if (!authCheck.ok) return { success: false, error: authCheck.error };

  try {
    const year = await db.academicYear.findUnique({
      where: { id: academicYearId },
    });
    if (!year) return { success: false, error: "Academic year not found." };
    if (year.isArchived) {
      return { success: false, error: "Cannot activate an archived year." };
    }

    await db.$transaction([
      db.academicYear.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      }),
      db.academicYear.update({
        where: { id: academicYearId },
        data: { isActive: true },
      }),
    ]);

    revalidatePath(SETTINGS_PATH);
    return { success: true, error: null };
  } catch (e) {
    console.error(e);
    return { success: false, error: "Could not set active year." };
  }
}

export type SchoolSettingsInput = {
  name: string;
  address: string;
  telephone: string;
  location: string;
  email: string;
  logoUrl?: string | null;
};

export async function updateSchoolSettings(
  input: SchoolSettingsInput
): Promise<{ success: boolean; error: string | null }> {
  const authCheck = await requireAdmin();
  if (!authCheck.ok) return { success: false, error: authCheck.error };

  const name = input.name.trim();
  const address = input.address.trim();
  const telephone = input.telephone.trim();
  const location = input.location.trim();
  const email = input.email.trim();
  const logoUrl = input.logoUrl?.trim() || null;

  if (!name || !address || !telephone || !location || !email) {
    return { success: false, error: "Fill in all required school details." };
  }

  const emailPattern = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
  if (!emailPattern.test(email)) {
    return { success: false, error: "Enter a valid email address." };
  }

  try {
    const existing = await db.schoolSetting.findFirst();
    if (existing) {
      await db.schoolSetting.update({
        where: { id: existing.id },
        data: {
          name,
          address,
          telephone,
          location,
          email,
          logoUrl,
        },
      });
    } else {
      await db.schoolSetting.create({
        data: {
          name,
          address,
          telephone,
          location,
          email,
          logoUrl,
        },
      });
    }

    revalidatePath(SETTINGS_PATH);
    return { success: true, error: null };
  } catch (e) {
    console.error(e);
    return { success: false, error: "Could not save school settings." };
  }
}

export async function archiveTeacherRecords(
  teacherId: string
): Promise<{
  success: boolean;
  error: string | null;
  summary?: string;
  counts?: { attendance: number; exams: number; assignments: number; results: number };
}> {
  const authCheck = await requireAdmin();
  if (!authCheck.ok) return { success: false, error: authCheck.error };

  try {
    const summary = await db.$transaction(async (tx) => {
      // find lessons taught by this teacher
      const lessons = await tx.lesson.findMany({ where: { teacherId }, select: { id: true } });
      const lessonIds = lessons.map((l) => l.id);

      const attendance = await tx.attendance.updateMany({
        where: { teacherId, isArchived: false },
        data: { isArchived: true },
      });

      const exams = await tx.exam.updateMany({
        where: { lessonId: { in: lessonIds }, isArchived: false },
        data: { isArchived: true },
      });

      const assignments = await tx.assignment.updateMany({
        where: { lessonId: { in: lessonIds }, isArchived: false },
        data: { isArchived: true },
      });

      const resultsExam = await tx.result.updateMany({
        where: { isArchived: false, exam: { lessonId: { in: lessonIds } } },
        data: { isArchived: true },
      });

      const resultsAssignment = await tx.result.updateMany({
        where: { isArchived: false, assignment: { lessonId: { in: lessonIds } } },
        data: { isArchived: true },
      });

      const resultsCount = resultsExam.count + resultsAssignment.count;
      return {
        summary: `Archived for teacher ${teacherId}: ${attendance.count} attendance, ${exams.count} exams, ${assignments.count} assignments, ${resultsCount} results.`,
        counts: {
          attendance: attendance.count,
          exams: exams.count,
          assignments: assignments.count,
          results: resultsCount,
        },
      };
    });
    revalidatePath(SETTINGS_PATH);
    return { success: true, error: null, summary: (summary as any).summary, counts: (summary as any).counts };
  } catch (e) {
    console.error(e);
    return { success: false, error: "Could not archive teacher records." };
  }
}

export async function archiveTeacherRecordsWithSelection(
  teacherId: string,
  selection: PersonArchiveSelection
): Promise<{
  success: boolean;
  error: string | null;
  summary?: string;
  counts?: { attendance: number; exams: number; assignments: number; results: number };
}> {
  const authCheck = await requireAdmin();
  if (!authCheck.ok) return { success: false, error: authCheck.error };

  try {
    const summary = await db.$transaction(async (tx) => {
      const lessons = await tx.lesson.findMany({ where: { teacherId }, select: { id: true } });
      const lessonIds = lessons.map((l) => l.id);

      const counts = {
        attendance: 0,
        exams: 0,
        assignments: 0,
        results: 0,
      };

      if (selection.attendance) {
        const attendance = await tx.attendance.updateMany({
          where: { teacherId, isArchived: false },
          data: { isArchived: true },
        });
        counts.attendance = attendance.count;
      }

      if (selection.exams) {
        const exams = await tx.exam.updateMany({
          where: { lessonId: { in: lessonIds }, isArchived: false },
          data: { isArchived: true },
        });
        counts.exams = exams.count;
      }

      if (selection.assignments) {
        const assignments = await tx.assignment.updateMany({
          where: { lessonId: { in: lessonIds }, isArchived: false },
          data: { isArchived: true },
        });
        counts.assignments = assignments.count;
      }

      if (selection.results) {
        const results = await tx.result.updateMany({
          where: {
            isArchived: false,
            OR: [
              { exam: { lessonId: { in: lessonIds } } },
              { assignment: { lessonId: { in: lessonIds } } },
            ],
          },
          data: { isArchived: true },
        });
        counts.results = results.count;
      }

      return {
        summary: `Archived for teacher ${teacherId}: ${counts.attendance} attendance, ${counts.exams} exams, ${counts.assignments} assignments, ${counts.results} results.`,
        counts,
      };
    });
    revalidatePath(SETTINGS_PATH);
    return { success: true, error: null, summary: (summary as any).summary, counts: (summary as any).counts };
  } catch (e) {
    console.error(e);
    return { success: false, error: "Could not archive teacher records." };
  }
}

export async function archiveStudentRecordsWithSelection(
  studentId: string,
  selection: PersonArchiveSelection
): Promise<{
  success: boolean;
  error: string | null;
  summary?: string;
  counts?: { attendance: number; results: number };
}> {
  const authCheck = await requireAdmin();
  if (!authCheck.ok) return { success: false, error: authCheck.error };

  try {
    const summary = await db.$transaction(async (tx) => {
      const counts = { attendance: 0, results: 0 };

      if (selection.attendance) {
        const attendance = await tx.attendance.updateMany({
          where: { studentId, isArchived: false },
          data: { isArchived: true },
        });
        counts.attendance = attendance.count;
      }

      if (selection.results) {
        const results = await tx.result.updateMany({
          where: { studentId, isArchived: false },
          data: { isArchived: true },
        });
        counts.results = results.count;
      }

      const termly = await tx.termlyReport.updateMany({
        where: { studentId },
        data: {},
      });

      return {
        summary: `Archived for student ${studentId}: ${counts.attendance} attendance, ${counts.results} results.`,
        counts,
      };
    });
    revalidatePath(SETTINGS_PATH);
    return { success: true, error: null, summary: (summary as any).summary, counts: (summary as any).counts };
  } catch (e) {
    console.error(e);
    return { success: false, error: "Could not archive student records." };
  }
}

export async function archiveStudentRecords(
  studentId: string
): Promise<{
  success: boolean;
  error: string | null;
  summary?: string;
  counts?: { attendance: number; results: number };
}> {
  const authCheck = await requireAdmin();
  if (!authCheck.ok) return { success: false, error: authCheck.error };

  try {
    const summary = await db.$transaction(async (tx) => {
      const attendance = await tx.attendance.updateMany({
        where: { studentId, isArchived: false },
        data: { isArchived: true },
      });

      const results = await tx.result.updateMany({
        where: { studentId, isArchived: false },
        data: { isArchived: true },
      });

      const termly = await tx.termlyReport.updateMany({
        where: { studentId },
        data: {},
      });

      return {
        summary: `Archived for student ${studentId}: ${attendance.count} attendance, ${results.count} results.`,
        counts: { attendance: attendance.count, results: results.count },
      };
    });
    revalidatePath(SETTINGS_PATH);
    return { success: true, error: null, summary: (summary as any).summary, counts: (summary as any).counts };
  } catch (e) {
    console.error(e);
    return { success: false, error: "Could not archive student records." };
  }
}
