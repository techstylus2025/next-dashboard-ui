"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { PrismaClient } from "@prisma/client";
import {
  computeSubjectPercentage,
  lookupGradeFromScale,
} from "@/lib/gradingUtils";
import { getTermVacationAndReopening } from "@/lib/termDates";

const RESULTS_PATH = "/list/results";
const db = prisma as unknown as PrismaClient;

type AuthCtx = {
  userId: string;
  role: string;
  isAdmin: boolean;
  isSupervisor: boolean;
  supervisedClassIds: number[];
  taughtSubjectKeys: Set<string>;
};

async function getAuthCtx(): Promise<AuthCtx | null> {
  const session = await auth();
  const userId = session?.userId;
  const role = (session?.sessionClaims?.metadata as { role?: string })?.role;
  if (!userId || !role) return null;

  const isAdmin = role === "admin";
  let supervisedClassIds: number[] = [];
  const taughtSubjectKeys = new Set<string>();

  if (role === "teacher") {
    const supervised = await db.class.findMany({
      where: { supervisorId: userId },
      select: { id: true },
    });
    supervisedClassIds = supervised.map((c) => c.id);

    const lessons = await db.lesson.findMany({
      where: { teacherId: userId },
      select: { classId: true, subjectId: true },
    });
    for (const l of lessons) {
      taughtSubjectKeys.add(`${l.classId}:${l.subjectId}`);
    }
  }

  return {
    userId,
    role,
    isAdmin,
    isSupervisor: supervisedClassIds.length > 0,
    supervisedClassIds,
    taughtSubjectKeys,
  };
}

function canManageReports(ctx: AuthCtx): boolean {
  return ctx.isAdmin || ctx.isSupervisor;
}

function canViewAllInClass(ctx: AuthCtx, classId: number): boolean {
  return ctx.isAdmin || ctx.supervisedClassIds.includes(classId);
}

function canEditSubjectLine(
  ctx: AuthCtx,
  classId: number,
  subjectId: number
): boolean {
  if (ctx.isAdmin) return true;
  if (ctx.supervisedClassIds.includes(classId)) return true;
  return ctx.taughtSubjectKeys.has(`${classId}:${subjectId}`);
}

async function loadScaleForClass(classId: number) {
  const cls = await db.class.findUnique({
    where: { id: classId },
    select: { gradingLevel: true },
  });
  if (!cls) return { level: "PRIMARY" as const, entries: [] };
  const entries = await db.gradingScaleEntry.findMany({
    where: { level: cls.gradingLevel },
    orderBy: { minScore: "asc" },
  });
  return { level: cls.gradingLevel, entries };
}

async function countAttendanceForTerm(
  studentId: string,
  termStart: Date,
  termEnd: Date
): Promise<number> {
  return db.attendance.count({
    where: {
      studentId,
      present: true,
      isArchived: false,
      date: { gte: termStart, lte: termEnd },
    },
  });
}

async function recomputeReportTotals(reportId: number) {
  const report = await db.termlyReport.findUnique({
    where: { id: reportId },
    include: {
      subjectLines: true,
      class: { select: { gradingLevel: true } },
    },
  });
  if (!report) return;

  const entries = await db.gradingScaleEntry.findMany({
    where: { level: report.class.gradingLevel },
  });

  let sumPct = 0;
  let count = 0;
  for (const line of report.subjectLines) {
    if (line.totalMarks > 0 || line.classScore > 0 || line.examScore > 0) {
      const pct = computeSubjectPercentage(line.classScore, line.examScore);
      sumPct += pct;
      count += 1;
    }
  }

  const overallPercentage =
    count > 0 ? Math.round((sumPct / count) * 100) / 100 : null;
  const lookup =
    overallPercentage != null
      ? lookupGradeFromScale(report.class.gradingLevel, overallPercentage, entries)
      : { grade: null as string | null, remark: null as string | null };

  await db.termlyReport.update({
    where: { id: reportId },
    data: {
      overallPercentage,
      overallGrade: lookup.grade === "—" ? null : lookup.grade,
      overallRemark: lookup.remark || null,
    },
  });
}

async function resolveAcademicYear(academicYearId?: number) {
  if (academicYearId) {
    return db.academicYear.findUnique({
      where: { id: academicYearId },
      include: { terms: true },
    });
  }
  return db.academicYear.findFirst({
    where: { isActive: true, isArchived: false },
    include: { terms: true },
  });
}

