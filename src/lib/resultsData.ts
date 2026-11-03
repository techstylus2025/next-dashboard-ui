import prisma from "@/lib/prisma";
import { Prisma, PrismaClient } from "@prisma/client";
import { getCachedResultsData, cacheResultsData } from "@/lib/offlineSync";
import { shouldUseOfflineCache } from "@/lib/offlineStatus";
import {
  computeJhsOverallGrade,
  computeSubjectPercentage,
  lookupGradeFromScale,
} from "@/lib/gradingUtils";

const db = prisma as unknown as PrismaClient;

export type ResultsPageContext = {
  role: string | undefined;
  userId: string | undefined;
  isAdmin: boolean;
  isSupervisor: boolean;
  canManageReports: boolean;
  canRecordScores: boolean;
  supervisedClassIds: number[];
  supervisedClasses: { id: number; name: string; signature: string | null }[];
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
    headteacherSignature: string | null;
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
  gradingLevel: string;
  gradingScaleEntries: {
    minScore: number;
    maxScore: number;
    grade: string;
    remark: string;
  }[];
  positionOnRoll: number | null;
  totalOnRoll: number;
  totalAttendance: number;
  vacationDate: string | null;
  reopeningDate: string | null;
  overallPercentage: number | null;
  overallGrade: string | null;
  overallRemark: string | null;
  isPublished: boolean;
  publishedAt: string | null;
  isWithheld: boolean;
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
    isCore: boolean;
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
    headteacherSignature: string | null;
  } | null;
};

