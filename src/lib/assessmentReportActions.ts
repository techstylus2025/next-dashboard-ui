"use server";

import { getCurrentAuthContext } from "@/lib/auth";
import { lookupGradeFromScale } from "@/lib/gradingUtils";
import prisma from "@/lib/prisma";
import { PrismaClient, type AssessmentType } from "@prisma/client";
import { revalidatePath } from "next/cache";

const db = prisma as unknown as PrismaClient;
const RESULTS_PATH = "/list/results";

async function getAssessmentAuth() {
  const session = await getCurrentAuthContext();
  if (!session.userId || !session.role) return null;

  const isAdmin = session.role === "admin";
  const teacher =
    session.role === "teacher"
      ? await db.teacher.findUnique({
          where: { id: session.userId },
          select: {
            subjects: { select: { id: true } },
            assignedClasses: { select: { id: true } },
          },
        })
      : null;
  const supervisedClasses =
    session.role === "teacher"
      ? await db.class.findMany({
          where: { supervisorId: session.userId },
          select: { id: true },
        })
      : [];

  return {
    userId: session.userId,
    role: session.role,
    isAdmin,
    subjectIds: new Set(teacher?.subjects.map((subject) => subject.id) ?? []),
    classIds: new Set([
      ...(teacher?.assignedClasses.map((cls) => cls.id) ?? []),
      ...supervisedClasses.map((cls) => cls.id),
    ]),
  };
}

async function getClassSubjects(classId: number) {
  const cls = await db.class.findUnique({
    where: { id: classId },
    select: {
      gradeId: true,
      grade: { select: { subjects: { select: { id: true, gradeId: true } } } },
      subjects: { select: { id: true, gradeId: true } },
      lessons: { select: { subject: { select: { id: true, gradeId: true } } } },
    },
  });
  if (!cls) return null;
  return [...new Set(
    [...cls.grade.subjects, ...cls.subjects, ...cls.lessons.map((lesson) => lesson.subject)]
      .filter((subject) => subject.gradeId === cls.gradeId)
      .map((subject) => subject.id)
  )];
}

async function validateYearAndTerm(academicYearId: number, termNumber: number) {
  if (
    !Number.isInteger(academicYearId) ||
    academicYearId <= 0 ||
    !Number.isInteger(termNumber) ||
    termNumber <= 0
  ) {
    return false;
  }
  const year = await db.academicYear.findUnique({
    where: { id: academicYearId },
    select: { isArchived: true, terms: { select: { termNumber: true } } },
  });
  return Boolean(
    year &&
      !year.isArchived &&
      year.terms.some((term) => term.termNumber === termNumber)
  );
}

async function createReportsForClass(input: {
  classId: number;
  academicYearId: number;
  termNumber: number;
  type: AssessmentType;
  assessmentNumber: number;
}) {
  const subjects = await getClassSubjects(input.classId);
  if (!subjects) return { created: 0, error: "Class not found." };
  const students = await db.student.findMany({
    where: { classId: input.classId, isArchived: false },
    select: { id: true },
  });
  if (students.length === 0) return { created: 0, error: "No students in this class." };

  const result = await db.assessmentReport.createMany({
    data: students.map((student) => ({
      studentId: student.id,
      classId: input.classId,
      academicYearId: input.academicYearId,
      termNumber: input.termNumber,
      type: input.type,
      assessmentNumber: input.assessmentNumber,
    })),
    skipDuplicates: true,
  });

  const reports = await db.assessmentReport.findMany({
    where: {
      classId: input.classId,
      academicYearId: input.academicYearId,
      termNumber: input.termNumber,
      type: input.type,
      assessmentNumber: input.assessmentNumber,
    },
    select: { id: true },
  });
  if (subjects.length && reports.length) {
    await db.assessmentReportSubjectLine.createMany({
      data: reports.flatMap((report) =>
        subjects.map((subjectId) => ({
          assessmentReportId: report.id,
          subjectId,
        }))
      ),
      skipDuplicates: true,
    });
  }
  return { created: result.count };
}