async function generateReportsForClass(
  ctx: AuthCtx,
  classId: number,
  academicYearId: number,
  termNumber: number
): Promise<{ created: number; error?: string }> {
  const year = await db.academicYear.findUnique({
    where: { id: academicYearId },
    include: { terms: true },
  });
  if (!year || year.isArchived) {
    return { created: 0, error: "Academic year not found or archived." };
  }

  const term = year.terms.find((t) => t.termNumber === termNumber);
  if (!term) {
    return { created: 0, error: "Term not found for this academic year." };
  }

  let vacationDate: Date;
  let reopeningDate: Date | null;
  try {
    const dates = getTermVacationAndReopening(year.terms, termNumber);
    vacationDate = dates.vacationDate;
    reopeningDate = dates.reopeningDate;
  } catch {
    vacationDate = term.endDate;
    reopeningDate = null;
  }

  const students = await db.student.findMany({
    where: { classId, isArchived: false },
    orderBy: [{ surname: "asc" }, { name: "asc" }],
    select: { id: true },
  });
  if (students.length === 0) {
    return { created: 0, error: "No students in this class." };
  }

  const subjects = await db.lesson.findMany({
    where: { classId },
    distinct: ["subjectId"],
    select: { subjectId: true },
  });
  const subjectIds = [...new Set(subjects.map((s) => s.subjectId))];
  const totalOnRoll = students.length;
  let created = 0;

  for (let i = 0; i < students.length; i++) {
    const student = students[i];
    const existing = await db.termlyReport.findUnique({
      where: {
        studentId_academicYearId_termNumber: {
          studentId: student.id,
          academicYearId,
          termNumber,
        },
      },
    });

    const attendance = await countAttendanceForTerm(
      student.id,
      term.startDate,
      term.endDate
    );

    if (existing) {
      await db.termlyReport.update({
        where: { id: existing.id },
        data: {
          vacationDate,
          reopeningDate,
          totalOnRoll,
          totalAttendance: attendance,
        },
      });
      continue;
    }

    await db.termlyReport.create({
      data: {
        studentId: student.id,
        classId,
        academicYearId,
        termNumber,
        positionOnRoll: i + 1,
        totalOnRoll,
        totalAttendance: attendance,
        vacationDate,
        reopeningDate,
        createdById: ctx.userId,
        subjectLines: {
          create: subjectIds.map((subjectId) => ({
            subjectId,
            classScore: 0,
            examScore: 0,
            totalMarks: 0,
          })),
        },
      },
    });
    created += 1;
  }

  return { created };
}

export async function createOrInitTermlyReports(input: {
  classId: number;
  academicYearId?: number;
  termNumber: number;
}): Promise<{ success: boolean; error: string | null; created?: number }> {
  const ctx = await getAuthCtx();
  if (!ctx) return { success: false, error: "Not signed in." };
  if (!canManageReports(ctx)) {
    return {
      success: false,
      error: "Only administrators or class supervisors can generate reports.",
    };
  }
  if (!ctx.isAdmin && !ctx.supervisedClassIds.includes(input.classId)) {
    return { success: false, error: "You can only generate reports for your class." };
  }

  const year = await resolveAcademicYear(input.academicYearId);
  if (!year) {
    return { success: false, error: "No active academic year. Set one in Settings." };
  }

  try {
    const result = await generateReportsForClass(
      ctx,
      input.classId,
      year.id,
      input.termNumber
    );
    if (result.error && result.created === 0) {
      return { success: false, error: result.error };
    }
    revalidatePath(RESULTS_PATH);
    return { success: true, error: null, created: result.created };
  } catch (e) {
    console.error(e);
    return { success: false, error: "Could not generate termly reports." };
  }
}

/** Admin: all classes, or one class. Uses active academic year when omitted. */
export async function generateTermlyReportsBulk(input: {
  scope: "all" | "class";
  classId?: number;
  academicYearId?: number;
  termNumber: number;
}): Promise<{
  success: boolean;
  error: string | null;
  created?: number;
  classesProcessed?: number;
}> {
  const ctx = await getAuthCtx();
  if (!ctx) return { success: false, error: "Not signed in." };
  if (!ctx.isAdmin) {
    return { success: false, error: "Only administrators can use bulk generation." };
  }

  const year = await resolveAcademicYear(input.academicYearId);
  if (!year) {
    return { success: false, error: "No active academic year. Set one in Settings." };
  }

  let classIds: number[] = [];
  if (input.scope === "all") {
    const classes = await db.class.findMany({
      where: { students: { some: {} } },
      select: { id: true },
    });
    classIds = classes.map((c) => c.id);
  } else {
    if (!input.classId) {
      return { success: false, error: "Select a class." };
    }
    classIds = [input.classId];
  }

  if (classIds.length === 0) {
    return { success: false, error: "No classes with students found." };
  }

  try {
    let totalCreated = 0;
    let classesProcessed = 0;
    const errors: string[] = [];

    for (const classId of classIds) {
      const result = await generateReportsForClass(
        ctx,
        classId,
        year.id,
        input.termNumber
      );
      if (result.error && result.created === 0) {
        errors.push(result.error);
        continue;
      }
      totalCreated += result.created;
      classesProcessed += 1;
    }

    revalidatePath(RESULTS_PATH);
    if (classesProcessed === 0) {
      return {
        success: false,
        error: errors[0] || "No reports were generated.",
      };
    }
    return {
      success: true,
      error: null,
      created: totalCreated,
      classesProcessed,
    };
  } catch (e) {
    console.error(e);
    return { success: false, error: "Bulk generation failed." };
  }
}

