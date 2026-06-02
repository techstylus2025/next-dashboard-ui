import prisma from "@/lib/prisma";
import { PrismaClient } from "@prisma/client";
import type { AcademicYearRow } from "@/components/settings/SettingsManagement";

const db = prisma as unknown as PrismaClient;

export async function loadSettingsPageData(): Promise<{
  academicYears: AcademicYearRow[];
  teachers: { id: string; name: string; surname: string }[];
  students: { id: string; name: string; surname: string }[];
  schoolSettings: {
    name: string;
    address: string;
    telephone: string;
    location: string;
    email: string;
    logoUrl: string | null;
  } | null;
}> {
  const [years, teachers, students, schoolSettings, archivedCounts] = await Promise.all([
    db.academicYear.findMany({
      include: { terms: { orderBy: { termNumber: "asc" } } },
      orderBy: { createdAt: "desc" },
    }),
    db.teacher.findMany({ select: { id: true, name: true, surname: true }, orderBy: { name: "asc" } }),
    db.student.findMany({ select: { id: true, name: true, surname: true }, orderBy: { name: "asc" } }),
    db.schoolSetting.findFirst(),
    db.$transaction([
      db.feeSchedule.count({ where: { isArchived: true } }),
      db.attendance.count({ where: { isArchived: true } }),
      db.exam.count({ where: { isArchived: true } }),
      db.assignment.count({ where: { isArchived: true } }),
      db.event.count({ where: { isArchived: true } }),
      db.announcement.count({ where: { isArchived: true } }),
      db.result.count({ where: { isArchived: true } }),
    ]),
  ]);

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
        startDate: t.startDate.toISOString(),
        endDate: t.endDate.toISOString(),
      })),
    })),
    teachers,
    students,
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
