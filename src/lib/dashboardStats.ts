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
  startTimeIso?: string;
  dateLabel?: string;
  description?: string;
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
  feePaymentByClass?: { className: string; paid: number; unpaid: number }[];
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

function formatRecentActivityTime(date: Date) {
  const diffMinutes = Math.max(0, Math.round((Date.now() - date.getTime()) / 60000));

  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.round(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
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

  const [
    payments,
    classes,
    results,
    attendanceRecords,
    latestStudent,
    latestTeacher,
    latestBook,
    latestBookOrder,
    latestResult,
    latestPayment,
    latestLesson,
    latestAssignment,
  ] = await Promise.all([
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
    db.teacher.findFirst({
      where: { isArchived: false },
      orderBy: { createdAt: "desc" },
      select: {
        name: true,
        surname: true,
        createdAt: true,
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
    db.bookOrder.findFirst({
      orderBy: { createdAt: "desc" },
      select: {
        createdAt: true,
        parent: { select: { name: true, surname: true } },
        items: { select: { book: { select: { title: true } } } },
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
        assignment: { select: { title: true, dueDate: true } },
        exam: { select: { title: true, startTime: true } },
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
    db.lesson.findFirst({
      orderBy: { startTime: "desc" },
      select: {
        name: true,
        startTime: true,
        subject: { select: { name: true } },
        class: { select: { name: true } },
        teacher: { select: { name: true, surname: true } },
      },
    }),
    db.assignment.findFirst({
      where: { isArchived: false },
      orderBy: { dueDate: "desc" },
      select: {
        title: true,
        dueDate: true,
        lesson: { select: { name: true, class: { select: { name: true } } } },
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
      description: true,
      class: { select: { name: true } },
    },
    orderBy: { startTime: "asc" },
    take: 3,
  });

  const recentActivityCandidates: Array<{ date: Date; title: string; detail: string }> = [];

  if (latestStudent) {
    recentActivityCandidates.push({
      date: latestStudent.createdAt,
      title: "New student registered",
      detail: `${latestStudent.name} ${latestStudent.surname}${latestStudent.class?.name ? ` · ${latestStudent.class.name}` : ""}`,
    });
  }

  if (latestTeacher) {
    recentActivityCandidates.push({
      date: latestTeacher.createdAt,
      title: "New teacher added",
      detail: `${latestTeacher.name} ${latestTeacher.surname}`,
    });
  }

  if (latestBook) {
    recentActivityCandidates.push({
      date: latestBook.createdAt,
      title: "Book inventory updated",
      detail: `${latestBook.title}${latestBook.class?.name ? ` · ${latestBook.class.name}` : ""}`,
    });
  }

  if (latestBookOrder) {
    const parentName = [latestBookOrder.parent?.name, latestBookOrder.parent?.surname].filter(Boolean).join(" ");
    const bookNames = latestBookOrder.items.map((item) => item.book?.title).filter(Boolean).slice(0, 2).join(", ");
    recentActivityCandidates.push({
      date: latestBookOrder.createdAt,
      title: "Book purchase recorded",
      detail: `${parentName || "Parent"}${bookNames ? ` · ${bookNames}` : ""}`,
    });
  }

  if (latestResult) {
    const personName = [latestResult.student?.name, latestResult.student?.surname].filter(Boolean).join(" ");
    const subjectLabel = latestResult.assignment?.title ?? latestResult.exam?.title ?? "Assessment";
    const resultDate = latestResult.assignment?.dueDate ?? latestResult.exam?.startTime ?? new Date();
    recentActivityCandidates.push({
      date: resultDate,
      title: "Results submitted",
      detail: `${personName || "Student"}${latestResult.student?.class?.name ? ` · ${latestResult.student.class.name}` : ""} · ${subjectLabel}`,
    });
  }

  if (latestPayment) {
    const studentName = [latestPayment.assignment?.student?.name, latestPayment.assignment?.student?.surname].filter(Boolean).join(" ");
    recentActivityCandidates.push({
      date: latestPayment.paidAt,
      title: "Fee payment received",
      detail: `${studentName || "Student"}`,
    });
  }

  if (latestLesson) {
    recentActivityCandidates.push({
      date: latestLesson.startTime,
      title: "Lesson scheduled",
      detail: `${latestLesson.name}${latestLesson.subject?.name ? ` · ${latestLesson.subject.name}` : ""}${latestLesson.class?.name ? ` · ${latestLesson.class.name}` : ""}`,
    });
  }

  if (latestAssignment) {
    recentActivityCandidates.push({
      date: latestAssignment.dueDate,
      title: "Assignment created",
      detail: `${latestAssignment.title}${latestAssignment.lesson?.class?.name ? ` · ${latestAssignment.lesson.class.name}` : ""}`,
    });
  }

  const recentActivities: RecentActivityItem[] = recentActivityCandidates
    .sort((left, right) => right.date.getTime() - left.date.getTime())
    .slice(0, 5)
    .map((activity) => ({
      title: activity.title,
      detail: activity.detail,
      timeLabel: formatRecentActivityTime(activity.date),
    }));

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
      startTimeIso: event.startTime.toISOString(),
      dateLabel: event.startTime.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      timeLabel: `${formatTimeLabel(event.startTime)}${event.class?.name ? ` · ${event.class.name}` : ""}`,
      description: event.description ?? undefined,
      location: event.class?.name ?? "School",
    })),
    // fee payment counts per class for the active academic year and term
    feePaymentByClass: await (async () => {
      try {
        const activeYear = await db.academicYear.findFirst({ where: { isActive: true } });
        if (!activeYear) return [];
        const activeTerm = await db.academicTerm.findFirst({ where: { academicYearId: activeYear.id }, orderBy: { termNumber: "asc" } });
        if (!activeTerm) return [];

        const termEnum = activeTerm.termNumber === 1 ? "TERM_1" : activeTerm.termNumber === 2 ? "TERM_2" : "TERM_3";

        const schedules = await db.feeSchedule.findMany({ where: { academicYear: activeYear.label, term: termEnum as any }, select: { id: true, classId: true } });

        let assignments: Array<any> = [];

        if (schedules.length) {
          const scheduleIds = schedules.map((s) => s.id);

          assignments = await db.studentFeeAssignment.findMany({
            where: { feeScheduleId: { in: scheduleIds } },
            select: { totalBillCedis: true, payments: { select: { amountCedis: true } }, student: { select: { classId: true } } },
          });
        } else {
          // try to find assignments by joining feeSchedule relation (more robust if feeSchedule records exist differently)
          assignments = await db.studentFeeAssignment.findMany({
            where: { feeSchedule: { academicYear: activeYear.label, term: termEnum as any } },
            select: { totalBillCedis: true, payments: { select: { amountCedis: true } }, student: { select: { classId: true } } },
          });

          // final fallback: include all assignments (will show payments across years)
          if (!assignments.length) {
            assignments = await db.studentFeeAssignment.findMany({
              select: { totalBillCedis: true, payments: { select: { amountCedis: true } }, student: { select: { classId: true } } },
            });
          }
        }

        const classMap = new Map<number, { paid: number; unpaid: number }>();
        for (const a of assignments) {
          const classId = a.student?.classId ?? -1;
          const paidAmount = a.payments.reduce((sum: number, payment: { amountCedis: any }) => sum + Number(payment.amountCedis), 0);
          const finished = paidAmount + 0.005 >= Number(a.totalBillCedis);
          const current = classMap.get(classId) ?? { paid: 0, unpaid: 0 };
          if (finished) current.paid += 1; else current.unpaid += 1;
          classMap.set(classId, current);
        }

        const out = classes
          .map((c) => ({ classId: c.id, className: c.name }))
          .map((item) => {
            const counts = classMap.get(item.classId) ?? { paid: 0, unpaid: 0 };
            return { className: item.className, paid: counts.paid, unpaid: counts.unpaid };
          });

        return out;
      } catch (e) {
        return [];
      }
    })(),
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