/** Class supervisor: generate for all students in a supervised class. */
export async function generateTermlyReportsForSupervisorClass(input: {
  classId: number;
  academicYearId?: number;
  termNumber: number;
}): Promise<{ success: boolean; error: string | null; created?: number }> {
  const ctx = await getAuthCtx();
  if (!ctx) return { success: false, error: "Not signed in." };
  if (!ctx.isSupervisor) {
    return { success: false, error: "You are not a class supervisor." };
  }
  if (!ctx.supervisedClassIds.includes(input.classId)) {
    return { success: false, error: "You can only generate reports for your class." };
  }

  return createOrInitTermlyReports({
    classId: input.classId,
    academicYearId: input.academicYearId,
    termNumber: input.termNumber,
  });
}

export async function generateTermlyReportForSingleStudent(input: {
  studentId: string;
  classId: number;
  academicYearId?: number;
  termNumber: number;
}): Promise<{
  success: boolean;
  error: string | null;
  created?: boolean;
  alreadyExists?: boolean;
}> {
  const ctx = await getAuthCtx();
  if (!ctx) return { success: false, error: "Not signed in." };
  if (!ctx.isAdmin && !ctx.supervisedClassIds.includes(input.classId)) {
    return { success: false, error: "You do not have permission to generate reports for this class." };
  }

  const year = await resolveAcademicYear(input.academicYearId);
  if (!year) {
    return { success: false, error: "No active academic year. Set one in Settings." };
  }

  try {
    const term = year.terms.find((t) => t.termNumber === input.termNumber);
    if (!term) {
      return { success: false, error: "Term not found for this academic year." };
    }

    const student = await db.student.findUnique({
      where: { id: input.studentId },
      select: { id: true, classId: true },
    });
    if (!student || student.classId !== input.classId) {
      return { success: false, error: "Student not found in this class." };
    }

    const existing = await db.termlyReport.findUnique({
      where: {
        studentId_academicYearId_termNumber: {
          studentId: input.studentId,
          academicYearId: year.id,
          termNumber: input.termNumber,
        },
      },
    });

    if (existing) {
      return { success: true, error: null, alreadyExists: true };
    }

    let vacationDate: Date;
    let reopeningDate: Date | null;
    try {
      const dates = getTermVacationAndReopening(year.terms, input.termNumber);
      vacationDate = dates.vacationDate;
      reopeningDate = dates.reopeningDate;
    } catch {
      vacationDate = term.endDate;
      reopeningDate = null;
    }

    const attendance = await countAttendanceForTerm(
      input.studentId,
      term.startDate,
      term.endDate
    );

    const subjects = await db.lesson.findMany({
      where: { classId: input.classId },
      distinct: ["subjectId"],
      select: { subjectId: true },
    });
    const subjectIds = [...new Set(subjects.map((s) => s.subjectId))];

    // Get position on roll for this student
    const students = await db.student.findMany({
      where: { classId: input.classId },
      orderBy: [{ surname: "asc" }, { name: "asc" }],
      select: { id: true },
    });
    const positionOnRoll = students.findIndex((s) => s.id === input.studentId) + 1;
    const totalOnRoll = students.length;

    await db.termlyReport.create({
      data: {
        studentId: input.studentId,
        classId: input.classId,
        academicYearId: year.id,
        termNumber: input.termNumber,
        positionOnRoll,
        totalOnRoll,
        totalAttendance: attendance,
        vacationDate,
        reopeningDate,
        createdById: ctx.userId,
        subjectLines: {
          create: subjectIds.map((subjectId) => ({
            subjectId,
            classScore: 0,
            examScore: 0,
            totalMarks: 0,
          })),
        },
      },
    });

    revalidatePath(RESULTS_PATH);
    return { success: true, error: null, created: true };
  } catch (e) {
    console.error(e);
    return { success: false, error: "Failed to generate report for student." };
  }
}

