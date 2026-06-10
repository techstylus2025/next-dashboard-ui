import { PrismaClient } from "@prisma/client";
import prisma from "@/lib/prisma";

const db = prisma as unknown as PrismaClient;

export type MonthlyPaymentPoint = {
  month: string;
  collected: number;
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

export async function loadAdminDashboardSummary(): Promise<AdminDashboardSummary> {
  const [totalStudents, totalTeachers, totalParents, totalClasses, activeFeeSchedules, feeAssignments] =
    await Promise.all([
      db.student.count(),
      db.teacher.count(),
      db.parent.count(),
      db.class.count(),
      db.feeSchedule.count({ where: { isArchived: false } }),
      db.studentFeeAssignment.count(),
    ]);

  const payments = await db.feePayment.findMany({
    select: { amountCedis: true, paidAt: true },
    orderBy: { paidAt: "asc" },
  });

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

  const now = new Date();
  const dayIndex = now.getDay();
  const monday = new Date(now);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(now.getDate() - ((dayIndex + 6) % 7));

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
