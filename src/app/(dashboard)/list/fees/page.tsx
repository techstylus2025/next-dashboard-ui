import FeesManagement from "@/components/fees/FeesManagement";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export default async function FeesPage() {
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  const classes = await prisma.class.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  const allSchedules = await prisma.feeSchedule.findMany({
    include: {
      class: { select: { id: true, name: true } },
      assignments: { include: { payments: true } },
    },
    orderBy: [{ academicYear: "desc" }, { term: "asc" }],
  });

  let schedulesForCards = allSchedules;
  if (role === "parent" && userId) {
    const kids = await prisma.student.findMany({
      where: { parentId: userId, isArchived: false },
      select: { classId: true },
    });
    const classIds = new Set(kids.map((k) => k.classId));
    schedulesForCards = allSchedules.filter((s) => classIds.has(s.classId));
  } else if (role === "student" && userId) {
    const st = await prisma.student.findUnique({
      where: { id: userId },
      select: { classId: true },
    });
    if (st) {
      schedulesForCards = allSchedules.filter((s) => s.classId === st.classId);
    } else {
      schedulesForCards = [];
    }
  }

  const classFeeCards = schedulesForCards.map((s) => {
    const totalBill = Number(s.totalBillCedis);
    const studentCount = s.assignments.length;
    const totalCollected = s.assignments.reduce(
      (sum, a) =>
        sum +
        a.payments.reduce((p, pay) => p + Number(pay.amountCedis), 0),
      0
    );
    const outstanding = s.assignments.reduce((sum, a) => {
      const paid = a.payments.reduce((p, pay) => p + Number(pay.amountCedis), 0);
      return sum + (Number(a.totalBillCedis) - paid);
    }, 0);
    return {
      id: s.id,
      classId: s.classId,
      className: s.class.name,
      term: s.term,
      academicYear: s.academicYear,
      totalBill,
      studentCount,
      totalCollected,
      outstanding,
    };
  });

  const allAssignments = await prisma.studentFeeAssignment.findMany({
    where: role === "parent" && userId ? { student: { parentId: userId } } : role === "student" && userId ? { studentId: userId } : {},
    include: {
      student: {
        select: {
          id: true,
          name: true,
          surname: true,
          parentId: true,
          class: { select: { name: true } },
        },
      },
      feeSchedule: {
        select: { academicYear: true, term: true, totalBillCedis: true },
      },
      payments: { orderBy: { paidAt: "desc" } },
    },
    orderBy: { id: "desc" },
  });

  const assignmentOptions = allAssignments
    .map((a) => {
      const totalBill = Number(a.totalBillCedis);
      const paidSoFar = a.payments.reduce((s, p) => s + Number(p.amountCedis), 0);
      const balance = totalBill - paidSoFar;
      const last = a.payments[0]?.paidAt ?? null;
      return {
        id: a.id,
        studentName: `${a.student.name} ${a.student.surname}`,
        className: a.student.class.name,
        term: a.feeSchedule.term,
        academicYear: a.feeSchedule.academicYear,
        totalBill,
        paidSoFar,
        balance,
        lastPaymentDate: last ? last.toISOString() : null,
      };
    })
    .filter((a) => a.balance > 0.009);

  const paymentsRaw = await prisma.feePayment.findMany({
    include: {
      assignment: {
        include: {
          student: {
            select: { id: true, name: true, surname: true, parentId: true },
          },
          feeSchedule: {
            include: { class: { select: { name: true } } },
          },
        },
      },
    },
    orderBy: { paidAt: "desc" },
  });

  const paymentRowsFull = paymentsRaw.map((p) => ({
    id: p.id,
    assignmentId: p.studentFeeAssignmentId,
    studentName: `${p.assignment.student.name} ${p.assignment.student.surname}`,
    className: p.assignment.feeSchedule.class.name,
    term: p.assignment.feeSchedule.term,
    academicYear: p.assignment.feeSchedule.academicYear,
    amount: Number(p.amountCedis),
    paidAt: p.paidAt.toISOString(),
    paymentMethod: p.paymentMethod,
    methodDetails: p.methodDetails,
    studentId: p.assignment.student.id,
    parentId: p.assignment.student.parentId,
  }));

  let payments = paymentRowsFull.map(({ studentId: _sid, parentId: _pid, ...row }) => row);

  if (role === "parent" && userId) {
    payments = paymentRowsFull
      .filter((r) => r.parentId === userId)
      .map(({ studentId: _sid, parentId: _pid, ...row }) => row);
  } else if (role === "student" && userId) {
    payments = paymentRowsFull
      .filter((r) => r.studentId === userId)
      .map(({ studentId: _sid, parentId: _pid, ...row }) => row);
  } else if (role !== "admin") {
    payments = [];
  }

  const canAdmin = role === "admin";
  const canCollect = role === "admin";

  const feeSummary = {
    totalFeesCollected: classFeeCards.reduce((sum, card) => sum + card.totalCollected, 0),
    totalFeesOutstanding: classFeeCards.reduce((sum, card) => sum + card.outstanding, 0),
    feeAssignments: classFeeCards.reduce((sum, card) => sum + card.studentCount, 0),
    activeFeeSchedules: classFeeCards.length,
  };

  return (
    <div className="flex-1 p-4 min-h-[60vh] rounded-2xl bg-slate-50">
      <FeesManagement
        role={role}
        classes={classes}
        classFeeCards={classFeeCards}
        // show assignment options for parents and students as well as admins
        assignmentOptions={role === "parent" || role === "student" ? assignmentOptions : canCollect ? assignmentOptions : []}
        payments={payments}
        canAdmin={canAdmin}
        canCollect={canCollect}
        summary={feeSummary}
      />
    </div>
  );
}
