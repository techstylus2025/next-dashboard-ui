"use client";

import Image from "next/image";
import { PlusCircle } from "lucide-react";
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
  paymentMethod?: string | null;
  methodDetails?: string | null;
  studentId?: number;
  parentId?: string | null;
};
type ReceiptData = {
  studentName: string;
  className: string;
  term: string;
  academicYear: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  methodDetails?: string | null;
  mobileMoneyService?: string | null;
  balance?: number;
};
type FeeSummary = {
  totalFeesCollected: number;
  totalFeesOutstanding: number;
  feeAssignments: number;
  activeFeeSchedules: number;
};


export default function FeesManagement({
  role,
  classes,
  classFeeCards,
  assignmentOptions,
  payments,
  canAdmin,
  canCollect,
  summary,
}: {
  role: string | undefined;
  classes: ClassOption[];
  classFeeCards: ClassFeeCard[];
  assignmentOptions: AssignmentOption[];
  payments: PaymentRow[];
  canAdmin: boolean;
  canCollect: boolean;
  summary: FeeSummary;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [activeTab, setActiveTab] = useState<"overview" | "feeBills" | "payments">("overview");
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
    <div className="w-full flex flex-col gap-8 p-4 md:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Fee management</h1>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            {canAdmin
              ? "Create class fee bills, record collections, and manage payment entries."
              : role === "parent"
              ? "Fee payments recorded for your children."
              : role === "student"
              ? "Your school fee payment history."
              : "Class fee overview (read-only)."}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex w-full items-center justify-between gap-1 rounded-full bg-slate-100 p-1 sm:w-auto sm:justify-start sm:gap-2">
          {[
            { key: "overview", label: "Overview" },
            { key: "feeBills", label: "Fee schedules" },
            { key: "payments", label: "Payments" },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key as any)}
              className={`rounded-full px-2 py-1.5 text-[11px] font-medium transition sm:px-4 sm:py-2 sm:text-sm ${
                activeTab === tab.key ? "bg-slate-900 text-white" : "text-slate-700 hover:text-slate-900"
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
              className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-white transition hover:bg-slate-800"
            >
              <PlusCircle size={16} strokeWidth={2.5} />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canCollect && activeTab === "payments" && (
            <button
              type="button"
              onClick={() => setRecordModalOpen(true)}
              className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            >
              Record fee payment
            </button>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-white/60 bg-white/90 backdrop-blur-sm p-6 shadow-sm">
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-slate-100 p-5 shadow-sm ring-1 ring-slate-100">
                <div className="inline-flex rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-white">Collected</div>
                <p className="mt-4 text-sm text-slate-500">Total fees collected</p>
                <p className="mt-3 text-xl font-semibold text-slate-900">₵{summary.totalFeesCollected.toFixed(2)}</p>
              </div>
              <div className="rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-amber-100 p-5 shadow-sm ring-1 ring-amber-100">
                <div className="inline-flex rounded-full bg-amber-600 px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-white">Outstanding</div>
                <p className="mt-4 text-sm text-slate-600">Outstanding balance</p>
                <p className="mt-3 text-xl font-semibold text-slate-900">₵{summary.totalFeesOutstanding.toFixed(2)}</p>
              </div>
              <div className="rounded-3xl border border-sky-200 bg-gradient-to-br from-sky-50 via-white to-sky-100 p-5 shadow-sm ring-1 ring-sky-100">
                <div className="inline-flex rounded-full bg-sky-600 px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-white">Schedules</div>
                <p className="mt-4 text-sm text-slate-600">Active fee schedules</p>
                <p className="mt-3 text-xl font-semibold text-slate-900">{summary.activeFeeSchedules}</p>
              </div>
              <div className="rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-emerald-100 p-5 shadow-sm ring-1 ring-emerald-100">
                <div className="inline-flex rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-white">Assignments</div>
                <p className="mt-4 text-sm text-slate-600">Fee assignments</p>
                <p className="mt-3 text-xl font-semibold text-slate-900">{summary.feeAssignments}</p>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm ring-1 ring-slate-100">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-900">Recent fee schedules</p>
                  <p className="text-sm text-slate-500">Review the latest class fee bills and outstanding balances.</p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                  {classFeeCards.length} schedules
                </span>
              </div>

              <div className="mt-4 grid gap-3 lg:grid-cols-2">
                {classFeeCards.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
                    No fee schedules created yet.
                  </div>
                ) : (
                  classFeeCards.slice(0, 4).map((card) => (
                    <div key={card.id} className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-slate-100 p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{card.className}</p>
                          <p className="text-xs text-slate-500">{termLabel(card.term)} • {card.academicYear}</p>
                        </div>
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
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "feeBills" && (
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
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {classFeeCards.map((card) => (
                  <div key={card.id} className="rounded-3xl bg-gradient-to-br from-white via-slate-50 to-slate-100 p-5 transition hover:-translate-y-1">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{card.className}</p>
                        <p className="text-xs text-slate-500">{termLabel(card.term)} • {card.academicYear}</p>
                      </div>
                      <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold uppercase tracking-[0.1em] text-white">
                        {card.studentCount} students
                      </span>
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
            )}
          </div>
        )}

        {activeTab === "payments" && (
          <div>
            <div className="mb-4 hidden md:block rounded-xl border border-slate-200 bg-slate-50 p-3">
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
                className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm font-medium text-slate-700"
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
                    const isExpanded = expandedStudentKeys[groupKey] ?? true;

                    return (
                      <div key={groupKey} className="rounded-xl border border-slate-200 bg-slate-50 overflow-hidden">
                        <button
                          type="button"
                          onClick={() => toggleStudentGroup(groupKey)}
                          className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
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
                          className={`grid overflow-hidden transition-all duration-300 ease-in-out ${
                            isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                          }`}
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
                                          studentName: p.studentName,
                                          className: p.className,
                                          term: p.term,
                                          academicYear: p.academicYear,
                                          amount: p.amount,
                                          paymentDate: p.paidAt,
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

            <div>
              <h3 className="text-sm font-medium text-slate-700 mb-2">Students (record payment)</h3>
              <div className="space-y-2">
                {filteredStudents.length === 0 ? (
                  <p className="text-sm text-slate-600">No students found.</p>
                ) : (
                  filteredStudents.map((s) => (
                    <div key={s.id} className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <p className="font-semibold">{s.studentName}</p>
                        <p className="text-xs text-slate-500">{s.className} — {s.academicYear}</p>
                      </div>
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
                    </div>
                  ))
                )}
              </div>
            </div>
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

      {recordModalOpen && (
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
                    const receiptPayload: ReceiptData = {
                      studentName: selectedAssignment.studentName,
                      className: selectedAssignment.className,
                      term: selectedAssignment.term,
                      academicYear: selectedAssignment.academicYear,
                      amount: amt,
                      paymentDate: payDate,
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
                          setReceiptData(receiptPayload);
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
          <div className="fee-receipt-print w-full max-w-2xl rounded-2xl bg-white p-8 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Image src="/logo.png" alt={process.env.NEXT_PUBLIC_SCHOOL_NAME || 'School'} width={32} height={32} />
                <h2 className="text-2xl font-bold text-slate-800">{process.env.NEXT_PUBLIC_SCHOOL_NAME || 'School Name'}</h2>
              </div>
              <h3 className="text-lg font-semibold text-slate-600">PAYMENT RECEIPT</h3>
            </div>

            <div className="mb-6 border-y border-slate-200 py-4">
              <p className="text-center text-sm text-slate-600">Fees Payment Receipt</p>
              <p className="mt-1 text-center text-xs text-slate-500">Receipt ID: {new Date().getTime()}</p>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-slate-500">STUDENT NAME</p>
                  <p className="font-semibold text-slate-800">{receiptData.studentName}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">CLASS</p>
                  <p className="font-semibold text-slate-800">{receiptData.className}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">TERM</p>
                  <p className="font-semibold text-slate-800">{termLabel(receiptData.term)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">ACADEMIC YEAR</p>
                  <p className="font-semibold text-slate-800">{receiptData.academicYear}</p>
                </div>
              </div>

              <div className="border-y border-slate-200 py-4">
                <div className="mb-2 flex justify-between">
                  <span className="text-slate-600">Amount paid:</span>
                  <span className="font-bold text-slate-800">₵{receiptData.amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Payment date:</span>
                  <span className="text-slate-800">{new Date(receiptData.paymentDate).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="mt-3">
                <div className="flex justify-between">
                  <span className="text-slate-600">Remaining balance:</span>
                  <span className={`font-bold ${receiptData.balance && receiptData.balance > 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                    ₵{(receiptData.balance ?? 0).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold text-slate-800">PAYMENT METHOD</p>
                <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
                  <p className="font-medium capitalize">
                    {receiptData.paymentMethod === 'mobile_money'
                      ? `${receiptData.mobileMoneyService || 'MTN'} Mobile Money`
                      : receiptData.paymentMethod === 'bank_payment'
                      ? 'Bank Payment'
                      : receiptData.paymentMethod.charAt(0).toUpperCase() + receiptData.paymentMethod.slice(1)}
                  </p>
                  {receiptData.methodDetails ? <p className="mt-1 text-xs text-slate-600">{receiptData.methodDetails}</p> : null}
                </div>
              </div>

              <div className="border-t border-slate-200 pt-4 text-center">
                <p className="text-xs text-slate-500">Thank you for your payment!</p>
                <p className="mt-1 text-xs text-slate-500">Please keep this receipt for your records.</p>
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button type="button" onClick={() => setReceiptModalOpen(false)} className="rounded-lg px-4 py-2 text-sm text-slate-600 hover:bg-slate-100">
                Close
              </button>
              <button type="button" onClick={() => window.print()} className="rounded-lg bg-sky-600 px-6 py-2 text-sm font-medium text-white hover:bg-sky-700">
                Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {viewingReceiptPayment && receiptData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="fee-receipt-print w-full max-w-2xl rounded-2xl bg-white p-8 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Image src="/logo.png" alt="TechStylus" width={32} height={32} />
                <h2 className="text-2xl font-bold text-slate-800">TechStylus</h2>
              </div>
              <h3 className="text-lg font-semibold text-slate-600">PAYMENT RECEIPT</h3>
            </div>

            <div className="mb-6 border-y border-slate-200 py-4">
              <p className="text-center text-sm text-slate-600">School Management System</p>
              <p className="mt-1 text-center text-xs text-slate-500">Receipt ID: {viewingReceiptPayment.id}</p>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-slate-500">STUDENT NAME</p>
                  <p className="font-semibold text-slate-800">{receiptData.studentName}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">CLASS</p>
                  <p className="font-semibold text-slate-800">{receiptData.className}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">TERM</p>
                  <p className="font-semibold text-slate-800">{termLabel(receiptData.term)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">ACADEMIC YEAR</p>
                  <p className="font-semibold text-slate-800">{receiptData.academicYear}</p>
                </div>
              </div>

              <div className="border-y border-slate-200 py-4">
                <div className="mb-2 flex justify-between">
                  <span className="text-slate-600">Amount paid:</span>
                  <span className="font-bold text-slate-800">₵{receiptData.amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Payment date:</span>
                  <span className="text-slate-800">{new Date(receiptData.paymentDate).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold text-slate-800">PAYMENT METHOD</p>
                <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
                  <p className="font-medium capitalize">
                    {receiptData.paymentMethod === 'mobile_money'
                      ? `${receiptData.mobileMoneyService || 'MTN'} Mobile Money`
                      : receiptData.paymentMethod === 'bank_payment'
                      ? 'Bank Payment'
                      : receiptData.paymentMethod.charAt(0).toUpperCase() + receiptData.paymentMethod.slice(1)}
                  </p>
                  {receiptData.methodDetails ? <p className="mt-1 text-xs text-slate-600">{receiptData.methodDetails}</p> : null}
                </div>
              </div>

              <div className="border-t border-slate-200 pt-4 text-center">
                <p className="text-xs text-slate-500">Thank you for your payment!</p>
                <p className="mt-1 text-xs text-slate-500">Please keep this receipt for your records.</p>
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button type="button" onClick={() => { setViewingReceiptPayment(null); setReceiptData(null); }} className="rounded-lg px-4 py-2 text-sm text-slate-600 hover:bg-slate-100">
                Close
              </button>
              <button type="button" onClick={() => window.print()} className="rounded-lg bg-sky-600 px-6 py-2 text-sm font-medium text-white hover:bg-sky-700">
                Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
