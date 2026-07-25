import prisma from "@/lib/prisma";
import { Prisma, PrismaClient } from "@prisma/client";
import { getCachedResultsData, cacheResultsData } from "@/lib/offlineSync";
import { shouldUseOfflineCache } from "@/lib/offlineStatus";

const db = prisma as unknown as PrismaClient;

export type ResultsPageContext = {
  role: string | undefined;
  userId: string | undefined;
  isAdmin: boolean;
  isSupervisor: boolean;
  canManageReports: boolean;
  canRecordScores: boolean;
  supervisedClassIds: number[];
  supervisedClasses: { id: number; name: string }[];
  classes: {
    id: number;
    name: string;
    gradingLevel: string;
    studentCount: number;
  }[];
  academicYears: {
    id: number;
    label: string;
    terms: { termNumber: number; startDate: string; endDate: string }[];
  }[];
  activeYearId: number | null;
  reports: TermlyReportRow[];
  assignedSubjects: { classId: number; subjectId: number; subjectName: string }[];
  schoolSettings: {
    name: string;
    address: string;
    telephone: string;
    location: string;
    email: string;
    logoUrl: string | null;
  } | null;
};

export type TermlyReportRow = {
  id: number;
  studentId: string;
  studentName: string;
  classId: number;
  className: string;
  academicYearLabel: string;
  academicYearId: number;
  termNumber: number;
  positionOnRoll: number | null;
  totalOnRoll: number;
  totalAttendance: number;
  vacationDate: string | null;
  reopeningDate: string | null;
  overallPercentage: number | null;
  overallGrade: string | null;
  overallRemark: string | null;
  interest: string | null;
  conduct: string | null;
  resultStatus: string | null;
  supervisorRemarks: string | null;
  supervisorSignature: string | null;
  headteacherRemarks: string | null;
  headteacherSignature: string | null;
  subjectLines: {
    id: number;
    subjectId: number;
    subjectName: string;
    classScore: number;
    examScore: number;
    totalMarks: number;
    grade: string | null;
    remark: string | null;
    canEdit: boolean;
  }[];
  schoolSettings?: {
    name: string;
    address: string;
    telephone: string;
    location: string;
    email: string;
    logoUrl: string | null;
  } | null;
};