export async function createMidTermReports(input: {
  classIds: number[];
  academicYearId: number;
  termNumber: number;
}): Promise<{ success: boolean; error: string | null; created?: number }> {
  const auth = await getAssessmentAuth();
  if (!auth) return { success: false, error: "Not signed in." };
  if (!auth.isAdmin) return { success: false, error: "Only administrators can create mid-term reports." };
  if (!Array.isArray(input.classIds) || input.classIds.length === 0) {
    return { success: false, error: "Select at least one class." };
  }
  const classIds = [...new Set(input.classIds)];
  if (classIds.some((classId) => !Number.isInteger(classId) || classId <= 0)) {
    return { success: false, error: "Select valid classes." };
  }
  if (!(await validateYearAndTerm(input.academicYearId, input.termNumber))) {
    return { success: false, error: "Select a valid academic year and term." };
  }

  try {
    const classes = await db.class.findMany({
      where: { id: { in: classIds } },
      select: {
        id: true,
        students: {
          where: { isArchived: false },
          select: { id: true },
          take: 1,
        },
      },
    });
    if (classes.length !== classIds.length) {
      return { success: false, error: "One or more selected classes could not be found." };
    }
    if (classes.some((cls) => cls.students.length === 0)) {
      return { success: false, error: "Every selected class must have at least one active student." };
    }

    let created = 0;
    for (const classId of classIds) {
      const result = await createReportsForClass({
        classId,
        academicYearId: input.academicYearId,
        termNumber: input.termNumber,
        type: "MID_TERM",
        assessmentNumber: 0,
      });
      if (result.error) return { success: false, error: result.error };
      created += result.created;
    }
    revalidatePath(RESULTS_PATH);
    return { success: true, error: null, created };
  } catch (error) {
    console.error("Failed to create mid-term reports:", error);
    return { success: false, error: "Could not create mid-term reports." };
  }
}

export async function createMockReports(input: {
  classId: number;
  academicYearId: number;
  termNumber: number;
}): Promise<{ success: boolean; error: string | null; created?: number; mockNumber?: number }> {
  const auth = await getAssessmentAuth();
  if (!auth) return { success: false, error: "Not signed in." };
  if (!auth.isAdmin) return { success: false, error: "Only administrators can create mock reports." };
  if (!(await validateYearAndTerm(input.academicYearId, input.termNumber))) {
    return { success: false, error: "Select a valid academic year and term." };
  }

  try {
    const previous = await db.assessmentReport.aggregate({
      where: {
        classId: input.classId,
        academicYearId: input.academicYearId,
        termNumber: input.termNumber,
        type: "MOCK",
      },
      _max: { assessmentNumber: true },
    });
    const mockNumber = (previous._max.assessmentNumber ?? 0) + 1;
    const result = await createReportsForClass({
      ...input,
      type: "MOCK",
      assessmentNumber: mockNumber,
    });
    if (result.error) return { success: false, error: result.error };
    revalidatePath(RESULTS_PATH);
    return { success: true, error: null, created: result.created, mockNumber };
  } catch (error) {
    console.error("Failed to create mock reports:", error);
    return { success: false, error: "Could not create mock reports." };
  }
}

