import prisma from "@/lib/prisma";
import { PrismaClient } from "@prisma/client";
import type { AcademicYearRow } from "@/components/settings/SettingsManagement";
import { isRecoverablePrismaError } from "@/lib/prismaError";
import {
  EMPTY_TERMLY_REPORT_OPTION_LISTS,
  type TermlyReportOptionLists,
} from "@/lib/termlyReportOptionTypes";

const db = prisma as unknown as PrismaClient;

type AcademicYearWithTerms = {
  id: number;
  label: string;
  numberOfTerms: number;
  isActive: boolean;
  isArchived: boolean;
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  terms: Array<{
    termNumber: number;
    days: number;
    weeks: number;
    holidays?: number;
    startDate: Date;
    endDate: Date;
  }>;
};

export async function loadSettingsPageData(): Promise<{
  academicYears: AcademicYearRow[];
  teachers: { id: string; name: string; surname: string }[];
  students: { id: string; name: string; surname: string }[];
  parents: { id: string; name: string; surname: string }[];
  schoolSettings: {
    name: string;
    address: string;
    telephone: string;
    location: string;
    email: string;
    logoUrl: string | null;
  } | null;
  reportOptions: TermlyReportOptionLists;
  archivedCounts: {
    feeSchedules: number;
    attendance: number;
    exams: number;
    assignments: number;
    events: number;
    announcements: number;
    results: number;
  };
}> {
  let years: AcademicYearWithTerms[] = [];
  let teachers: { id: string; name: string; surname: string }[] = [];
  let students: { id: string; name: string; surname: string }[] = [];
  let parents: { id: string; name: string; surname: string }[] = [];
  let schoolSettings = null;
  let reportOptionSet = null;
  let archivedCounts: number[] = [0, 0, 0, 0, 0, 0, 0];

  try {
    [years, teachers, students, parents, schoolSettings, reportOptionSet, archivedCounts] = await Promise.all([
      db.academicYear.findMany({
        include: { terms: { orderBy: { termNumber: "asc" } } },
        orderBy: { createdAt: "desc" },
      }),
      db.teacher.findMany({ select: { id: true, name: true, surname: true }, orderBy: { name: "asc" } }),
      db.student.findMany({ select: { id: true, name: true, surname: true }, orderBy: { name: "asc" } }),
      db.parent.findMany({ select: { id: true, name: true, surname: true }, orderBy: { name: "asc" } }),
      db.schoolSetting.findFirst(),
      db.termlyReportOptionSet.findUnique({ where: { id: 1 } }),
      Promise.all([
        db.feeSchedule.count({ where: { isArchived: true } }),
        db.attendance.count({ where: { isArchived: true } }),
        db.exam.count({ where: { isArchived: true } }),
        db.assignment.count({ where: { isArchived: true } }),
        db.event.count({ where: { isArchived: true } }),
        db.announcement.count({ where: { isArchived: true } }),
        db.result.count({ where: { isArchived: true } }),
      ]),
    ]);
  } catch (error) {
    if (!isRecoverablePrismaError(error)) {
      throw error;
    }
  }

  return {
    academicYears: years.map((y) => ({
      id: y.id,
      label: y.label,
      numberOfTerms: y.numberOfTerms,
      isActive: y.isActive,
      isArchived: y.isArchived,
      archivedAt: y.archivedAt?.toISOString() ?? null,
      terms: y.terms.map((t) => ({
        termNumber: t.termNumber,
        days: t.days,
        weeks: t.weeks,
        holidays: t.holidays ?? 0,
        startDate: t.startDate.toISOString(),
        endDate: t.endDate.toISOString(),
      })),
    })),
    teachers,
    students,
    parents,
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
    reportOptions: reportOptionSet
      ? {
          interest: reportOptionSet.interestOptions,
          conduct: reportOptionSet.conductOptions,
          supervisorRemarks: reportOptionSet.supervisorRemarkOptions,
          headteacherRemarks: reportOptionSet.headteacherRemarkOptions,
          customEntryAccess: {
            interest: reportOptionSet.allowCustomInterest,
            conduct: reportOptionSet.allowCustomConduct,
            supervisorRemarks: reportOptionSet.allowCustomSupervisorRemarks,
          },
        }
      : EMPTY_TERMLY_REPORT_OPTION_LISTS,
    archivedCounts: {
      feeSchedules: archivedCounts[0],
      attendance: archivedCounts[1],
      exams: archivedCounts[2],
      assignments: archivedCounts[3],
      events: archivedCounts[4],
      announcements: archivedCounts[5],
      results: archivedCounts[6],
    },
  };
}
