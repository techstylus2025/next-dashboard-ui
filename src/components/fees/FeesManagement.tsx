"use client";

import Image from "next/image";
import {
  BadgeCheck,
  CalendarDays,
  CircleDollarSign,
  ClipboardList,
  PlusCircle,
  ShieldCheck,
  TrendingUp,
  WalletCards,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { toast } from "react-toastify";
import {
  createFeeSchedule,
  recordFeePayment,
  updateFeePayment,
  deleteFeePayment,
  updateFeeSchedule,
  deleteFeeSchedule,
} from "../../lib/feeActions";

function termLabel(term: string) {
  switch (term) {
    case "TERM_1":
      return "Term 1";
    case "TERM_2":
      return "Term 2";
    case "TERM_3":
      return "Term 3";
    default:
      return term;
  }
}

// Lightweight local types for this component
type ClassOption = { id: number; name: string };
type ClassFeeCard = {
  id: number;
  classId: number;
  className: string;
  term: string;
  academicYear: string;
  totalBill: number;
  studentCount: number;
  totalCollected: number;
  outstanding: number;
};
type AssignmentOption = {
  id: number;
  studentName: string;
  className: string;
  term: string;
  academicYear: string;
  totalBill: number;
  paidSoFar: number;
  balance: number;
  lastPaymentDate: string | null;
  paymentCount: number;
};
type PaymentRow = {
  id: number;
  assignmentId: number;
  studentName: string;
  className: string;
  term: string;
  academicYear: string;
  amount: number;
  paidAt: string;
  paymentCount: number;
  paymentMethod?: string | null;
  methodDetails?: string | null;
  studentId?: number;
  parentId?: string | null;
};
type ReceiptData = {
  paymentId: number;
  studentName: string;
  className: string;
  term: string;
  academicYear: string;
  amount: number;
  paymentDate: string;
  paymentCount: number;
  paymentMethod: string;
  methodDetails?: string | null;
  mobileMoneyService?: string | null;
  balance?: number;
};
type ReceiptSchoolDetails = {
  name: string;
  address?: string | null;
  telephone?: string | null;
  location?: string | null;
  email?: string | null;
  logoUrl?: string | null;
};
type FeeSummary = {
  totalFeesCollected: number;
  totalFeesOutstanding: number;
  feeAssignments: number;
  activeFeeSchedules: number;
};

function groupFeeSchedules(cards: ClassFeeCard[]) {
  const byYear = new Map<string, Map<string, ClassFeeCard[]>>();

  for (const card of cards) {
    const byTerm = byYear.get(card.academicYear) ?? new Map<string, ClassFeeCard[]>();
    const termCards = byTerm.get(card.term) ?? [];
    termCards.push(card);
    byTerm.set(card.term, termCards);
    byYear.set(card.academicYear, byTerm);
  }

  return Array.from(byYear.entries())
    .sort(([yearA], [yearB]) => yearB.localeCompare(yearA, undefined, { numeric: true }))
    .map(([academicYear, terms]) => ({
      academicYear,
      terms: Array.from(terms.entries())
        .sort(([termA], [termB]) => termA.localeCompare(termB))
        .map(([term, termCards]) => ({ term, cards: termCards })),
    }));
}

function FeePaymentReceipt({
  school,
  receipt,
  onClose,
}: {
  school: ReceiptSchoolDetails;
  receipt: ReceiptData;
  onClose: () => void;
}) {
  const paymentMethod = receipt.paymentMethod === "mobile_money"
    ? `${receipt.mobileMoneyService || "MTN"} Mobile Money`
    : receipt.paymentMethod === "bank_payment"
      ? "Bank Payment"
      : receipt.paymentMethod.charAt(0).toUpperCase() + receipt.paymentMethod.slice(1);
  const schoolAddress = [school.address, school.location].filter(Boolean).join(" · ");
  const schoolInitials = school.name
    .split(/\s+/)
    .map((word) => word.replace(/[^a-z0-9]/gi, "")[0] ?? "")
    .join("")
    .toUpperCase() || "SCH";
  const paymentDate = new Date(receipt.paymentDate);
  const paymentDateStamp = receipt.paymentDate.slice(0, 10).replace(/-/g, "");
  const receiptNumber = `${schoolInitials}-${paymentDateStamp}-${String(receipt.paymentId).padStart(6, "0")}`;

  return (
    <article className="fee-receipt-print w-full max-w-3xl overflow-hidden rounded-xl bg-white shadow-xl ring-1 ring-slate-200">
      <div className="h-2 bg-gradient-to-r from-blue-950 via-blue-700 to-sky-400" />
      <div className="p-6 sm:p-9">
        <header className="grid gap-5 border-b border-slate-200 pb-6 sm:grid-cols-[minmax(0,1fr)_240px] sm:items-start">
          <div className="flex min-w-0 items-start gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white p-1">
              <Image
                src={school.logoUrl || "/logo.png"}
                alt={`${school.name} logo`}
                width={56}
                height={56}
                className="h-full w-full object-contain"
              />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-800">Official school receipt</p>
              <h1 className="mt-1 truncate whitespace-nowrap text-base font-bold leading-tight text-slate-900 sm:text-xl" title={school.name}>{school.name}</h1>
              <address className="mt-2 space-y-0.5 text-xs not-italic leading-relaxed text-slate-600">
                {schoolAddress ? <p>{schoolAddress}</p> : null}
                {school.telephone ? <p>Tel: {school.telephone}</p> : null}
                {school.email ? <p>{school.email}</p> : null}
              </address>
            </div>
          </div>
          <div className="min-w-0 border-t border-slate-200 pt-4 sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0 sm:text-right">
            <p className="text-sm font-semibold uppercase tracking-[0.08em] text-slate-800">Fee payment receipt</p>
            <dl className="mt-2 space-y-1.5 text-xs">
              <div className="flex justify-between gap-3 sm:justify-end"><dt className="text-slate-500">Receipt no.</dt><dd className="font-mono font-semibold text-slate-900">{receiptNumber}</dd></div>
              <div className="flex justify-between gap-3 sm:justify-end"><dt className="text-slate-500">Payment count</dt><dd className="font-medium text-slate-800">{receipt.paymentCount}</dd></div>
              <div className="flex justify-between gap-3 sm:justify-end"><dt className="text-slate-500">Date</dt><dd className="font-medium text-slate-800">{paymentDate.toLocaleDateString()}</dd></div>
            </dl>
          </div>
        </header>

        <section className="mt-6 rounded-lg bg-blue-950 px-5 py-4 text-white sm:flex sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-sky-200">Payment received</p>
            <p className="mt-1 text-3xl font-semibold">₵{receipt.amount.toFixed(2)}</p>
          </div>
          <p className="mt-3 text-sm text-sky-100 sm:mt-0">Thank you for your payment.</p>
        </section>

        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <section>
            <h2 className="border-b border-slate-200 pb-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Student and billing</h2>
            <dl className="mt-3 space-y-3 text-sm">
              <div><dt className="text-xs text-slate-500">Student</dt><dd className="mt-0.5 font-semibold text-slate-900">{receipt.studentName}</dd></div>
              <div><dt className="text-xs text-slate-500">Class</dt><dd className="mt-0.5 font-medium text-slate-800">{receipt.className}</dd></div>
              <div><dt className="text-xs text-slate-500">Academic period</dt><dd className="mt-0.5 font-medium text-slate-800">{termLabel(receipt.term)} · {receipt.academicYear}</dd></div>
            </dl>
          </section>

          <section>
            <h2 className="border-b border-slate-200 pb-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Payment details</h2>
            <dl className="mt-3 space-y-3 text-sm">
              <div><dt className="text-xs text-slate-500">Payment method</dt><dd className="mt-0.5 font-medium text-slate-800">{paymentMethod}</dd></div>
              {receipt.methodDetails ? <div><dt className="text-xs text-slate-500">Reference / payer details</dt><dd className="mt-0.5 break-words font-medium text-slate-800">{receipt.methodDetails}</dd></div> : null}
              {receipt.balance !== undefined ? <div><dt className="text-xs text-slate-500">Remaining balance</dt><dd className={`mt-0.5 font-semibold ${receipt.balance > 0 ? "text-rose-700" : "text-blue-800"}`}>₵{receipt.balance.toFixed(2)}</dd></div> : null}
            </dl>
          </section>
        </div>

        <footer className="mt-7 border-t border-dashed border-slate-300 pt-4 text-center text-xs text-slate-500">
          <p>This receipt confirms payment received by {school.name}.</p>
          <p className="mt-1">Please retain it for your records.</p>
        </footer>

        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-md px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">Close</button>
          <button type="button" onClick={() => window.print()} className="rounded-md bg-blue-800 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-950">Print receipt</button>
        </div>
      </div>
    </article>
  );
}


export default function FeesManagement({
  role,
  reportingDate,
  schoolDetails,
  classes,
  classFeeCards,
  assignmentOptions,
  feeStatusAssignments,
  payments,
  canAdmin,
  canCollect,
  summary,
  activeTermArrears,
  previousTermArrears,
}: {
  role: string | undefined;
  reportingDate: string;
  schoolDetails: ReceiptSchoolDetails;
  classes: ClassOption[];
  classFeeCards: ClassFeeCard[];
  assignmentOptions: AssignmentOption[];
  feeStatusAssignments: AssignmentOption[];
  payments: PaymentRow[];
  canAdmin: boolean;
  canCollect: boolean;
  summary: FeeSummary;
  activeTermArrears?: AssignmentOption[];
  previousTermArrears?: AssignmentOption[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const isViewer = role === "parent" || role === "student";
  const feeScheduleGroups = useMemo(() => groupFeeSchedules(classFeeCards), [classFeeCards]);
  const recentFeeScheduleGroups = useMemo(
    () => groupFeeSchedules(classFeeCards.slice(0, 4)),
    [classFeeCards]
  );
  const collectionTrend = useMemo(() => {
    const reportDate = new Date(reportingDate);
    const months = Array.from({ length: 6 }, (_, index) => {
      const date = new Date(Date.UTC(reportDate.getUTCFullYear(), reportDate.getUTCMonth() - 5 + index, 1));
      return {
        key: `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`,
        label: new Intl.DateTimeFormat("en", { month: "short", timeZone: "UTC" }).format(date),
        amount: 0,
      };
    });
    const totalsByMonth = new Map(months.map((month) => [month.key, month]));

    for (const payment of payments) {
      const paidAt = new Date(payment.paidAt);
      if (!Number.isFinite(paidAt.getTime())) continue;
      const key = `${paidAt.getUTCFullYear()}-${String(paidAt.getUTCMonth() + 1).padStart(2, "0")}`;
      const month = totalsByMonth.get(key);
      if (month) month.amount += payment.amount;
    }

    return {
      months,
      currentMonthKey: `${reportDate.getUTCFullYear()}-${String(reportDate.getUTCMonth() + 1).padStart(2, "0")}`,
      maxAmount: Math.max(...months.map((month) => month.amount), 0),
    };
  }, [payments, reportingDate]);
  const collectionRate = summary.totalFeesCollected + summary.totalFeesOutstanding > 0
    ? Math.min(
        100,
        Math.max(
          0,
          (summary.totalFeesCollected / (summary.totalFeesCollected + summary.totalFeesOutstanding)) * 100
        )
      )
    : 0;
  const [activeTab, setActiveTab] = useState<"overview" | "feeBills" | "payments">(
    isViewer ? "payments" : "overview"
  );
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [recordModalOpen, setRecordModalOpen] = useState(false);
  const [paymentSearch, setPaymentSearch] = useState("");

  // Create modal state
  const [feeClassId, setFeeClassId] = useState<string>("");
  const [feeYear, setFeeYear] = useState<string>("");
  const [feeTerm, setFeeTerm] = useState<"TERM_1" | "TERM_2" | "TERM_3">("TERM_1");
  const [feeTotal, setFeeTotal] = useState<string>("");

  // Record payment state
  const [selectedAssignment, setSelectedAssignment] = useState<AssignmentOption | null>(null);
  const [payAmount, setPayAmount] = useState<string>("");
  const [payDate, setPayDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");
  const [methodDetails, setMethodDetails] = useState<string>("");
  const [mobileMoneyService, setMobileMoneyService] = useState<string>("MTN");
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [viewingReceiptPayment, setViewingReceiptPayment] = useState<PaymentRow | null>(null);
  const [paymentFilterYear, setPaymentFilterYear] = useState("");
  const [paymentFilterTerm, setPaymentFilterTerm] = useState("");
  const [paymentFilterClass, setPaymentFilterClass] = useState("");
  const [paymentFilterStudent, setPaymentFilterStudent] = useState("");
  const [paymentFilterModalOpen, setPaymentFilterModalOpen] = useState(false);
  const [expandedStudentKeys, setExpandedStudentKeys] = useState<Record<string, boolean>>({});

  const toggleStudentGroup = (key: string) => {
    setExpandedStudentKeys((prev) => ({
      ...prev,
      [key]: !(prev[key] ?? true),
    }));
  };

  const paymentYears = useMemo(
    () => Array.from(new Set(payments.map((p) => p.academicYear))).sort((a, b) => b.localeCompare(a)),
    [payments]
  );

  const paymentTerms = useMemo(() => {
    const source = paymentFilterYear
      ? payments.filter((p) => p.academicYear === paymentFilterYear)
      : payments;
    return Array.from(new Set(source.map((p) => p.term))).sort((a, b) => a.localeCompare(b));
  }, [payments, paymentFilterYear]);

  const paymentClasses = useMemo(() => {
    const source = payments.filter((p) => {
      if (paymentFilterYear && p.academicYear !== paymentFilterYear) return false;
      if (paymentFilterTerm && p.term !== paymentFilterTerm) return false;
      return true;
    });
    return Array.from(new Set(source.map((p) => p.className))).sort((a, b) => a.localeCompare(b));
  }, [payments, paymentFilterYear, paymentFilterTerm]);

  const paymentStudents = useMemo(() => {
    const source = payments.filter((p) => {
      if (paymentFilterYear && p.academicYear !== paymentFilterYear) return false;
      if (paymentFilterTerm && p.term !== paymentFilterTerm) return false;
      if (paymentFilterClass && p.className !== paymentFilterClass) return false;
      return true;
    });
    return Array.from(new Set(source.map((p) => p.studentName))).sort((a, b) => a.localeCompare(b));
  }, [payments, paymentFilterYear, paymentFilterTerm, paymentFilterClass]);

  const filteredPayments = useMemo(() => {
    const q = paymentSearch.trim().toLowerCase();
    return payments.filter((p) => {
      if (q) {
        const searchTarget = `${p.studentName} ${p.className} ${p.academicYear} ${termLabel(p.term)}`.toLowerCase();
        if (!searchTarget.includes(q)) return false;
      }
      if (paymentFilterYear && p.academicYear !== paymentFilterYear) return false;
      if (paymentFilterTerm && p.term !== paymentFilterTerm) return false;
      if (paymentFilterClass && p.className !== paymentFilterClass) return false;
      if (paymentFilterStudent && p.studentName !== paymentFilterStudent) return false;
      return true;
    });
  }, [payments, paymentSearch, paymentFilterYear, paymentFilterTerm, paymentFilterClass, paymentFilterStudent]);

  const studentPaymentGroups = useMemo(() => {
    const groups = new Map<
      string,
      {
        studentName: string;
        className: string;
        academicYear: string;
        term: string;
        payments: PaymentRow[];
      }
    >();

    for (const p of filteredPayments) {
      const key = `${p.studentName}|${p.className}|${p.term}|${p.academicYear}`;
      if (!groups.has(key)) {
        groups.set(key, {
          studentName: p.studentName,
          className: p.className,
          academicYear: p.academicYear,
          term: p.term,
          payments: [],
        });
      }
      groups.get(key)!.payments.push(p);
    }

    return Array.from(groups.values())
      .map((group) => ({
        ...group,
        payments: [...group.payments].sort(
          (a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime()
        ),
      }))
      .sort((a, b) => a.studentName.localeCompare(b.studentName));
  }, [filteredPayments]);

  const filteredStudents = useMemo(() => {
    const q = paymentSearch.trim().toLowerCase();
    if (!q) return assignmentOptions;
    return assignmentOptions.filter((a) => a.studentName.toLowerCase().includes(q));
  }, [assignmentOptions, paymentSearch]);

  const filteredFeeStatusAssignments = useMemo(() => {
    const q = paymentSearch.trim().toLowerCase();
    if (!q) return feeStatusAssignments;
    return feeStatusAssignments.filter((assignment) => assignment.studentName.toLowerCase().includes(q));
  }, [feeStatusAssignments, paymentSearch]);

  const activeArrearsTerm = (activeTermArrears ?? [])[0]?.term ?? "";
  const previousArrearsTerm = (previousTermArrears ?? [])[0]?.term ?? "";

  const jumpToArrears = (term: string, label: string) => {
    setActiveTab("payments");
    setPaymentFilterTerm(term || "");
    setPaymentFilterStudent("");
    setPaymentFilterClass("");
    setPaymentFilterYear("");
    setPaymentSearch(label);
  };

  const renderPaymentFilterFields = () => (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      <label className="text-xs font-medium text-slate-600">
        Academic Year
        <select
          value={paymentFilterYear}
          onChange={(e) => {
            setPaymentFilterYear(e.target.value);
            setPaymentFilterTerm("");
            setPaymentFilterClass("");
            setPaymentFilterStudent("");
          }}
          className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
        >
          <option value="">All years</option>
          {paymentYears.map((year) => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
      </label>

      <label className="text-xs font-medium text-slate-600">
        Term
        <select
          value={paymentFilterTerm}
          onChange={(e) => {
            setPaymentFilterTerm(e.target.value);
            setPaymentFilterClass("");
            setPaymentFilterStudent("");
          }}
          className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
        >
          <option value="">All terms</option>
          {paymentTerms.map((term) => (
            <option key={term} value={term}>{termLabel(term)}</option>
          ))}
        </select>
      </label>

      <label className="text-xs font-medium text-slate-600">
        Class
        <select
          value={paymentFilterClass}
          onChange={(e) => {
            setPaymentFilterClass(e.target.value);
            setPaymentFilterStudent("");
          }}
          className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
        >
          <option value="">All classes</option>
          {paymentClasses.map((className) => (
            <option key={className} value={className}>{className}</option>
          ))}
        </select>
      </label>

      <label className="text-xs font-medium text-slate-600">
        Student
        <select
          value={paymentFilterStudent}
          onChange={(e) => setPaymentFilterStudent(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
        >
          <option value="">All students</option>
          {paymentStudents.map((studentName) => (
            <option key={studentName} value={studentName}>{studentName}</option>
          ))}
        </select>
      </label>
    </div>
  );

  return (
    <div className="mx-auto flex w-full max-w-screen-2xl flex-col gap-5 p-3 sm:p-5 lg:p-6">
      {canAdmin ? (
        <section className="relative isolate overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 px-6 py-8 text-white shadow-xl shadow-slate-900/10 sm:px-8 sm:py-9">
          <div className="absolute -right-12 -top-16 -z-10 h-64 w-64 rounded-full bg-emerald-400/20 blur-3xl" />
          <div className="absolute -bottom-24 right-1/3 -z-10 h-48 w-48 rounded-full bg-sky-400/20 blur-3xl" />
          <div className="flex flex-col justify-between gap-7 lg:flex-row lg:items-end">
            <div className="max-w-2xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-100">
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                Secure finance workspace
              </div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">School fees management</h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">
                Manage class fee schedules, record payments, and monitor balances across the school.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:min-w-[390px] sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.08] p-4 backdrop-blur">
                <CircleDollarSign className="mb-3 h-5 w-5 text-emerald-300" aria-hidden="true" />
                <p className="text-lg font-bold tabular-nums sm:text-xl">₵{summary.totalFeesCollected.toFixed(2)}</p>
                <p className="mt-1 text-xs text-slate-300">Collected</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.08] p-4 backdrop-blur">
                <WalletCards className="mb-3 h-5 w-5 text-amber-300" aria-hidden="true" />
                <p className="text-lg font-bold tabular-nums sm:text-xl">₵{summary.totalFeesOutstanding.toFixed(2)}</p>
                <p className="mt-1 text-xs text-slate-300">Outstanding</p>
              </div>
              <div className="col-span-2 rounded-2xl border border-white/10 bg-white/[0.08] p-4 backdrop-blur sm:col-span-1">
                <ClipboardList className="mb-3 h-5 w-5 text-sky-300" aria-hidden="true" />
                <p className="text-lg font-bold tabular-nums sm:text-xl">{summary.activeFeeSchedules}</p>
                <p className="mt-1 text-xs text-slate-300">Fee schedules</p>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section className="rounded-3xl border border-slate-200 bg-white px-5 py-5 shadow-sm sm:px-6">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Fee management</h1>
          <p className="mt-1 text-sm text-slate-500">
            {role === "parent"
              ? "Fee payments recorded for your children."
              : role === "student"
                ? "Your school fee payment history."
                : "Class fee overview (read-only)."}
          </p>
        </section>
      )}

      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-4">
        <div className="flex w-full items-center justify-between gap-1 rounded-xl bg-slate-100 p-1 sm:w-auto sm:justify-start sm:gap-2">
          {(!isViewer
            ? [
                { key: "overview", label: "Overview" },
                { key: "feeBills", label: "Fee schedules" },
                { key: "payments", label: "Payments" },
              ]
            : [{ key: "payments", label: "Payments" }]
          ).map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key as any)}
              className={`rounded-lg px-3 py-2 text-xs font-semibold transition sm:px-4 sm:text-sm ${
                activeTab === tab.key ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {tab.label}
            </button>
          ))}

          {canAdmin && activeTab === "feeBills" && (
            <button
              type="button"
              aria-label="Create fee bill"
              onClick={() => setCreateModalOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white transition hover:bg-slate-800"
            >
              <PlusCircle size={16} strokeWidth={2.5} />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          {canCollect && activeTab === "payments" && !isViewer && (
            <button
              type="button"
              onClick={() => setRecordModalOpen(true)}
              className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
            >
              Record fee payment
            </button>
          )}
        </div>
      </div>

      <div className="rounded-2xl bg-white/90 p-3 shadow-sm md:p-4">
        {activeTab === "overview" && !isViewer && (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-6">
              <div className="rounded-3xl bg-gradient-to-br from-slate-50 via-white to-slate-100 p-5 shadow-sm">
                <div className="inline-flex rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-white">Collected</div>
                <p className="mt-4 text-sm text-slate-500">Total fees collected</p>
                <p className="mt-3 text-xl font-semibold text-slate-900">₵{summary.totalFeesCollected.toFixed(2)}</p>
              </div>
              <div className="rounded-3xl bg-gradient-to-br from-amber-50 via-white to-amber-100 p-5 shadow-sm">
                <div className="inline-flex rounded-full bg-amber-600 px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-white">Outstanding</div>
                <p className="mt-4 text-sm text-slate-600">Outstanding balance</p>
                <p className="mt-3 text-xl font-semibold text-slate-900">₵{summary.totalFeesOutstanding.toFixed(2)}</p>
              </div>
              <div className="rounded-3xl bg-gradient-to-br from-sky-50 via-white to-sky-100 p-5 shadow-sm">
                <div className="inline-flex rounded-full bg-sky-600 px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-white">Schedules</div>
                <p className="mt-4 text-sm text-slate-600">Active fee schedules</p>
                <p className="mt-3 text-xl font-semibold text-slate-900">{summary.activeFeeSchedules}</p>
              </div>
              <div className="rounded-3xl bg-gradient-to-br from-emerald-50 via-white to-emerald-100 p-5 shadow-sm">
                <div className="inline-flex rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-white">Assignments</div>
                <p className="mt-4 text-sm text-slate-600">Fee assignments</p>
                <p className="mt-3 text-xl font-semibold text-slate-900">{summary.feeAssignments}</p>
              </div>
              <button
                type="button"
                onClick={() => jumpToArrears(activeArrearsTerm, "active arrears")}
                className="rounded-3xl bg-gradient-to-br from-rose-50 via-white to-rose-100 p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="inline-flex rounded-full bg-rose-600 px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-white">Active Arrears</div>
                <p className="mt-4 text-sm text-slate-600">Students with outstanding balance for active term</p>
                <p className="mt-3 text-xl font-semibold text-slate-900">{(activeTermArrears ?? []).length}</p>
              </button>
              <button
                type="button"
                onClick={() => jumpToArrears(previousArrearsTerm, "previous arrears")}
                className="rounded-3xl bg-gradient-to-br from-violet-50 via-white to-violet-100 p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="inline-flex rounded-full bg-violet-600 px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-white">Previous Arrears</div>
                <p className="mt-4 text-sm text-slate-600">Students still owing from previous term</p>
                <p className="mt-3 text-xl font-semibold text-slate-900">{(previousTermArrears ?? []).length}</p>
              </button>
            </div>

            <div className="grid gap-4 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
              <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6" aria-labelledby="fee-collection-rate-title">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">School-wide progress</p>
                    <h2 id="fee-collection-rate-title" className="mt-2 text-lg font-semibold text-slate-900">Fee collection rate</h2>
                  </div>
                  <span className="rounded-xl bg-emerald-50 p-2.5 text-emerald-700">
                    <TrendingUp className="h-5 w-5" aria-hidden="true" />
                  </span>
                </div>
                <div className="mt-6 flex items-end justify-between gap-4">
                  <p className="text-4xl font-bold tracking-tight text-slate-900 tabular-nums">{collectionRate.toFixed(0)}%</p>
                  <p className="pb-1 text-right text-xs leading-5 text-slate-500">
                    Collected against billed fees
                    <br />
                    ₵{summary.totalFeesCollected.toFixed(2)} received
                  </p>
                </div>
                <div
                  className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100"
                  role="progressbar"
                  aria-label="Fee collection rate"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(collectionRate)}
                >
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-[width] duration-500"
                    style={{ width: `${collectionRate}%` }}
                  />
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                  <span>Outstanding: ₵{summary.totalFeesOutstanding.toFixed(2)}</span>
                  <button
                    type="button"
                    onClick={() => setActiveTab("feeBills")}
                    className="font-semibold text-slate-700 underline-offset-4 hover:text-emerald-700 hover:underline"
                  >
                    Review schedules
                  </button>
                </div>
              </section>

              <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6" aria-labelledby="monthly-collections-title">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Cash flow</p>
                    <h2 id="monthly-collections-title" className="mt-2 text-lg font-semibold text-slate-900">Monthly collections</h2>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <CalendarDays className="h-4 w-4" aria-hidden="true" />
                    Last six months
                  </div>
                </div>
                <div className="mt-5 grid grid-cols-6 gap-2 sm:gap-4" role="img" aria-label="Fee payments collected in each of the last six months">
                  {collectionTrend.months.map((month) => {
                    const isCurrentMonth = month.key === collectionTrend.currentMonthKey;
                    const barHeight = collectionTrend.maxAmount > 0 && month.amount > 0
                      ? Math.max(8, (month.amount / collectionTrend.maxAmount) * 100)
                      : 0;
                    return (
                      <div
                        key={month.key}
                        className="flex min-w-0 flex-col items-center justify-end"
                        title={`${month.label}: ₵${month.amount.toFixed(2)}`}
                      >
                        <span className="mb-2 min-h-4 text-center text-[10px] font-medium leading-4 text-slate-500 sm:text-xs">
                          {month.amount > 0
                            ? `₵${new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(month.amount)}`
                            : "—"}
                        </span>
                        <div className="flex h-28 w-full items-end overflow-hidden rounded-lg bg-slate-50">
                          <div
                            className={`w-full rounded-t-md transition-[height] duration-500 ${isCurrentMonth ? "bg-emerald-500" : "bg-sky-400"}`}
                            style={{ height: `${barHeight}%` }}
                          />
                        </div>
                        <span className={`mt-2 text-[10px] font-medium sm:text-xs ${isCurrentMonth ? "text-emerald-700" : "text-slate-500"}`}>
                          {month.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>

            <div className="grid gap-3 lg:grid-cols-2">
              <div className="rounded-3xl bg-slate-50 p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-slate-900">Active term arrears</p>
                    <p className="text-xs text-slate-500">{activeArrearsTerm ? termLabel(activeArrearsTerm) : "No active arrears"}</p>
                  </div>
                  <button type="button" onClick={() => jumpToArrears(activeArrearsTerm, "active arrears")} className="text-xs font-medium text-rose-700 hover:text-rose-800">
                    View all
                  </button>
                </div>
                <div className="mt-4 space-y-2">
                  {(activeTermArrears ?? []).length === 0 ? (
                    <p className="rounded-2xl border border-dashed border-slate-200 bg-white p-3 text-sm text-slate-500">No active term arrears.</p>
                  ) : (
                    (activeTermArrears ?? []).slice(0, 5).map((student) => (
                      <button
                        key={`${student.id}-${student.studentName}`}
                        type="button"
                        onClick={() => jumpToArrears(student.term, student.studentName)}
                        className="flex w-full items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-left text-sm text-slate-700 hover:border-rose-200 hover:bg-rose-50"
                      >
                        <div>
                          <p className="font-medium text-slate-900">{student.studentName}</p>
                          <p className="text-xs text-slate-500">{student.className}</p>
                        </div>
                        <span className="text-xs font-semibold text-rose-700">₵{student.balance.toFixed(2)}</span>
                      </button>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-3xl bg-slate-50 p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-slate-900">Previous term arrears</p>
                    <p className="text-xs text-slate-500">{previousArrearsTerm ? termLabel(previousArrearsTerm) : "No previous arrears"}</p>
                  </div>
                  <button type="button" onClick={() => jumpToArrears(previousArrearsTerm, "previous arrears")} className="text-xs font-medium text-violet-700 hover:text-violet-800">
                    View all
                  </button>
                </div>
                <div className="mt-4 space-y-2">
                  {(previousTermArrears ?? []).length === 0 ? (
                    <p className="rounded-2xl border border-dashed border-slate-200 bg-white p-3 text-sm text-slate-500">No previous term arrears.</p>
                  ) : (
                    (previousTermArrears ?? []).slice(0, 5).map((student) => (
                      <button
                        key={`${student.id}-${student.studentName}`}
                        type="button"
                        onClick={() => jumpToArrears(student.term, student.studentName)}
                        className="flex w-full items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-left text-sm text-slate-700 hover:border-violet-200 hover:bg-violet-50"
                      >
                        <div>
                          <p className="font-medium text-slate-900">{student.studentName}</p>
                          <p className="text-xs text-slate-500">{student.className}</p>
                        </div>
                        <span className="text-xs font-semibold text-violet-700">₵{student.balance.toFixed(2)}</span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-3xl bg-slate-50 p-5 shadow-sm">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-900">Recent fee schedules</p>
                  <p className="text-sm text-slate-500">Review the latest class fee bills and outstanding balances.</p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                  {classFeeCards.length} schedules
                </span>
              </div>

              {classFeeCards.length === 0 ? (
                <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
                  No fee schedules created yet.
                </div>
              ) : (
                <div className="mt-4 space-y-5">
                  {recentFeeScheduleGroups.map((yearGroup) => (
                    <details key={yearGroup.academicYear} className="smooth-disclosure group rounded-lg border border-slate-200 bg-white">
                      <summary className="cursor-pointer select-none px-4 py-3 text-sm font-semibold text-slate-800 marker:text-slate-400">
                        {yearGroup.academicYear}<span className="ml-2 text-xs font-normal text-slate-500">{yearGroup.terms.length} term{yearGroup.terms.length === 1 ? "" : "s"}</span>
                      </summary>
                      <div className="smooth-disclosure-panel">
                        <div className="smooth-disclosure-panel-inner">
                        <div className="space-y-3 border-t border-slate-100 p-3">
                        {yearGroup.terms.map((termGroup) => (
                          <details key={termGroup.term} className="smooth-disclosure group/term rounded-lg border border-slate-200">
                            <summary className="cursor-pointer select-none px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 marker:text-slate-400">
                              {termLabel(termGroup.term)}<span className="ml-2 font-normal normal-case tracking-normal text-slate-500">{termGroup.cards.length} schedule{termGroup.cards.length === 1 ? "" : "s"}</span>
                            </summary>
                            <div className="smooth-disclosure-panel">
                              <div className="smooth-disclosure-panel-inner">
                                <div className="grid gap-3 border-t border-slate-100 p-3 lg:grid-cols-2">
                              {termGroup.cards.map((card) => (
                                <div key={card.id} className="rounded-3xl bg-gradient-to-br from-white via-slate-50 to-slate-100 p-4 shadow-sm">
                                  <div className="flex items-start justify-between gap-4">
                                    <p className="text-sm font-semibold text-slate-900">{card.className}</p>
                                    <span className="rounded-full bg-slate-900 px-2 py-1 text-xs font-semibold uppercase tracking-[0.1em] text-white">{card.studentCount}</span>
                                  </div>
                                  <div className="mt-4 grid gap-3 text-sm text-slate-600">
                                    <div className="rounded-2xl bg-slate-100 p-3">
                                      <p className="text-xs uppercase tracking-[0.15em] text-slate-500">Total bill</p>
                                      <p className="mt-1 font-semibold text-slate-900">₵{card.totalBill.toFixed(2)}</p>
                                    </div>
                                    <div className="grid gap-2 sm:grid-cols-2">
                                      <div className="rounded-2xl bg-emerald-50 p-3">
                                        <p className="text-xs uppercase tracking-[0.15em] text-emerald-700">Collected</p>
                                        <p className="mt-1 font-semibold text-emerald-900">₵{card.totalCollected.toFixed(2)}</p>
                                      </div>
                                      <div className="rounded-2xl bg-amber-50 p-3">
                                        <p className="text-xs uppercase tracking-[0.15em] text-amber-700">Outstanding</p>
                                        <p className="mt-1 font-semibold text-amber-900">₵{card.outstanding.toFixed(2)}</p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                                </div>
                              </div>
                            </div>
                          </details>
                        ))}
                        </div>
                        </div>
                      </div>
                    </details>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "feeBills" && !isViewer && (
          <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Fee schedules</h3>
                <p className="text-sm text-slate-500">Browse class fee bills and monitor which schedules have outstanding balances.</p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600">
                {classFeeCards.length} schedules
              </span>
            </div>

            {classFeeCards.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
                No fee schedules available. Create a new fee bill to get started.
              </div>
            ) : (
              <div className="space-y-6">
                {feeScheduleGroups.map((yearGroup) => (
                  <details key={yearGroup.academicYear} className="smooth-disclosure group rounded-lg border border-slate-200 bg-white">
                    <summary className="cursor-pointer select-none px-4 py-3 text-sm font-semibold text-slate-800 marker:text-slate-400">
                      {yearGroup.academicYear}<span className="ml-2 text-xs font-normal text-slate-500">{yearGroup.terms.length} term{yearGroup.terms.length === 1 ? "" : "s"}</span>
                    </summary>
                    <div className="smooth-disclosure-panel">
                      <div className="smooth-disclosure-panel-inner">
                      <div className="space-y-3 border-t border-slate-100 p-3">
                      {yearGroup.terms.map((termGroup) => (
                        <details key={termGroup.term} className="smooth-disclosure group/term rounded-lg border border-slate-200">
                          <summary className="cursor-pointer select-none px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 marker:text-slate-400">
                            {termLabel(termGroup.term)}<span className="ml-2 font-normal normal-case tracking-normal text-slate-500">{termGroup.cards.length} schedule{termGroup.cards.length === 1 ? "" : "s"}</span>
                          </summary>
                          <div className="smooth-disclosure-panel">
                            <div className="smooth-disclosure-panel-inner">
                              <div className="grid gap-4 border-t border-slate-100 p-3 md:grid-cols-2 xl:grid-cols-3">
                            {termGroup.cards.map((card) => (
                              <div key={card.id} className="rounded-3xl bg-gradient-to-br from-white via-slate-50 to-slate-100 p-5 transition hover:-translate-y-1">
                                <div className="flex items-center justify-between gap-3">
                                  <p className="text-sm font-semibold text-slate-900">{card.className}</p>
                                  <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold uppercase tracking-[0.1em] text-white">{card.studentCount} students</span>
                                </div>
                                <div className="mt-4 space-y-3 text-sm text-slate-600">
                                  <div className="grid grid-cols-2 gap-3">
                                    <div className="rounded-2xl bg-slate-50 p-4 shadow-inner shadow-slate-100">
                                      <p className="text-xs uppercase tracking-[0.15em] text-slate-500">Total bill</p>
                                      <p className="mt-2 text-lg font-semibold text-slate-900">₵{card.totalBill.toFixed(2)}</p>
                                    </div>
                                    <div className="rounded-2xl bg-emerald-50 p-4">
                                      <p className="text-xs uppercase tracking-[0.15em] text-emerald-700">Collected</p>
                                      <p className="mt-2 text-lg font-semibold text-emerald-900">₵{card.totalCollected.toFixed(2)}</p>
                                    </div>
                                  </div>
                                  <div className="rounded-2xl bg-amber-50 p-4">
                                    <p className="text-xs uppercase tracking-[0.15em] text-amber-700">Outstanding</p>
                                    <p className="mt-2 text-lg font-semibold text-amber-900">₵{card.outstanding.toFixed(2)}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                              </div>
                            </div>
                          </div>
                        </details>
                      ))}
                      </div>
                      </div>
                    </div>
                  </details>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "payments" && (
          <div>
            {/* If viewer (parent/student), show a compact student fee summary above payments */}
            {isViewer && (
              <div className="mb-4 grid gap-3 sm:grid-cols-2">
                {feeStatusAssignments.length === 0 ? (
                  <div className="rounded-2xl bg-white p-4 text-sm text-slate-600">No fee assignments found.</div>
                ) : (
                  feeStatusAssignments.map((a) => {
                    const paidInFull = a.balance <= 0.009;
                    return (
                    <div key={a.id} className="rounded-2xl bg-white p-4">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-slate-900">{a.studentName}</p>
                        {paidInFull ? <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700"><BadgeCheck size={16} aria-hidden="true" />Paid in full</span> : null}
                      </div>
                      <p className="text-xs text-slate-500">{a.className} • {a.academicYear} • {termLabel(a.term)}</p>
                      <div className="mt-3 grid grid-cols-3 gap-2 items-center">
                        <div>
                          <p className="text-xs text-slate-500">Total bill</p>
                          <p className="font-semibold">₵{a.totalBill.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Remaining balance</p>
                          <p className={`font-semibold ${paidInFull ? "text-emerald-700" : "text-amber-700"}`}>₵{a.balance.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Last payment</p>
                          <p className="font-semibold">{a.lastPaymentDate ? new Date(a.lastPaymentDate).toLocaleDateString() : "—"}</p>
                        </div>
                      </div>
                    </div>
                    );
                  })
                )}

                {/* Show active arrears relevant to viewer */}
                <div className="rounded-2xl bg-rose-50 p-4">
                  <p className="text-sm font-medium text-rose-700">Active arrears</p>
                  <p className="mt-2 text-sm text-slate-700">{(activeTermArrears ?? []).filter(ar => assignmentOptions.some(a => a.studentName === ar.studentName)).length} student(s)</p>
                </div>
              </div>
            )}
            <div className="mb-4 hidden md:block rounded-xl bg-slate-50 p-3">
              <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <h3 className="text-sm font-medium text-slate-700">Filters</h3>
                <button
                  type="button"
                  className="text-xs font-medium text-slate-600 underline underline-offset-2"
                  onClick={() => {
                    setPaymentFilterYear("");
                    setPaymentFilterTerm("");
                    setPaymentFilterClass("");
                    setPaymentFilterStudent("");
                  }}
                >
                  Clear filters
                </button>
              </div>

              {renderPaymentFilterFields()}
            </div>

            <div className="mb-4 md:hidden">
              <button
                type="button"
                onClick={() => setPaymentFilterModalOpen(true)}
                className="flex w-full items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-left text-sm font-medium text-slate-700"
              >
                <span>Payment filters</span>
                <span className="rounded-full bg-white px-2 py-1 text-xs text-slate-500">Open</span>
              </button>
            </div>

            <div className="mb-4">
              <form onSubmit={(e) => e.preventDefault()} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Search student or payment..."
                  value={paymentSearch}
                  onChange={(e) => setPaymentSearch(e.target.value)}
                  className="rounded-lg border px-3 py-2 w-full"
                />
              </form>
            </div>

            <div className="mb-4">
              <h3 className="text-sm font-medium text-slate-700 mb-2">Payments</h3>
              {filteredPayments.length === 0 ? (
                <p className="text-sm text-slate-600">No payments found.</p>
              ) : (
                <div className="space-y-3">
                  {studentPaymentGroups.map((group) => {
                    const groupKey = `${group.studentName}-${group.className}-${group.term}-${group.academicYear}`;
                    const isExpanded = expandedStudentKeys[groupKey] ?? false;

                    return (
                      <div key={groupKey} className="rounded-xl bg-slate-50 overflow-hidden">
                        <button
                          type="button"
                          onClick={() => toggleStudentGroup(groupKey)}
                          className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
                          aria-expanded={isExpanded}
                        >
                          <div>
                            <p className="font-semibold text-slate-800">{group.studentName}</p>
                            <p className="text-xs text-slate-500">
                              {group.className} • {termLabel(group.term)} • {group.academicYear}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-slate-700">
                              ₵{group.payments.reduce((sum, p) => sum + p.amount, 0).toFixed(2)}
                            </span>
                            <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-slate-600">
                              {isExpanded ? "Hide" : "Show"}
                            </span>
                          </div>
                        </button>

                        <div
                          className={`grid overflow-hidden transition-[grid-template-rows,opacity] duration-300 ease-in-out motion-reduce:transition-none ${
                            isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                          }`}
                          aria-hidden={!isExpanded}
                          inert={!isExpanded}
                        >
                          <div className="overflow-hidden">
                            <div className="space-y-2 border-t border-slate-100 p-3">
                              {group.payments.map((p) => (
                                <div key={p.id} className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between">
                                  <div>
                                    <p className="font-semibold text-slate-800">{p.studentName}</p>
                                    <p className="text-xs text-slate-500">{termLabel(p.term)} • {p.academicYear}</p>
                                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                                      <span className="rounded-full bg-slate-100 px-2 py-1">
                                        {p.paymentMethod === "mobile_money"
                                          ? "Mobile Money"
                                          : p.paymentMethod === "bank_payment"
                                          ? "Bank Payment"
                                          : p.paymentMethod === "other"
                                          ? "Other"
                                          : "Cash"}
                                      </span>
                                      {p.methodDetails ? <span className="rounded-full bg-slate-100 px-2 py-1">{p.methodDetails}</span> : null}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <div className="text-sm font-semibold text-slate-900">₵{p.amount.toFixed(2)}</div>
                                    <div className="text-xs text-slate-500">{new Date(p.paidAt).toLocaleDateString()}</div>
                                    <button
                                      type="button"
                                      title="View receipt"
                                      className="rounded-lg p-2 hover:bg-sky-100"
                                      onClick={() => {
                                        setViewingReceiptPayment(p);
                                        const matching = assignmentOptions.find((a) => a.id === p.assignmentId);
                                        setReceiptData({
                                          paymentId: p.id,
                                          studentName: p.studentName,
                                          className: p.className,
                                          term: p.term,
                                          academicYear: p.academicYear,
                                          amount: p.amount,
                                          paymentDate: p.paidAt,
                                          paymentCount: p.paymentCount,
                                          paymentMethod: p.paymentMethod ?? "cash",
                                          methodDetails: p.methodDetails ?? null,
                                          mobileMoneyService: p.paymentMethod === "mobile_money" ? (p.methodDetails?.split(" - ")[0] || "MTN") : null,
                                          balance: matching ? matching.balance : 0,
                                        });
                                      }}
                                    >
                                      <Image src="/receipt.svg" alt="Receipt" width={16} height={16} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (!confirm('Delete this payment?')) return;
                                        startTransition(() => {
                                          void (async () => {
                                            const res = await deleteFeePayment(p.id);
                                            if (res.success) {
                                              toast.success('Payment deleted.');
                                              router.refresh();
                                            } else {
                                              toast.error(res.error || 'Delete failed.');
                                            }
                                          })();
                                        });
                                      }}
                                      className="rounded-lg p-2 hover:bg-red-100"
                                      title="Delete"
                                    >
                                      <Image src="/delete.svg" alt="Delete" width={16} height={16} />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {canCollect && (
              <div>
                <h3 className="text-sm font-medium text-slate-700 mb-2">Students (record payment)</h3>
                <div className="space-y-2">
                  {filteredFeeStatusAssignments.length === 0 ? (
                    <p className="text-sm text-slate-600">No students found.</p>
                  ) : (
                      filteredFeeStatusAssignments.map((s) => {
                        const paidInFull = s.balance <= 0.009;
                        return (
                      <div key={s.id} className="flex items-center justify-between rounded-lg border p-3">
                        <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-semibold">{s.studentName}</p>
                              {paidInFull ? <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700"><BadgeCheck size={16} aria-hidden="true" />Paid in full</span> : null}
                            </div>
                          <p className="text-xs text-slate-500">{s.className} — {s.academicYear}</p>
                            <p className={`mt-1 text-xs font-semibold ${paidInFull ? "text-emerald-700" : "text-red-600"}`}>Remaining balance: ₵{s.balance.toFixed(2)}</p>
                        </div>
                          {!paidInFull ? (
                          <div>
                          <button
                            className="rounded bg-sky-600 px-3 py-1 text-white"
                            onClick={() => {
                              setSelectedAssignment(s);
                              setRecordModalOpen(true);
                            }}
                          >
                            Record
                          </button>
                        </div>
                        ) : null}
                      </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {paymentFilterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 md:hidden">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="text-lg font-semibold text-slate-800">Payment filters</h3>
              <button
                type="button"
                onClick={() => setPaymentFilterModalOpen(false)}
                className="rounded-full bg-slate-100 px-2 py-1 text-sm text-slate-600"
              >
                Close
              </button>
            </div>

            <div className="space-y-3">
              {renderPaymentFilterFields()}
            </div>

            <div className="mt-5 flex items-center justify-between gap-3">
              <button
                type="button"
                className="text-sm font-medium text-slate-600 underline underline-offset-2"
                onClick={() => {
                  setPaymentFilterYear("");
                  setPaymentFilterTerm("");
                  setPaymentFilterClass("");
                  setPaymentFilterStudent("");
                }}
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => setPaymentFilterModalOpen(false)}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold">Create fee bill</h3>
            <p className="text-sm text-slate-500 mt-1">Create a new fee schedule for a class.</p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const classId = parseInt(feeClassId, 10);
                const total = parseFloat(feeTotal);
                if (!classId || Number.isNaN(classId)) {
                  toast.error('Select a class.');
                  return;
                }
                if (!feeYear.trim()) {
                  toast.error('Enter academic year.');
                  return;
                }
                if (Number.isNaN(total) || total <= 0) {
                  toast.error('Enter a valid total bill.');
                  return;
                }
                startTransition(() => {
                  void (async () => {
                    const res = await createFeeSchedule({
                      classId,
                      academicYear: feeYear.trim(),
                      term: feeTerm,
                      totalBillCedis: total,
                    });
                    if (res.success) {
                      toast.success('Fee schedule created.');
                      setCreateModalOpen(false);
                      setFeeClassId('');
                      setFeeYear('');
                      setFeeTotal('');
                      router.refresh();
                    } else {
                      toast.error(res.error || 'Create failed.');
                    }
                  })();
                });
              }}
            >
              <div className="space-y-3 mt-4">
                <label className="flex flex-col text-sm">
                  <span className="text-slate-600">Class</span>
                  <select value={feeClassId} onChange={(e) => setFeeClassId(e.target.value)} className="rounded-lg border px-3 py-2">
                    <option value="">Select class</option>
                    {classes.map((c) => (
                      <option key={c.id} value={String(c.id)}>{c.name}</option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col text-sm">
                  <span className="text-slate-600">Academic year</span>
                  <input value={feeYear} onChange={(e) => setFeeYear(e.target.value)} className="rounded-lg border px-3 py-2" />
                </label>
                <label className="flex flex-col text-sm">
                  <span className="text-slate-600">Term</span>
                  <select value={feeTerm} onChange={(e) => setFeeTerm(e.target.value as any)} className="rounded-lg border px-3 py-2">
                    <option value="TERM_1">Term 1</option>
                    <option value="TERM_2">Term 2</option>
                    <option value="TERM_3">Term 3</option>
                  </select>
                </label>
                <label className="flex flex-col text-sm">
                  <span className="text-slate-600">Total bill (₵)</span>
                  <input type="number" step="0.01" value={feeTotal} onChange={(e) => setFeeTotal(e.target.value)} className="rounded-lg border px-3 py-2" />
                </label>
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <button type="button" onClick={() => setCreateModalOpen(false)} className="rounded px-4 py-2">Cancel</button>
                <button type="submit" className="rounded bg-slate-900 px-4 py-2 text-white">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {recordModalOpen && canCollect && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold">Record fee payment</h3>
            <p className="text-sm text-slate-500 mt-1">Search and select a student or enter payment details for the selected student.</p>
            <div className="mt-4">
              <input
                type="text"
                placeholder="Search student..."
                value={paymentSearch}
                onChange={(e) => setPaymentSearch(e.target.value)}
                className="w-full rounded-lg border px-3 py-2"
              />
              <div className="mt-3 space-y-2 max-h-40 overflow-y-auto">
                {filteredStudents.map((s) => (
                  <div key={s.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="font-semibold">{s.studentName}</p>
                      <p className="text-xs text-slate-500">{s.className}</p>
                      <p className="mt-1 text-xs font-semibold text-red-600">Remaining balance: ₵{s.balance.toFixed(2)}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        className="rounded bg-sky-600 px-3 py-1 text-white"
                        onClick={() => setSelectedAssignment(s)}
                      >
                        Select
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {selectedAssignment && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const amt = parseFloat(payAmount);
                    if (Number.isNaN(amt) || amt <= 0) {
                      toast.error('Enter a valid payment amount.');
                      return;
                    }
                    const d = new Date(payDate + 'T12:00:00');
                    if (Number.isNaN(d.getTime())) {
                      toast.error('Invalid payment date.');
                      return;
                    }
                    if (paymentMethod === 'mobile_money' && !methodDetails.trim()) {
                      toast.error('Enter the sender name for mobile money.');
                      return;
                    }
                    if (paymentMethod === 'bank_payment' && !methodDetails.trim()) {
                      toast.error('Enter the bank transaction ID.');
                      return;
                    }
                    if (paymentMethod === 'other' && !methodDetails.trim()) {
                      toast.error('Enter the payment method name.');
                      return;
                    }
                    const fullMethodDetails = paymentMethod === 'mobile_money' ? `${mobileMoneyService} Momo - ${methodDetails}` : methodDetails;
                    const receiptPayload: Omit<ReceiptData, "paymentId"> = {
                      studentName: selectedAssignment.studentName,
                      className: selectedAssignment.className,
                      term: selectedAssignment.term,
                      academicYear: selectedAssignment.academicYear,
                      amount: amt,
                      paymentDate: payDate,
                      paymentCount: selectedAssignment.paymentCount + 1,
                      paymentMethod,
                      methodDetails: fullMethodDetails,
                      mobileMoneyService: paymentMethod === 'mobile_money' ? mobileMoneyService : null,
                      balance: Math.max(0, selectedAssignment.balance - amt),
                    };
                    startTransition(() => {
                      void (async () => {
                        const res = await recordFeePayment({
                          studentFeeAssignmentId: selectedAssignment.id,
                          amountCedis: amt,
                          paidAt: d,
                          paymentMethod,
                          methodDetails: fullMethodDetails,
                        });
                        if (res.success) {
                          toast.success('Payment recorded.');
                          setReceiptData({ ...receiptPayload, paymentId: res.paymentId ?? Date.now() });
                          setReceiptModalOpen(true);
                          setRecordModalOpen(false);
                          setSelectedAssignment(null);
                          setPayAmount('');
                          setMethodDetails('');
                          setPaymentMethod('cash');
                          setMobileMoneyService('MTN');
                          router.refresh();
                        } else {
                          toast.error(res.error || 'Record failed.');
                        }
                      })();
                    });
                  }}
                  className="mt-4 space-y-3"
                >
                  <div>
                    <p className="text-sm font-medium">Recording for: {selectedAssignment.studentName}</p>
                    <p className="text-xs text-slate-500">{selectedAssignment.className} — {selectedAssignment.academicYear}</p>
                    <p className="mt-1 text-sm font-semibold text-red-600">Balance: ₵{selectedAssignment.balance.toFixed(2)}</p>
                  </div>
                  <div className="grid gap-2">
                    <input value={payAmount} onChange={(e) => setPayAmount(e.target.value)} placeholder="Amount (₵)" className="rounded-lg border px-3 py-2" />
                    <input type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} className="rounded-lg border px-3 py-2" />
                    <select
                      value={paymentMethod}
                      onChange={(e) => {
                        setPaymentMethod(e.target.value);
                        setMethodDetails("");
                      }}
                      className="rounded-lg border px-3 py-2"
                    >
                      <option value="cash">Cash</option>
                      <option value="mobile_money">Mobile Money</option>
                      <option value="bank_payment">Bank</option>
                      <option value="other">Other</option>
                    </select>
                    {paymentMethod === "mobile_money" && (
                      <>
                        <select value={mobileMoneyService} onChange={(e) => setMobileMoneyService(e.target.value)} className="rounded-lg border px-3 py-2">
                          <option value="MTN">MTN Momo</option>
                          <option value="Telecel">Telecel</option>
                          <option value="AirtelTigo">AirtelTigo</option>
                        </select>
                        <input value={methodDetails} onChange={(e) => setMethodDetails(e.target.value)} placeholder="Sender's name" className="rounded-lg border px-3 py-2" />
                      </>
                    )}
                    {paymentMethod === "bank_payment" && (
                      <input value={methodDetails} onChange={(e) => setMethodDetails(e.target.value)} placeholder="Transaction ID" className="rounded-lg border px-3 py-2" />
                    )}
                    {paymentMethod === "other" && (
                      <input value={methodDetails} onChange={(e) => setMethodDetails(e.target.value)} placeholder="Specify payment method" className="rounded-lg border px-3 py-2" />
                    )}
                  </div>
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => { setSelectedAssignment(null); }} className="rounded px-4 py-2">Cancel</button>
                    <button type="submit" className="rounded bg-emerald-600 px-4 py-2 text-white">Record payment & receipt</button>
                  </div>
                </form>
              )}
            </div>
            <div className="mt-6 flex justify-end">
              <button onClick={() => { setRecordModalOpen(false); setSelectedAssignment(null); }} className="rounded px-4 py-2">Close</button>
            </div>
          </div>
        </div>
      )}

      {receiptModalOpen && receiptData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <FeePaymentReceipt
            school={schoolDetails}
            receipt={receiptData}
            onClose={() => setReceiptModalOpen(false)}
          />
        </div>
      )}

      {viewingReceiptPayment && receiptData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <FeePaymentReceipt
            school={schoolDetails}
            receipt={receiptData}
            onClose={() => { setViewingReceiptPayment(null); setReceiptData(null); }}
          />
        </div>
      )}
    </div>
  );
}
