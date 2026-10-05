import FeesManagement from "@/components/fees/FeesManagement";
import FeesPasswordGate from "@/components/fees/FeesPasswordGate";
import { getCurrentAuthContext } from "@/lib/auth";
import { hasFeePageAccess } from "@/lib/feePageAccess";
import prisma from "@/lib/prisma";

export default async function FeesPage() {
  const { userId, role } = await getCurrentAuthContext();
  if (role === "admin" && !(await hasFeePageAccess(userId))) {
    return <FeesPasswordGate />;
  }

  const schoolSettings = await prisma.schoolSetting.findFirst({
    select: { name: true, address: true, telephone: true, location: true, email: true, logoUrl: true },
  });
  const schoolDetails = {
    name: schoolSettings?.name?.trim() || "School",
    address: schoolSettings?.address ?? null,
    telephone: schoolSettings?.telephone ?? null,
    location: schoolSettings?.location ?? null,
    email: schoolSettings?.email ?? null,
    logoUrl: schoolSettings?.logoUrl ?? null,
  };

  const studentScope = role === "parent" && userId
    ? { parentId: userId, isArchived: false }
    : role === "student" && userId
      ? { id: userId, isArchived: false }
      : null;

  const classes = await prisma.class.findMany({
    where: role === "parent" && userId
      ? { students: { some: { parentId: userId, isArchived: false } } }
      : role === "student" && userId
        ? { students: { some: { id: userId, isArchived: false } } }
        : role === "admin" ? {} : { id: { in: [] } },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  const allSchedules = await prisma.feeSchedule.findMany({
    where: role === "parent" && userId
      ? { class: { students: { some: { parentId: userId, isArchived: false } } } }
      : role === "student" && userId
        ? { class: { students: { some: { id: userId, isArchived: false } } } }
        : role === "admin" ? {} : { id: { in: [] } },
    include: {
      class: { select: { id: true, name: true } },
      assignments: {
        where: studentScope ? { student: studentScope } : {},
        include: { payments: true },
      },
    },
    orderBy: [{ academicYear: "desc" }, { term: "asc" }],
  });

  const classFeeCards = allSchedules.map((s) => {
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
    where: studentScope ? { student: studentScope } : role === "admin" ? {} : { id: { in: [] } },
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

  const feeStatusAssignments = allAssignments.map((a) => {
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
        paymentCount: a.payments.length,
      };
    });
  const assignmentOptions = feeStatusAssignments.filter((assignment) => assignment.balance > 0.009);

  const paymentsRaw = await prisma.feePayment.findMany({
    where: role === "parent" && userId
      ? { assignment: { student: { parentId: userId, isArchived: false } } }
      : role === "student" && userId
        ? { assignment: { student: { id: userId, isArchived: false } } }
        : role === "admin" ? {} : { id: { in: [] } },
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

  const paymentCountById = new Map<number, number>();
  const assignmentPaymentCounts = new Map<number, number>();
  [...paymentsRaw]
    .sort((paymentA, paymentB) => paymentA.paidAt.getTime() - paymentB.paidAt.getTime() || paymentA.id - paymentB.id)
    .forEach((payment) => {
      const assignmentId = payment.studentFeeAssignmentId;
      const paymentCount = (assignmentPaymentCounts.get(assignmentId) ?? 0) + 1;
      assignmentPaymentCounts.set(assignmentId, paymentCount);
      paymentCountById.set(payment.id, paymentCount);
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
    paymentCount: paymentCountById.get(p.id) ?? 1,
    paymentMethod: p.paymentMethod,
    methodDetails: p.methodDetails,
    studentId: p.assignment.student.id,
    parentId: p.assignment.student.parentId,
  }));

  const payments = paymentRowsFull.map(({ studentId: _sid, parentId: _pid, ...row }) => row);

  const canAdmin = role === "admin";
  const canCollect = role === "admin";

  const feeSummary = {
    totalFeesCollected: classFeeCards.reduce((sum, card) => sum + card.totalCollected, 0),
    totalFeesOutstanding: classFeeCards.reduce((sum, card) => sum + card.outstanding, 0),
    feeAssignments: classFeeCards.reduce((sum, card) => sum + card.studentCount, 0),
    activeFeeSchedules: classFeeCards.length,
  };

  // determine active academic year and term and compute arrears
  const activeYear = await prisma.academicYear.findFirst({ where: { isActive: true }, orderBy: { createdAt: "desc" } });
  let activeTermRec = null;
  if (activeYear) {
    activeTermRec = await prisma.academicTerm.findFirst({ where: { academicYearId: activeYear.id }, orderBy: { termNumber: "desc" } });
  }

  const makeAssignmentOption = (a: any) => {
    const totalBill = Number(a.totalBillCedis ?? a.feeSchedule?.totalBillCedis ?? 0);
    const paidSoFar = (a.payments ?? []).reduce((s: number, p: any) => s + Number(p.amountCedis), 0);
    const balance = totalBill - paidSoFar;
    const last = (a.payments && a.payments[0]?.paidAt) ?? null;
    return {
      id: a.id,
      studentName: `${a.student?.name ?? ""} ${a.student?.surname ?? ""}`.trim(),
      className: a.student?.class?.name ?? a.feeSchedule?.class?.name ?? "",
      term: a.feeSchedule?.term ?? a.term,
      academicYear: a.feeSchedule?.academicYear ?? a.academicYear,
      totalBill,
      paidSoFar,
      balance,
      lastPaymentDate: last ? new Date(last).toISOString() : null,
      paymentCount: (a.payments ?? []).length,
    };
  };

  let activeTermArrears: any[] = [];
  let previousTermArrears: any[] = [];
  if (activeYear && activeTermRec) {
    const activeTermEnum = `TERM_${activeTermRec.termNumber}`;
    const prevTermNumber = activeTermRec.termNumber - 1;
    const prevTermEnum = prevTermNumber >= 1 ? `TERM_${prevTermNumber}` : null;

    const allAssigns = await prisma.studentFeeAssignment.findMany({
      where: studentScope ? { student: studentScope } : role === "admin" ? {} : { id: { in: [] } },
      include: {
        student: { select: { name: true, surname: true, class: { select: { name: true } } } },
        feeSchedule: { select: { academicYear: true, term: true, totalBillCedis: true, class: { select: { name: true } } } },
        payments: { orderBy: { paidAt: "desc" } },
      },
    });

    for (const a of allAssigns) {
      const opt = makeAssignmentOption(a);
      if (opt.balance > 0.009) {
        if (a.feeSchedule?.academicYear === activeYear.label && a.feeSchedule?.term === activeTermEnum) {
          activeTermArrears.push(opt);
        } else if (prevTermEnum && a.feeSchedule?.academicYear === activeYear.label && a.feeSchedule?.term === prevTermEnum) {
          previousTermArrears.push(opt);
        }
      }
    }
  }

  return (
    <div className="flex-1 p-2 min-h-[60vh] rounded-xl bg-slate-50">
      <FeesManagement
        role={role ?? undefined}
        schoolDetails={schoolDetails}
        classes={classes}
        classFeeCards={classFeeCards}
        // show assignment options for parents and students as well as admins
        assignmentOptions={role === "parent" || role === "student" ? assignmentOptions : canCollect ? assignmentOptions : []}
        feeStatusAssignments={feeStatusAssignments}
        payments={payments}
        canAdmin={canAdmin}
        canCollect={canCollect}
        summary={feeSummary}
        activeTermArrears={activeTermArrears}
        previousTermArrears={previousTermArrears}
      />
    </div>
  );
}