export async function updateTermlyReportMeta(input: {
  reportId: number;
  positionOnRoll?: number | null;
  totalOnRoll?: number;
  totalAttendance?: number;
  vacationDate?: string | null;
  reopeningDate?: string | null;
  interest?: string | null;
  conduct?: string | null;
  resultStatus?: string | null;
  supervisorRemarks?: string | null;
  supervisorSignature?: string | null;
  headteacherRemarks?: string | null;
  headteacherSignature?: string | null;
}): Promise<{ success: boolean; error: string | null }> {
  const ctx = await getAuthCtx();
  if (!ctx) return { success: false, error: "Not signed in." };

  const report = await db.termlyReport.findUnique({
    where: { id: input.reportId },
    select: { classId: true },
  });
  if (!report) return { success: false, error: "Report not found." };
  if (!canViewAllInClass(ctx, report.classId)) {
    return {
      success: false,
      error: "Only administrators or class supervisors can update report details.",
    };
  }

  try {
    await db.termlyReport.update({
      where: { id: input.reportId },
      data: {
        positionOnRoll: input.positionOnRoll,
        totalOnRoll: input.totalOnRoll,
        totalAttendance: input.totalAttendance,
        vacationDate: input.vacationDate
          ? new Date(input.vacationDate + "T00:00:00")
          : input.vacationDate === null
            ? null
            : undefined,
        reopeningDate: input.reopeningDate
          ? new Date(input.reopeningDate + "T00:00:00")
          : input.reopeningDate === null
            ? null
            : undefined,
        interest: input.interest ?? undefined,
        conduct: input.conduct ?? undefined,
        resultStatus: input.resultStatus ?? undefined,
        supervisorRemarks: input.supervisorRemarks ?? undefined,
        supervisorSignature: input.supervisorSignature ?? undefined,
        headteacherRemarks: input.headteacherRemarks ?? undefined,
        headteacherSignature: input.headteacherSignature ?? undefined,
      },
    });
    revalidatePath(RESULTS_PATH);
    return { success: true, error: null };
  } catch (e) {
    console.error(e);
    return { success: false, error: "Could not update report." };
  }
}

export async function upsertTermlySubjectLine(input: {
  reportId: number;
  subjectId: number;
  classScore: number;
  examScore: number;
}): Promise<{ success: boolean; error: string | null }> {
  const ctx = await getAuthCtx();
  if (!ctx) return { success: false, error: "Not signed in." };

  const report = await db.termlyReport.findUnique({
    where: { id: input.reportId },
    select: { id: true, classId: true },
  });
  if (!report) return { success: false, error: "Report not found." };

  if (!canEditSubjectLine(ctx, report.classId, input.subjectId)) {
    return {
      success: false,
      error: "You are not assigned to teach this subject in this class.",
    };
  }

  const classScore = Math.max(0, Math.round(input.classScore));
  const examScore = Math.max(0, Math.round(input.examScore));
  const totalMarks = classScore + examScore;
  const pct = computeSubjectPercentage(classScore, examScore);
  const { level, entries } = await loadScaleForClass(report.classId);
  const { grade, remark } = lookupGradeFromScale(level, pct, entries);

  try {
    await db.termlyReportSubjectLine.upsert({
      where: {
        termlyReportId_subjectId: {
          termlyReportId: input.reportId,
          subjectId: input.subjectId,
        },
      },
      create: {
        termlyReportId: input.reportId,
        subjectId: input.subjectId,
        classScore,
        examScore,
        totalMarks,
        grade: grade === "—" ? null : grade,
        remark: remark || null,
        lastEditedById: ctx.userId,
      },
      update: {
        classScore,
        examScore,
        totalMarks,
        grade: grade === "—" ? null : grade,
        remark: remark || null,
        lastEditedById: ctx.userId,
      },
    });

    await recomputeReportTotals(input.reportId);
    revalidatePath(RESULTS_PATH);
    return { success: true, error: null };
  } catch (e) {
    console.error(e);
    return { success: false, error: "Could not save subject scores." };
  }
}

export async function deleteTermlyReport(
  reportId: number
): Promise<{ success: boolean; error: string | null }> {
  const ctx = await getAuthCtx();
  if (!ctx) return { success: false, error: "Not signed in." };
  if (!ctx.isAdmin) {
    return { success: false, error: "Only administrators can delete reports." };
  }

  try {
    await db.termlyReport.delete({ where: { id: reportId } });
    revalidatePath(RESULTS_PATH);
    return { success: true, error: null };
  } catch (e) {
    console.error(e);
    return { success: false, error: "Could not delete report." };
  }
}

/**
 * Fetch all students in a given class.
 * Used by admin to see all students (not just those with reports) when filling individual reports.
 */
export async function getAllStudentsInClass(
  classId: number
): Promise<Array<{ id: string; name: string; surname: string }>> {
  const ctx = await getAuthCtx();
  if (!ctx || !ctx.isAdmin) {
    return [];
  }

  try {
    const students = await db.student.findMany({
      where: { classId },
      select: { id: true, name: true, surname: true },
      orderBy: [{ surname: "asc" }, { name: "asc" }],
    });

    return students;
  } catch (e) {
    console.error("Failed to fetch students for class:", e);
    return [];
  }
}
