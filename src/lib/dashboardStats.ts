import { PrismaClient } from "@prisma/client";
import prisma from "@/lib/prisma";

const db = prisma as unknown as PrismaClient;

export type MonthlyPaymentPoint = {
  month: string;
  collected: number;
};

export type ClassAttendancePoint = {
  className: string;
  present: number;
  total: number;
  rate: number;
};

export type ClassPerformancePoint = {
  className: string;
  averageScore: number;
};

export type UpcomingEventItem = {
  title: string;
  timeLabel: string;
  location: string;
};

export type RecentActivityItem = {
  title: string;
  detail: string;
  timeLabel: string;
};

export type AdminDashboardSummary = {
  totalStudents: number;
  totalTeachers: number;
  totalParents: number;
  totalClasses: number;
  activeFeeSchedules: number;
  feeAssignments: number;
  totalFeesCollected: number;
  totalFeesOutstanding: number;
  outstandingAssignments: number;
  monthlyPayments: MonthlyPaymentPoint[];
  attendanceTodayRate: number;
  attendanceTodayPresent: number;
  attendanceTodayTotal: number;
  teacherAttendance?: { present: number; total: number; rate: number };
  classAttendanceRates: ClassAttendancePoint[];
  performanceByClass: ClassPerformancePoint[];
  performanceByTerm?: { termKey: string; label: string; performanceByClass: ClassPerformancePoint[] }[];
  upcomingEvents: UpcomingEventItem[];
  recentActivities: RecentActivityItem[];
  currentFridayEvent?: {
    title: string;
    className: string | null;
    startTime: string;
    endTime: string;
    description: string;
  };
};

function getMonthLabel(year: number, month: number) {
  const date = new Date(year, month - 1, 1);
  return date.toLocaleString("en-US", { month: "short", year: "numeric" });
}

function toPercent(present: number, total: number) {
  if (!total) return 0;
  return Math.round((present / total) * 100);
}