export async function loadResultsPageData(
  userId: string | undefined,
  role: string | undefined
): Promise<ResultsPageContext> {
  const isAdmin = role === "admin";
  let supervisedClassIds: number[] = [];
  let supervisedClasses: { id: number; name: string }[] = [];
  const assignedSubjects: ResultsPageContext["assignedSubjects"] = [];

  if (role === "teacher" && userId) {
    const supervised = await db.class.findMany({
      where: { supervisorId: userId },
      select: { id: true, name: true },
    });
    supervisedClasses = supervised.map((c) => ({ id: c.id, name: c.name }));
    supervisedClassIds = supervised.map((c) => c.id);

    const lessons = await db.lesson.findMany({
      where: { teacherId: userId },
      include: { subject: { select: { id: true, name: true } } },
    });
    const seen = new Set<string>();
    for (const l of lessons) {
      const key = `${l.classId}:${l.subjectId}`;
      if (seen.has(key)) continue;
      seen.add(key);
      assignedSubjects.push({
        classId: l.classId,
        subjectId: l.subject.id,
        subjectName: l.subject.name,
      });
    }
  }

  const isSupervisor = supervisedClassIds.length > 0;
  const canManageReports = isAdmin || isSupervisor;
  const canRecordScores =
    isAdmin || isSupervisor || (role === "teacher" && assignedSubjects.length > 0);

  let classFilter: { id?: { in: number[] } } | Record<string, never> = {};
  if (role === "teacher" && userId && !isAdmin) {
    const classIds = new Set<number>(supervisedClassIds);
    for (const a of assignedSubjects) classIds.add(a.classId);
    if (classIds.size > 0) {
      classFilter = { id: { in: [...classIds] } };
    } else {
      classFilter = { id: { in: [] } };
    }
  }

  const classes = await db.class.findMany({
    where: classFilter,
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      gradingLevel: true,
      _count: { select: { students: true } },
    },
  });

  const years = await db.academicYear.findMany({
    where: { isArchived: false },
    include: { terms: { orderBy: { termNumber: "asc" } } },
    orderBy: { createdAt: "desc" },
  });

  const active = years.find((y) => y.isActive);
  const academicYears = years.map((y) => ({
    id: y.id,
    label: y.label,
    terms: y.terms.map((t) => ({
      termNumber: t.termNumber,
      startDate: t.startDate.toISOString(),
      endDate: t.endDate.toISOString(),
    })),
  }));

  let reportWhere: Prisma.TermlyReportWhereInput = {};

  if (isAdmin) {
    reportWhere = {};
  } else if (role === "teacher" && userId) {
    const visibleClassIds = new Set(supervisedClassIds);
    for (const a of assignedSubjects) visibleClassIds.add(a.classId);
    if (visibleClassIds.size === 0) {
      reportWhere = { id: { in: [] } };
    } else {
      reportWhere = { classId: { in: [...visibleClassIds] } };
    }
  } else if (role === "student" && userId) {
    reportWhere = { studentId: userId };
  } else if (role === "parent" && userId) {
    reportWhere = { student: { parentId: userId } };
  } else {
    reportWhere = { id: { in: [] } };
  }

  const rawReports = await db.termlyReport.findMany({
    where: reportWhere,
    include: {
      student: { select: { id: true, name: true, surname: true } },
      class: { select: { id: true, name: true } },
      academicYear: { select: { id: true, label: true } },
      subjectLines: {
        include: { subject: { select: { id: true, name: true } } },
        orderBy: { subject: { name: "asc" } },
      },
    },
    orderBy: [
      { academicYear: { label: "desc" } },
      { termNumber: "desc" },
      { class: { name: "asc" } },
      { student: { surname: "asc" } },
    ],
  });

  const schoolSettings = await db.schoolSetting.findFirst();

  const ctxForEdit = {
    isAdmin,
    supervisedClassIds,
    taughtKeys: new Set(
      assignedSubjects.map((a) => `${a.classId}:${a.subjectId}`)
    ),
  };

  const reports: TermlyReportRow[] = rawReports.map((r) => ({
    id: r.id,
    studentId: r.studentId,
    studentName: `${r.student.name} ${r.student.surname}`,
    classId: r.classId,
    className: r.class.name,
    academicYearLabel: r.academicYear.label,
    academicYearId: r.academicYearId,
    termNumber: r.termNumber,
    positionOnRoll: r.positionOnRoll,
    totalOnRoll: r.totalOnRoll,
    totalAttendance: r.totalAttendance,
    vacationDate: r.vacationDate?.toISOString() ?? null,
    reopeningDate: r.reopeningDate?.toISOString() ?? null,
    overallPercentage: r.overallPercentage,
    overallGrade: r.overallGrade,
    overallRemark: r.overallRemark,
    interest: r.interest,
    conduct: r.conduct,
    resultStatus: r.resultStatus,
    supervisorRemarks: r.supervisorRemarks,
    supervisorSignature: r.supervisorSignature,
    headteacherRemarks: r.headteacherRemarks,
    headteacherSignature: r.headteacherSignature,
    subjectLines: r.subjectLines.map((line) => {
      const canEdit =
        ctxForEdit.isAdmin ||
        ctxForEdit.supervisedClassIds.includes(r.classId) ||
        ctxForEdit.taughtKeys.has(`${r.classId}:${line.subjectId}`);
      return {
        id: line.id,
        subjectId: line.subjectId,
        subjectName: line.subject.name,
        classScore: line.classScore,
        examScore: line.examScore,
        totalMarks: line.totalMarks,
        grade: line.grade,
        remark: line.remark,
        canEdit,
      };
    }),
    schoolSettings: schoolSettings
      ? {
          name: schoolSettings.name,
          address: schoolSettings.address,
          telephone: schoolSettings.telephone,
          location: schoolSettings.location,
          email: schoolSettings.email,
          logoUrl: schoolSettings.logoUrl,
        }
      : null,
  }));

  const ctx: ResultsPageContext = {
    role,
    userId,
    isAdmin,
    isSupervisor,
    canManageReports,
    canRecordScores,
    supervisedClassIds,
    supervisedClasses,
    classes: classes.map((cls) => ({
      id: cls.id,
      name: cls.name,
      gradingLevel: cls.gradingLevel,
      studentCount: cls._count.students,
    })),
    academicYears,
    activeYearId: active?.id ?? years[0]?.id ?? null,
    reports,
    schoolSettings: schoolSettings
      ? {
          name: schoolSettings.name,
          address: schoolSettings.address,
          telephone: schoolSettings.telephone,
          location: schoolSettings.location,
          email: schoolSettings.email,
          logoUrl: schoolSettings.logoUrl,
        }
      : null,
    assignedSubjects,
  };

  // Cache the data for offline access (fire and forget)
  try {
    void cacheResultsData(ctx);
  } catch (error) {
    console.error("Failed to cache results data:", error);
  }

  return ctx;
}