export async function upsertAssessmentSubjectScore(input: {
  reportId: number;
  subjectId: number;
  score: number;
}): Promise<{ success: boolean; error: string | null }> {
  const auth = await getAssessmentAuth();
  if (!auth) return { success: false, error: "Not signed in." };
  if (!Number.isInteger(input.score) || input.score < 0 || input.score > 100) {
    return { success: false, error: "Enter a whole-number score between 0 and 100." };
  }

  try {
    const report = await db.assessmentReport.findUnique({
      where: { id: input.reportId },
      select: {
        id: true,
        classId: true,
        isPublished: true,
        class: { select: { gradingLevel: true, supervisorId: true } },
      },
    });
    if (!report) return { success: false, error: "Assessment report not found." };
    if (report.isPublished) {
      return { success: false, error: "Published assessment reports cannot be edited." };
    }
    const subjects = await getClassSubjects(report.classId);
    if (!subjects?.includes(input.subjectId)) {
      return { success: false, error: "Subject is not assigned to this class." };
    }
    if (
      !auth.isAdmin &&
      (auth.role !== "teacher" ||
        !auth.classIds.has(report.classId) ||
        !auth.subjectIds.has(input.subjectId))
    ) {
      return { success: false, error: "You are not assigned to teach this subject in this class." };
    }

    await db.assessmentReportSubjectLine.upsert({
      where: {
        assessmentReportId_subjectId: {
          assessmentReportId: report.id,
          subjectId: input.subjectId,
        },
      },
      create: {
        assessmentReportId: report.id,
        subjectId: input.subjectId,
        score: input.score,
        lastEditedById: auth.userId,
      },
      update: { score: input.score, lastEditedById: auth.userId },
    });

    const [lines, scale] = await Promise.all([
      db.assessmentReportSubjectLine.findMany({
        where: { assessmentReportId: report.id },
        select: { score: true, lastEditedById: true },
      }),
      db.gradingScaleEntry.findMany({
        where: { level: report.class.gradingLevel },
        orderBy: { minScore: "asc" },
      }),
    ]);
    const completed = lines.filter((line) => line.lastEditedById !== null);
    const totalScore = lines.reduce((sum, line) => sum + line.score, 0);
    const overallPercentage =
      completed.length > 0
        ? Math.round(
            (completed.reduce((sum, line) => sum + line.score, 0) /
              completed.length) *
              100
          ) / 100
        : null;
    const grade = overallPercentage === null
      ? null
      : lookupGradeFromScale(
          report.class.gradingLevel,
          overallPercentage,
          scale
        );

    await db.assessmentReport.update({
      where: { id: report.id },
      data: {
        totalScore,
        overallPercentage,
        overallGrade: grade?.grade === "—" ? null : grade?.grade ?? null,
        overallRemark: grade?.remark || null,
      },
    });
    revalidatePath(RESULTS_PATH);
    return { success: true, error: null };
  } catch (error) {
    console.error("Failed to save assessment score:", error);
    return { success: false, error: "Could not save assessment score." };
  }
}

export async function publishAssessmentReports(input: {
  reportId?: number;
  classId?: number;
  academicYearId?: number;
  termNumber?: number;
  type: AssessmentType;
  assessmentNumber?: number;
}): Promise<{ success: boolean; error: string | null; updated?: number }> {
  const auth = await getAssessmentAuth();
  if (!auth) return { success: false, error: "Not signed in." };
  if (!auth.isAdmin) return { success: false, error: "Only administrators can publish assessment reports." };

  const where = input.reportId
    ? { id: input.reportId, type: input.type }
    : {
        classId: input.classId,
        academicYearId: input.academicYearId,
        termNumber: input.termNumber,
        type: input.type,
        assessmentNumber: input.assessmentNumber,
      };
  if (
    !input.reportId &&
    (!input.classId || !input.academicYearId || !input.termNumber)
  ) {
    return { success: false, error: "Select a class, academic year, and term." };
  }

  try {
    const result = await db.assessmentReport.updateMany({
      where,
      data: { isPublished: true, publishedAt: new Date(), isWithheld: false },
    });
    if (!result.count) return { success: false, error: "No assessment reports were found." };
    revalidatePath(RESULTS_PATH);
    return { success: true, error: null, updated: result.count };
  } catch (error) {
    console.error("Failed to publish assessment reports:", error);
    return { success: false, error: "Could not publish assessment reports." };
  }
}