function formatTimeLabel(date: Date) {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export async function loadAdminDashboardSummary(): Promise<AdminDashboardSummary> {
  const [totalStudents, totalTeachers, totalParents, totalClasses, activeFeeSchedules, feeAssignments] =
    await Promise.all([
      db.student.count({ where: { isArchived: false } }),
      db.teacher.count({ where: { isArchived: false } }),
      db.parent.count({ where: { isArchived: false } }),
      db.class.count(),
      db.feeSchedule.count({ where: { isArchived: false } }),
      db.studentFeeAssignment.count(),
    ]);

  const [payments, classes, results, attendanceRecords, latestStudent, latestBook, latestResult, latestPayment] =
    await Promise.all([
      db.feePayment.findMany({
        select: { amountCedis: true, paidAt: true },
        orderBy: { paidAt: "asc" },
      }),
      db.class.findMany({
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
      db.result.findMany({
        where: { isArchived: false },
        select: {
          score: true,
          student: {
            select: {
              classId: true,
            },
          },
        },
      }),
      db.attendance.findMany({
        where: {
          date: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lte: new Date(new Date().setHours(23, 59, 59, 999)),
          },
          studentId: { not: null },
          isArchived: false,
        },
        select: {
          present: true,
          student: {
            select: {
              classId: true,
              class: {
                select: { name: true },
              },
            },
          },
        },
      }),
      db.student.findFirst({
        where: { isArchived: false },
        orderBy: { createdAt: "desc" },
        select: {
          name: true,
          surname: true,
          createdAt: true,
          class: { select: { name: true } },
        },
      }),
      db.book.findFirst({
        orderBy: { createdAt: "desc" },
        select: {
          title: true,
          createdAt: true,
          class: { select: { name: true } },
        },
      }),
      db.result.findFirst({
        where: { isArchived: false },
        orderBy: { id: "desc" },
        select: {
          id: true,
          student: {
            select: {
              name: true,
              surname: true,
              class: { select: { name: true } },
            },
          },
          assignment: { select: { title: true } },
          exam: { select: { title: true } },
        },
      }),
      db.feePayment.findFirst({
        orderBy: { paidAt: "desc" },
        select: {
          paidAt: true,
          assignment: {
            select: {
              student: {
                select: {
                  name: true,
                  surname: true,
                },
              },
            },
          },
        },
      }),
      db.event.findFirst({
        where: {
          isArchived: false,
          startTime: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
        include: {
          class: true,
        },
        orderBy: {
          startTime: "asc",
        },
      }),
    ]);

  const totalFeesCollected = payments.reduce(
    (sum, payment) => sum + Number(payment.amountCedis),
    0
  );

  const monthlyMap = new Map<string, MonthlyPaymentPoint>();
  for (const payment of payments) {
    const paidAt = new Date(payment.paidAt);
    const year = paidAt.getFullYear();
    const month = paidAt.getMonth() + 1;
    const key = `${year}-${String(month).padStart(2, "0")}`;

    const existing = monthlyMap.get(key);
    const collected = Number(payment.amountCedis);
    if (existing) {
      existing.collected += collected;
    } else {
      monthlyMap.set(key, {
        month: getMonthLabel(year, month),
        collected,
      });
    }
  }

  const monthlyPayments = Array.from(monthlyMap.values());

  const assignments = await db.studentFeeAssignment.findMany({
    select: {
      totalBillCedis: true,
      payments: { select: { amountCedis: true } },
    },
  });

  let totalFeesOutstanding = 0;
  let outstandingAssignments = 0;

  for (const assignment of assignments) {
    const paidAmount = assignment.payments.reduce(
      (sum, payment) => sum + Number(payment.amountCedis),
      0
    );
    const balance = Number(assignment.totalBillCedis) - paidAmount;
    if (balance > 0.005) {
      totalFeesOutstanding += balance;
      outstandingAssignments += 1;
    }
  }

  const presentCount = attendanceRecords.filter((row) => row.present).length;
  const attendanceTodayTotal = attendanceRecords.length;
  const attendanceTodayRate = toPercent(presentCount, attendanceTodayTotal);

  // compute teacher attendance for today
  const teacherAttendanceRecords = await db.attendance.findMany({
    where: {
      date: {
        gte: new Date(new Date().setHours(0, 0, 0, 0)),
        lte: new Date(new Date().setHours(23, 59, 59, 999)),
      },
      teacherId: { not: null },
      isArchived: false,
    },
    select: { present: true },
  });
  const teacherPresent = teacherAttendanceRecords.filter((r) => r.present).length;
  const teacherTotal = teacherAttendanceRecords.length;
  const teacherRate = toPercent(teacherPresent, teacherTotal);

  const classAttendanceMap = new Map<number, { present: number; total: number }>();
  for (const row of attendanceRecords) {
    const classId = row.student?.classId;
    if (!classId) continue;
    const existing = classAttendanceMap.get(classId) ?? { present: 0, total: 0 };
    existing.total += 1;
    if (row.present) existing.present += 1;
    classAttendanceMap.set(classId, existing);
  }

  const classAttendanceRates = classes.map((schoolClass) => {
    const values = classAttendanceMap.get(schoolClass.id) ?? { present: 0, total: 0 };
    return {
      className: schoolClass.name,
      present: values.present,
      total: values.total,
      rate: toPercent(values.present, values.total),
    };
  });

  const performanceMap = new Map<number, { totalScore: number; totalEntries: number }>();
  for (const result of results) {
    const classId = result.student?.classId;
    if (!classId) continue;
    const current = performanceMap.get(classId) ?? { totalScore: 0, totalEntries: 0 };
    current.totalScore += result.score;
    current.totalEntries += 1;
    performanceMap.set(classId, current);
  }

  const performanceByClass = classes
    .map((schoolClass) => {
      const values = performanceMap.get(schoolClass.id);
      return {
        className: schoolClass.name,
        averageScore: values ? Math.round(values.totalScore / values.totalEntries) : 0,
      };
    })
    .filter((item) => item.averageScore > 0)
    .sort((left, right) => right.averageScore - left.averageScore);

  const upcomingEvents = await db.event.findMany({
    where: {
      isArchived: false,
      startTime: {
        gte: new Date(),
      },
    },
    select: {
      title: true,
      startTime: true,
      class: { select: { name: true } },
    },
    orderBy: { startTime: "asc" },
    take: 3,
  });

  const recentActivities: RecentActivityItem[] = [];
  if (latestStudent) {
    recentActivities.push({
      title: "New student registered",
      detail: `${latestStudent.name} ${latestStudent.surname}` + (latestStudent.class?.name ? ` · ${latestStudent.class.name}` : ""),
      timeLabel: latestStudent.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    });
  }
  if (latestBook) {
    recentActivities.push({
      title: "New books added",
      detail: `${latestBook.title}` + (latestBook.class?.name ? ` · ${latestBook.class.name}` : ""),
      timeLabel: latestBook.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    });
  }
  if (latestResult) {
    const subjectLabel = latestResult.assignment?.title ?? latestResult.exam?.title ?? "Assessment";
    recentActivities.push({
      title: "Results submitted",
      detail: `${latestResult.student?.name ?? "Student"} ${latestResult.student?.surname ?? ""}`.trim() + (latestResult.student?.class?.name ? ` · ${latestResult.student.class.name}` : "") + ` · ${subjectLabel}`,
      timeLabel: "Recently submitted",
    });
  }
  if (latestPayment) {
    const studentName = [latestPayment.assignment?.student?.name, latestPayment.assignment?.student?.surname].filter(Boolean).join(" ");
    recentActivities.push({
      title: "Fee payment received",
      detail: `${studentName || "A parent"} · ${latestPayment.paidAt.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
      timeLabel: latestPayment.paidAt.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    });
  }

  const currentDay = new Date();
  const currentDayIndex = currentDay.getDay();
  const monday = new Date(currentDay);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(currentDay.getDate() - ((currentDayIndex + 6) % 7));

  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);
  friday.setHours(0, 0, 0, 0);

  const fridayEnd = new Date(friday);
  fridayEnd.setHours(23, 59, 59, 999);

  const fridayEvent = await db.event.findFirst({
    where: {
      isArchived: false,
      startTime: {
        gte: friday,
        lte: fridayEnd,
      },
    },
    include: {
      class: true,
    },
    orderBy: {
      startTime: "asc",
    },
  });

  return {
    totalStudents,
    totalTeachers,
    totalParents,
    totalClasses,
    activeFeeSchedules,
    feeAssignments,
    totalFeesCollected,
    totalFeesOutstanding,
    outstandingAssignments,
    monthlyPayments,
    attendanceTodayRate,
    attendanceTodayPresent: presentCount,
    attendanceTodayTotal,
    teacherAttendance: { present: teacherPresent, total: teacherTotal, rate: teacherRate },
    classAttendanceRates,
    performanceByClass,
    // build performance by term using TermlyReport.overallPercentage
    performanceByTerm: await (async () => {
      const reports = await db.termlyReport.findMany({
        where: { overallPercentage: { not: null } },
        select: {
          academicYearId: true,
          termNumber: true,
          classId: true,
          overallPercentage: true,
          academicYear: { select: { label: true } },
          class: { select: { name: true } },
        },
      });

      const termMap = new Map<
        string,
        { label: string; termNumber: number; academicYearLabel: string; classMap: Map<number, { total: number; sum: number }> }
      >();

      for (const r of reports) {
        const key = `${r.academicYearId}-${r.termNumber}`;
        const label = `${r.academicYear?.label ?? "Year"} · Term ${r.termNumber}`;
        const entry = termMap.get(key) ?? { label, termNumber: r.termNumber, academicYearLabel: r.academicYear?.label ?? "", classMap: new Map() };
        const classStats = entry.classMap.get(r.classId) ?? { total: 0, sum: 0 };
        classStats.total += 1;
        classStats.sum += Number(r.overallPercentage ?? 0);
        entry.classMap.set(r.classId, classStats);
        termMap.set(key, entry);
      }

      const out = Array.from(termMap.entries()).map(([key, entry]) => {
        const perf = classes
          .map((cl) => {
            const vals = entry.classMap.get(cl.id);
            return { className: cl.name, averageScore: vals ? Math.round(vals.sum / vals.total) : 0 };
          })
          .filter((p) => p.averageScore > 0)
          .sort((a, b) => b.averageScore - a.averageScore);

        return { termKey: key, label: entry.label, performanceByClass: perf };
      });

      return out;
    })(),
    upcomingEvents: upcomingEvents.map((event) => ({
      title: event.title,
      timeLabel: `${formatTimeLabel(event.startTime)}${event.class?.name ? ` · ${event.class.name}` : ""}`,
      location: event.class?.name ?? "School",
    })),
    recentActivities,
    currentFridayEvent: fridayEvent
      ? {
          title: fridayEvent.title,
          className: fridayEvent.class?.name ?? null,
          startTime: fridayEvent.startTime.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }),
          endTime: fridayEvent.endTime.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }),
          description: fridayEvent.description,
        }
      : undefined,
  };
}