export async function loadResultsPageData(
  userId: string | undefined,
  role: string | undefined
): Promise<ResultsPageContext> {
  const isAdmin = role === "admin";
  let supervisedClassIds: number[] = [];
  let supervisedClasses: ResultsPageContext["supervisedClasses"] = [];
  let assignedClassIds: number[] = [];
  const assignedSubjects: ResultsPageContext["assignedSubjects"] = [];

  if (role === "teacher" && userId) {
    const [supervised, teacher] = await Promise.all([
      db.class.findMany({
        where: { supervisorId: userId },
        select: { id: true, name: true, supervisorSignature: true },
      }),
      db.teacher.findUnique({
        where: { id: userId },
        select: {
          assignedClasses: { select: { id: true, name: true } },
          subjects: { select: { id: true, name: true } },
        },
      }),
    ]);
    supervisedClasses = supervised.map((c) => ({
      id: c.id,
      name: c.name,
      signature: c.supervisorSignature,
    }));
    supervisedClassIds = supervised.map((c) => c.id);
    assignedClassIds = teacher?.assignedClasses.map((cls) => cls.id) ?? [];

    const accessibleClassIds = [
      ...new Set([...supervisedClassIds, ...assignedClassIds]),
    ];
    if (accessibleClassIds.length && teacher?.subjects.length) {
      const classesWithSubjects = await db.class.findMany({
        where: { id: { in: accessibleClassIds } },
        select: {
          id: true,
          subjects: { select: { id: true } },
        },
      });
      const teacherSubjects = new Map(
        teacher.subjects.map((subject) => [subject.id, subject.name])
      );
      for (const cls of classesWithSubjects) {
        for (const subject of cls.subjects) {
          const subjectName = teacherSubjects.get(subject.id);
          if (subjectName) {
            assignedSubjects.push({
              classId: cls.id,
              subjectId: subject.id,
              subjectName,
            });
          }
        }
      }
    }
  }

  const isSupervisor = supervisedClassIds.length > 0;
  const canManageReports = isAdmin || isSupervisor;
  const canRecordScores =
    isAdmin || isSupervisor || (role === "teacher" && assignedSubjects.length > 0);

  let classFilter: { id?: { in: number[] } } | Record<string, never> = {};
  if (role === "teacher" && !isAdmin) {
    const classIds = new Set<number>(supervisedClassIds);
    for (const id of assignedClassIds) classIds.add(id);
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
    include: {
      terms: {
        orderBy: { termNumber: "asc" },
        select: {
          id: true,
          termNumber: true,
          startDate: true,
          endDate: true,
        },
      },
    },
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
    const visibleClassIds = new Set([...supervisedClassIds, ...assignedClassIds]);
    for (const a of assignedSubjects) visibleClassIds.add(a.classId);
    if (visibleClassIds.size === 0) {
      reportWhere = { id: { in: [] } };
    } else {
      reportWhere = { classId: { in: [...visibleClassIds] } };
    }
  } else if (role === "student" && userId) {
    reportWhere = {
      studentId: userId,
      isPublished: true,
      isWithheld: false,
    };
  } else if (role === "parent" && userId) {
    reportWhere = {
      student: { parentId: userId },
      isPublished: true,
      isWithheld: false,
    };
  } else {
    reportWhere = { id: { in: [] } };
  }

  const rawReports = await db.termlyReport.findMany({
    where: reportWhere,
    include: {
      student: { select: { id: true, name: true, surname: true } },
      class: {
        select: {
          id: true,
          name: true,
          gradeId: true,
          gradingLevel: true,
          supervisorSignature: true,
          grade: {
            select: {
              subjects: {
                select: { id: true, name: true, gradeId: true, isCore: true },
              },
            },
          },
          subjects: {
            select: { id: true, name: true, gradeId: true, isCore: true },
          },
          lessons: {
            select: {
              subject: {
                select: { id: true, name: true, gradeId: true, isCore: true },
              },
            },
          },
        },
      },
      academicYear: { select: { id: true, label: true } },
      subjectLines: {
        include: {
          subject: {
            select: { id: true, name: true, gradeId: true, isCore: true },
          },
        },
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

  let assessmentWhere: Prisma.AssessmentReportWhereInput = {};
  if (role === "teacher") {
    assessmentWhere = {
      classId: { in: [...new Set([...supervisedClassIds, ...assignedClassIds])] },
    };
  } else if (role === "student" && userId) {
    assessmentWhere = {
      studentId: userId,
      isPublished: true,
      isWithheld: false,
    };
  } else if (role === "parent" && userId) {
    assessmentWhere = {
      student: { parentId: userId },
      isPublished: true,
      isWithheld: false,
    };
  } else if (!isAdmin) {
    assessmentWhere = { id: { in: [] } };
  }

  const rawAssessments = await db.assessmentReport.findMany({
    where: assessmentWhere,
    include: {
      student: { select: { id: true, name: true, surname: true } },
      class: {
        select: {
          id: true,
          name: true,
          gradeId: true,
          gradingLevel: true,
          grade: { select: { subjects: { select: { id: true, name: true, gradeId: true } } } },
          subjects: { select: { id: true, name: true, gradeId: true } },
          lessons: {
            select: {
              subject: { select: { id: true, name: true, gradeId: true } },
            },
          },
        },
      },
      academicYear: { select: { id: true, label: true } },
      subjectLines: {
        include: { subject: { select: { id: true, name: true, gradeId: true } } },
        orderBy: { subject: { name: "asc" } },
      },
    },
    orderBy: [
      { academicYear: { label: "desc" } },
      { termNumber: "desc" },
      { type: "asc" },
      { assessmentNumber: "desc" },
      { class: { name: "asc" } },
      { student: { surname: "asc" } },
    ],
  });

  const assessmentScales = await db.gradingScaleEntry.findMany({
    where: {
      level: {
        in: [...new Set(rawAssessments.map((report) => report.class.gradingLevel))],
      },
    },
    orderBy: [{ level: "asc" }, { minScore: "asc" }],
    select: { level: true, minScore: true, maxScore: true, grade: true, remark: true },
  });

  const ctxForEdit = {
    isAdmin,
    supervisedClassIds,
    taughtKeys: new Set(
      assignedSubjects.map((a) => `${a.classId}:${a.subjectId}`)
    ),
  };

  const assessments: AssessmentReportRow[] = rawAssessments.map((report) => {
    const subjects = [
      ...report.class.grade.subjects,
      ...report.class.subjects,
      ...report.class.lessons.map((lesson) => lesson.subject),
    ].filter((subject) => subject.gradeId === report.class.gradeId);
    const subjectLinesById = new Map(
      report.subjectLines
        .filter((line) => line.subject.gradeId === report.class.gradeId)
        .map((line) => [line.subjectId, line])
    );
    const scale = assessmentScales.filter(
      (entry) => entry.level === report.class.gradingLevel
    );
    const allSubjectLines = [...new Map(
      subjects.map((subject) => [
        subject.id,
        subjectLinesById.get(subject.id) ?? {
          subjectId: subject.id,
          score: 0,
          grade: null,
          remark: null,
          lastEditedById: null,
          subject: { id: subject.id, name: subject.name, gradeId: subject.gradeId },
        },
      ])
    ).values()];

    return {
      id: report.id,
      type: report.type,
      assessmentNumber: report.assessmentNumber,
      studentId: report.studentId,
      studentName: `${report.student.name} ${report.student.surname}`,
      classId: report.classId,
      className: report.class.name,
      academicYearId: report.academicYearId,
      academicYearLabel: report.academicYear.label,
      termNumber: report.termNumber,
      totalScore: report.totalScore,
      overallPercentage: report.overallPercentage,
      overallGrade: report.overallGrade,
      overallRemark: report.overallRemark,
      isPublished: report.isPublished,
      isWithheld: report.isWithheld,
      gradingLevel: report.class.gradingLevel,
      gradingScaleEntries: scale.map(({ minScore, maxScore, grade, remark }) => ({
        minScore,
        maxScore,
        grade,
        remark,
      })),
      subjectLines: allSubjectLines
        .filter((line) => role !== "teacher" || ctxForEdit.taughtKeys.has(`${report.classId}:${line.subjectId}`))
        .map((line) => {
          const hasScore = line.lastEditedById !== null;
          const gradeLookup = lookupGradeFromScale(
            report.class.gradingLevel,
            line.score,
            scale
          );
          return {
            subjectId: line.subjectId,
            subjectName: line.subject.name,
            score: line.score,
            grade: line.grade ?? (hasScore && gradeLookup.grade !== "—" ? gradeLookup.grade : null),
            remark: line.remark ?? (hasScore ? gradeLookup.remark : null),
            canEdit:
              !report.isPublished &&
              (isAdmin ||
                (role === "teacher" &&
                  ctxForEdit.taughtKeys.has(`${report.classId}:${line.subjectId}`))),
          };
        }),
    };
  });

  const gradingScaleEntries = await db.gradingScaleEntry.findMany({
    where: {
      level: {
        in: [...new Set(rawReports.map((report) => report.class.gradingLevel))],
      },
    },
    orderBy: [{ level: "asc" }, { minScore: "asc" }],
    select: {
      level: true,
      minScore: true,
      maxScore: true,
      grade: true,
      remark: true,
    },
  });

  const schoolSettings = await db.schoolSetting.findFirst();

  const reports: TermlyReportRow[] = rawReports.map((r) => {
    const scaleForClass = gradingScaleEntries.filter(
      (entry) => entry.level === r.class.gradingLevel
    );
    const subjectLinesById = new Map(
      r.subjectLines
        .filter((line) => line.subject.gradeId === r.class.gradeId)
        .map((line) => [
          line.subjectId,
          (() => {
            const hasScore =
              line.lastEditedById !== null ||
              line.totalMarks > 0 ||
              line.classScore > 0 ||
              line.examScore > 0;
            const useTotalMarks =
              line.classScore + line.examScore === 0 && line.totalMarks > 0;
            const calculated = hasScore
              ? lookupGradeFromScale(
                  r.class.gradingLevel,
                  computeSubjectPercentage(
                    useTotalMarks ? line.totalMarks : line.classScore,
                    useTotalMarks ? 0 : line.examScore
                  ),
                  scaleForClass
                )
              : null;
            return {
              id: line.id,
              subjectId: line.subjectId,
              subjectName: line.subject.name,
              isCore: line.subject.isCore,
              classScore: line.classScore,
              examScore: line.examScore,
              totalMarks: line.totalMarks,
              grade: line.grade?.trim() || calculated?.grade || null,
              remark: line.remark?.trim() || calculated?.remark || null,
            };
          })(),
        ])
    );
    const classSubjects = [
      ...r.class.grade.subjects,
      ...r.class.subjects,
      ...r.class.lessons.map((lesson) => lesson.subject),
    ];
    for (const subject of classSubjects) {
      if (
        subject.gradeId === r.class.gradeId &&
        !subjectLinesById.has(subject.id)
      ) {
        subjectLinesById.set(subject.id, {
          id: -(r.id * 100000 + subject.id),
          subjectId: subject.id,
          subjectName: subject.name,
          isCore: subject.isCore,
          classScore: 0,
          examScore: 0,
          totalMarks: 0,
          grade: null,
          remark: null,
        });
      }
    }

    return {
      id: r.id,
      studentId: r.studentId,
      studentName: `${r.student.name} ${r.student.surname}`,
      classId: r.classId,
      className: r.class.name,
      academicYearLabel: r.academicYear.label,
      academicYearId: r.academicYearId,
      termNumber: r.termNumber,
      gradingLevel: r.class.gradingLevel,
      gradingScaleEntries: scaleForClass
        .map(({ minScore, maxScore, grade, remark }) => ({
          minScore,
          maxScore,
          grade,
          remark,
        })),
      positionOnRoll: r.positionOnRoll,
      totalOnRoll: r.totalOnRoll,
      totalAttendance: r.totalAttendance,
      vacationDate: r.vacationDate?.toISOString() ?? null,
      reopeningDate: r.reopeningDate?.toISOString() ?? null,
      overallPercentage:
        role === "teacher"
          ? null
          : r.overallPercentage,
      overallGrade:
        role === "teacher"
          ? null
          : r.class.gradingLevel === "JHS"
            ? computeJhsOverallGrade([...subjectLinesById.values()])
            : r.overallGrade,
      overallRemark:
        role === "teacher"
          ? null
          : r.overallRemark,
      isPublished: r.isPublished,
      publishedAt: r.publishedAt?.toISOString() ?? null,
      isWithheld: r.isWithheld,
      interest: r.interest,
      conduct: r.conduct,
      resultStatus: r.resultStatus,
      supervisorRemarks: r.supervisorRemarks,
      supervisorSignature: r.supervisorSignature ?? r.class.supervisorSignature,
      headteacherRemarks: r.headteacherRemarks,
      headteacherSignature:
        r.headteacherSignature ?? schoolSettings?.headteacherSignature ?? null,
      subjectLines: [...subjectLinesById.values()]
        .filter(
          (line) =>
            role !== "teacher" ||
            ctxForEdit.taughtKeys.has(`${r.classId}:${line.subjectId}`)
        )
        .map((line) => ({
          id: line.id,
          subjectId: line.subjectId,
          subjectName: line.subjectName,
          isCore: line.isCore,
          classScore: line.classScore,
          examScore: line.examScore,
          totalMarks: line.totalMarks,
          grade: line.grade,
          remark: line.remark,
          canEdit:
            ctxForEdit.isAdmin ||
            ctxForEdit.taughtKeys.has(`${r.classId}:${line.subjectId}`),
        })),
      schoolSettings: schoolSettings
        ? {
            name: schoolSettings.name,
            address: schoolSettings.address,
            telephone: schoolSettings.telephone,
            location: schoolSettings.location,
            email: schoolSettings.email,
            logoUrl: schoolSettings.logoUrl,
            headteacherSignature: schoolSettings.headteacherSignature,
          }
        : null,
    };
  });

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
          headteacherSignature: schoolSettings.headteacherSignature,
        }
      : null,
    assignedSubjects,
  };

  // Cache the data for offline access (fire and forget) in the browser only.
  if (typeof window !== "undefined") {
    try {
      void cacheResultsData(ctx);
    } catch (error) {
      console.error("Failed to cache results data:", error);
    }
  }

  return ctx;
}
