"use client";
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = FeesManagement;
var image_1 = require("next/image");
var navigation_1 = require("next/navigation");
var react_1 = require("react");
var react_toastify_1 = require("react-toastify");
var feeActions_1 = require("@/lib/feeActions");
function termLabel(term) {
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
function FeesManagement(_a) {
    var _this = this;
    var role = _a.role, classes = _a.classes, classFeeCards = _a.classFeeCards, assignmentOptions = _a.assignmentOptions, payments = _a.payments, canAdmin = _a.canAdmin, canCollect = _a.canCollect;
    var router = (0, navigation_1.useRouter)();
    var _b = (0, react_1.useTransition)(), pending = _b[0], startTransition = _b[1];
    var _c = (0, react_1.useState)(""), feeClassId = _c[0], setFeeClassId = _c[1];
    var _d = (0, react_1.useState)(""), feeTotal = _d[0], setFeeTotal = _d[1];
    var _e = (0, react_1.useState)("TERM_1"), feeTerm = _e[0], setFeeTerm = _e[1];
    var _f = (0, react_1.useState)(""), feeYear = _f[0], setFeeYear = _f[1];
    var _g = (0, react_1.useState)(""), assignId = _g[0], setAssignId = _g[1];
    var _h = (0, react_1.useState)(""), payAmount = _h[0], setPayAmount = _h[1];
    var _j = (0, react_1.useState)(function () {
        return new Date().toISOString().slice(0, 10);
    }), payDate = _j[0], setPayDate = _j[1];
    var _k = (0, react_1.useState)("cash"), paymentMethod = _k[0], setPaymentMethod = _k[1];
    var _l = (0, react_1.useState)("MTN"), mobileMoneyService = _l[0], setMobileMoneyService = _l[1];
    var _m = (0, react_1.useState)(""), methodDetails = _m[0], setMethodDetails = _m[1];
    var _o = (0, react_1.useState)(false), receiptModalOpen = _o[0], setReceiptModalOpen = _o[1];
    var _p = (0, react_1.useState)(null), receiptData = _p[0], setReceiptData = _p[1];
    var _q = (0, react_1.useState)(new Set()), expandedGroups = _q[0], setExpandedGroups = _q[1];
    var _r = (0, react_1.useState)(null), viewingReceiptPayment = _r[0], setViewingReceiptPayment = _r[1];
    var selectedAssignment = (0, react_1.useMemo)(function () { return assignmentOptions.find(function (a) { return String(a.id) === assignId; }); }, [assignmentOptions, assignId]);
    var newBalancePreview = (0, react_1.useMemo)(function () {
        if (!selectedAssignment)
            return null;
        var amt = parseFloat(payAmount);
        if (Number.isNaN(amt) || amt <= 0)
            return selectedAssignment.balance;
        return Math.max(0, selectedAssignment.balance - amt);
    }, [selectedAssignment, payAmount]);
    var _s = (0, react_1.useState)(false), editOpen = _s[0], setEditOpen = _s[1];
    var _t = (0, react_1.useState)(null), editPayment = _t[0], setEditPayment = _t[1];
    var _u = (0, react_1.useState)(""), editAmount = _u[0], setEditAmount = _u[1];
    var _v = (0, react_1.useState)(""), editDate = _v[0], setEditDate = _v[1];
    var _w = (0, react_1.useState)(false), cardFilterOpen = _w[0], setCardFilterOpen = _w[1];
    var _x = (0, react_1.useState)(""), cardFilterYear = _x[0], setCardFilterYear = _x[1];
    var _y = (0, react_1.useState)(""), cardFilterTerm = _y[0], setCardFilterTerm = _y[1];
    var _z = (0, react_1.useState)(""), paymentSearch = _z[0], setPaymentSearch = _z[1];
    var _0 = (0, react_1.useState)(false), paymentFilterOpen = _0[0], setPaymentFilterOpen = _0[1];
    var _1 = (0, react_1.useState)(""), paymentDateFrom = _1[0], setPaymentDateFrom = _1[1];
    var _2 = (0, react_1.useState)(""), paymentDateTo = _2[0], setPaymentDateTo = _2[1];
    var _3 = (0, react_1.useState)(""), paymentFilterClass = _3[0], setPaymentFilterClass = _3[1];
    var _4 = (0, react_1.useState)(""), paymentFilterTerm = _4[0], setPaymentFilterTerm = _4[1];
    var _5 = (0, react_1.useState)(""), paymentFilterYear = _5[0], setPaymentFilterYear = _5[1];
    var cardYears = (0, react_1.useMemo)(function () {
        return __spreadArray([], new Set(classFeeCards.map(function (c) { return c.academicYear; })), true).sort(function (a, b) {
            return b.localeCompare(a);
        });
    }, [classFeeCards]);
    var summaryCards = [
        {
            label: "Fees collected",
            value: "\u20B5".concat(summary.totalFeesCollected.toFixed(2)),
            detail: "".concat(summary.activeFeeSchedules, " active schedules"),
            cardClass: "bg-sky-50 text-sky-900",
            badgeClass: "bg-sky-100 text-sky-800",
        },
        {
            label: "Fees outstanding",
            value: "\u20B5".concat(summary.totalFeesOutstanding.toFixed(2)),
            detail: "".concat(summary.feeAssignments, " assignments pending"),
            cardClass: "bg-amber-50 text-amber-900",
            badgeClass: "bg-amber-100 text-amber-800",
        },
        {
            label: "Fee assignments",
            value: summary.feeAssignments.toString(),
            detail: "".concat(summary.activeFeeSchedules, " fee schedules"),
            cardClass: "bg-emerald-50 text-emerald-900",
            badgeClass: "bg-emerald-100 text-emerald-800",
        },
        {
            label: "Active schedules",
            value: summary.activeFeeSchedules.toString(),
            detail: "".concat(summary.feeAssignments, " student assignments"),
            cardClass: "bg-violet-50 text-violet-900",
            badgeClass: "bg-violet-100 text-violet-800",
        },
    ];
    var filteredClassFeeCards = (0, react_1.useMemo)(function () {
        return classFeeCards.filter(function (card) {
            if (cardFilterYear && card.academicYear !== cardFilterYear)
                return false;
            if (cardFilterTerm && card.term !== cardFilterTerm)
                return false;
            return true;
        });
    }, [classFeeCards, cardFilterYear, cardFilterTerm]);
    var paymentClasses = (0, react_1.useMemo)(function () {
        return __spreadArray([], new Set(payments.map(function (p) { return p.className; })), true).sort(function (a, b) {
            return a.localeCompare(b);
        });
    }, [payments]);
    var paymentYears = (0, react_1.useMemo)(function () {
        return __spreadArray([], new Set(payments.map(function (p) { return p.academicYear; })), true).sort(function (a, b) {
            return b.localeCompare(a);
        });
    }, [payments]);
    var filteredPayments = (0, react_1.useMemo)(function () {
        var q = paymentSearch.trim().toLowerCase();
        return payments.filter(function (row) {
            if (q && !row.studentName.toLowerCase().includes(q))
                return false;
            if (paymentFilterClass && row.className !== paymentFilterClass)
                return false;
            if (paymentFilterTerm && row.term !== paymentFilterTerm)
                return false;
            if (paymentFilterYear && row.academicYear !== paymentFilterYear)
                return false;
            if (paymentDateFrom) {
                var from = new Date(paymentDateFrom + "T00:00:00");
                if (new Date(row.paidAt) < from)
                    return false;
            }
            if (paymentDateTo) {
                var to = new Date(paymentDateTo + "T23:59:59");
                if (new Date(row.paidAt) > to)
                    return false;
            }
            return true;
        });
    }, [
        payments,
        paymentSearch,
        paymentFilterClass,
        paymentFilterTerm,
        paymentFilterYear,
        paymentDateFrom,
        paymentDateTo,
    ]);
    // Group payments by student name, class, term, and academic year
    var groupedPayments = (0, react_1.useMemo)(function () {
        var groups = {};
        filteredPayments.forEach(function (payment) {
            var groupKey = "".concat(payment.studentName, "|").concat(payment.className, "|").concat(payment.term, "|").concat(payment.academicYear);
            if (!groups[groupKey]) {
                groups[groupKey] = [];
            }
            groups[groupKey].push(payment);
        });
        // Convert to array and sort by most recent payment date
        return Object.entries(groups)
            .map(function (_a) {
            var key = _a[0], payments = _a[1];
            var latestPayment = payments.reduce(function (latest, current) {
                return new Date(current.paidAt) > new Date(latest.paidAt) ? current : latest;
            });
            return {
                groupKey: key,
                studentName: payments[0].studentName,
                className: payments[0].className,
                term: payments[0].term,
                academicYear: payments[0].academicYear,
                payments: payments.sort(function (a, b) { return new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime(); }),
                totalAmount: payments.reduce(function (sum, p) { return sum + p.amount; }, 0),
                paymentCount: payments.length,
                latestPaymentDate: latestPayment.paidAt,
            };
        })
            .sort(function (a, b) {
            return new Date(b.latestPaymentDate).getTime() -
                new Date(a.latestPaymentDate).getTime();
        });
    }, [filteredPayments]);
    var toggleGroup = function (groupKey) {
        setExpandedGroups(function (prev) {
            var next = new Set(prev);
            if (next.has(groupKey)) {
                next.delete(groupKey);
            }
            else {
                next.add(groupKey);
            }
            return next;
        });
    };
    var hasCardFilters = Boolean(cardFilterYear || cardFilterTerm);
    var hasPaymentFilters = Boolean(paymentDateFrom ||
        paymentDateTo ||
        paymentFilterClass ||
        paymentFilterTerm ||
        paymentFilterYear);
    var clearCardFilters = function () {
        setCardFilterYear("");
        setCardFilterTerm("");
    };
    var clearPaymentFilters = function () {
        setPaymentDateFrom("");
        setPaymentDateTo("");
        setPaymentFilterClass("");
        setPaymentFilterTerm("");
        setPaymentFilterYear("");
    };
    var openEdit = function (row) {
        setEditPayment(row);
        setEditAmount(String(row.amount));
        setEditDate(row.paidAt.slice(0, 10));
        setEditOpen(true);
    };
    var handleCreateSchedule = function () {
        var classId = parseInt(feeClassId, 10);
        var total = parseFloat(feeTotal);
        if (!feeClassId || Number.isNaN(classId)) {
            react_toastify_1.toast.error("Select a class.");
            return;
        }
        if (!feeYear.trim()) {
            react_toastify_1.toast.error("Enter academic year.");
            return;
        }
        if (Number.isNaN(total) || total <= 0) {
            react_toastify_1.toast.error("Enter a valid total bill in cedis.");
            return;
        }
        startTransition(function () { return __awaiter(_this, void 0, void 0, function () {
            var res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, feeActions_1.createFeeSchedule)({
                            classId: classId,
                            academicYear: feeYear.trim(),
                            term: feeTerm,
                            totalBillCedis: total,
                        })];
                    case 1:
                        res = _a.sent();
                        if (res.success) {
                            react_toastify_1.toast.success("Fee schedule created and assigned to all students in the class.");
                            setFeeTotal("");
                            router.refresh();
                        }
                        else {
                            react_toastify_1.toast.error(res.error || "Failed to create schedule.");
                        }
                        return [2 /*return*/];
                }
            });
        }); });
    };
    var validatePaymentDetails = function () {
        if (paymentMethod === "mobile_money") {
            if (!methodDetails.trim())
                return "Sender name is required for Mobile Money payments.";
        }
        else if (paymentMethod === "bank_payment") {
            if (!methodDetails.trim())
                return "Transaction ID is required for Bank payments.";
        }
        else if (paymentMethod === "other") {
            if (!methodDetails.trim())
                return "Payment method name is required.";
        }
        return null;
    };
    var handleRecordPayment = function () {
        if (!assignId) {
            react_toastify_1.toast.error("Select a student fee record.");
            return;
        }
        var amt = parseFloat(payAmount);
        if (Number.isNaN(amt) || amt <= 0) {
            react_toastify_1.toast.error("Enter a valid payment amount.");
            return;
        }
        if (!selectedAssignment)
            return;
        if (amt > selectedAssignment.balance + 0.009) {
            react_toastify_1.toast.error("Amount exceeds outstanding balance.");
            return;
        }
        var d = new Date(payDate + "T12:00:00");
        if (Number.isNaN(d.getTime())) {
            react_toastify_1.toast.error("Invalid payment date.");
            return;
        }
        var detailsError = validatePaymentDetails();
        if (detailsError) {
            react_toastify_1.toast.error(detailsError);
            return;
        }
        var fullMethodDetails = paymentMethod === "mobile_money"
            ? "".concat(mobileMoneyService, " Momo - ").concat(methodDetails)
            : methodDetails;
        // Prepare receipt data
        setReceiptData({
            studentName: selectedAssignment.studentName,
            className: selectedAssignment.className,
            term: selectedAssignment.term,
            academicYear: selectedAssignment.academicYear,
            amount: amt,
            paymentDate: payDate,
            paymentMethod: paymentMethod,
            methodDetails: fullMethodDetails,
            mobileMoneyService: paymentMethod === "mobile_money" ? mobileMoneyService : null,
        });
        setReceiptModalOpen(true);
        startTransition(function () { return __awaiter(_this, void 0, void 0, function () {
            var res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, feeActions_1.recordFeePayment)({
                            studentFeeAssignmentId: parseInt(assignId, 10),
                            amountCedis: amt,
                            paidAt: d,
                            paymentMethod: paymentMethod,
                            methodDetails: fullMethodDetails,
                        })];
                    case 1:
                        res = _a.sent();
                        if (res.success) {
                            react_toastify_1.toast.success("Payment recorded.");
                            setPayAmount("");
                            setAssignId("");
                            setMethodDetails("");
                            setPaymentMethod("cash");
                            router.refresh();
                        }
                        else {
                            react_toastify_1.toast.error(res.error || "Failed to record payment.");
                            setReceiptModalOpen(false);
                        }
                        return [2 /*return*/];
                }
            });
        }); });
    };
    var handleUpdatePayment = function () {
        if (!editPayment)
            return;
        var amt = parseFloat(editAmount);
        if (Number.isNaN(amt) || amt <= 0) {
            react_toastify_1.toast.error("Enter a valid amount.");
            return;
        }
        var d = new Date(editDate + "T12:00:00");
        if (Number.isNaN(d.getTime())) {
            react_toastify_1.toast.error("Invalid date.");
            return;
        }
        startTransition(function () { return __awaiter(_this, void 0, void 0, function () {
            var res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, feeActions_1.updateFeePayment)({
                            id: editPayment.id,
                            amountCedis: amt,
                            paidAt: d,
                        })];
                    case 1:
                        res = _a.sent();
                        if (res.success) {
                            react_toastify_1.toast.success("Payment updated.");
                            setEditOpen(false);
                            setEditPayment(null);
                            router.refresh();
                        }
                        else {
                            react_toastify_1.toast.error(res.error || "Update failed.");
                        }
                        return [2 /*return*/];
                }
            });
        }); });
    };
    var handleDeletePayment = function (id) {
        if (!confirm("Delete this payment record? Balances will update."))
            return;
        startTransition(function () { return __awaiter(_this, void 0, void 0, function () {
            var res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, feeActions_1.deleteFeePayment)(id)];
                    case 1:
                        res = _a.sent();
                        if (res.success) {
                            react_toastify_1.toast.success("Payment deleted.");
                            router.refresh();
                        }
                        else {
                            react_toastify_1.toast.error(res.error || "Delete failed.");
                        }
                        return [2 /*return*/];
                }
            });
        }); });
    };
    return (<div className="flex flex-col gap-8 p-4 md:p-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">Fee management</h1>
        <p className="text-sm text-slate-500 mt-1">
          {canAdmin
            ? "Create class fee bills, record collections, and manage payment entries."
            : role === "parent"
                ? "Fee payments recorded for your children."
                : role === "student"
                    ? "Your school fee payment history."
                    : "Class fee overview (read-only)."}
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map(function (card) { return (<div key={card.label} className={"rounded-3xl border border-white/80 p-5 shadow-sm ".concat(card.cardClass)}>
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                {card.label}
              </p>
              <span className={"rounded-full px-2 py-1 text-[11px] font-semibold ".concat(card.badgeClass)}>
                {card.label === "Active schedules" ? "Status" : "Summary"}
              </span>
            </div>
            <p className="mt-4 text-3xl font-semibold leading-none">{card.value}</p>
            <p className="mt-2 text-sm text-slate-600">{card.detail}</p>
          </div>); })}
      </section>

      {classFeeCards.length > 0 && (<section>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
            <h2 className="text-lg font-medium text-slate-800">
              Fees by class & term
            </h2>
            <div className="relative">
              <button type="button" onClick={function () { return setCardFilterOpen(function (o) { return !o; }); }} className={"flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ".concat(hasCardFilters
                ? "bg-sky-600 text-white shadow-md shadow-sky-600/25"
                : "bg-white/90 text-slate-700 ring-1 ring-slate-200 hover:bg-white")}>
                <image_1.default src="/filter.svg" alt="" width={14} height={14}/>
                Filter
                {hasCardFilters && (<span className="rounded-full bg-white/25 px-1.5 text-xs">
                    on
                  </span>)}
              </button>
              {cardFilterOpen && (<div className="absolute right-0 z-20 mt-2 w-72 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">
                    Filter fee cards
                  </p>
                  <div className="space-y-3">
                    <label className="flex flex-col gap-1 text-sm">
                      <span className="text-slate-600">Academic year</span>
                      <select className="rounded-lg border border-slate-200 px-3 py-2" value={cardFilterYear} onChange={function (e) { return setCardFilterYear(e.target.value); }}>
                        <option value="">All years</option>
                        {cardYears.map(function (y) { return (<option key={y} value={y}>
                            {y}
                          </option>); })}
                      </select>
                    </label>
                    <label className="flex flex-col gap-1 text-sm">
                      <span className="text-slate-600">Term</span>
                      <select className="rounded-lg border border-slate-200 px-3 py-2" value={cardFilterTerm} onChange={function (e) { return setCardFilterTerm(e.target.value); }}>
                        <option value="">All terms</option>
                        <option value="TERM_1">Term 1</option>
                        <option value="TERM_2">Term 2</option>
                        <option value="TERM_3">Term 3</option>
                      </select>
                    </label>
                  </div>
                  <div className="mt-4 flex justify-between gap-2">
                    <button type="button" onClick={clearCardFilters} className="text-xs text-slate-500 hover:text-slate-800">
                      Clear
                    </button>
                    <button type="button" onClick={function () { return setCardFilterOpen(false); }} className="rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-medium text-white">
                      Apply
                    </button>
                  </div>
                </div>)}
            </div>
          </div>
          {filteredClassFeeCards.length === 0 ? (<p className="text-sm text-slate-600 rounded-xl bg-white/70 px-4 py-6 text-center">
              No fee cards match the selected filters.
            </p>) : (<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredClassFeeCards.map(function (card, index) {
                    var bgClasses = [
                        "bg-sky-50",
                        "bg-emerald-50",
                        "bg-amber-50",
                        "bg-violet-50",
                    ];
                    return (<div key={card.id} className={"rounded-2xl border border-white/70 p-5 shadow-sm ".concat(bgClasses[index % bgClasses.length])}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-sky-600">
                      {termLabel(card.term)}
                    </p>
                    <h3 className="text-lg font-semibold text-slate-800">
                      {card.className}
                    </h3>
                    <p className="text-xs text-slate-500">{card.academicYear}</p>
                  </div>
                  <span className="rounded-lg bg-sky-100 px-2 py-1 text-xs font-medium text-sky-800">
                    {card.studentCount} students
                  </span>
                </div>
                <dl className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Total bill (class)</dt>
                    <dd className="font-semibold text-slate-800">
                      ₵{card.totalBill.toFixed(2)}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Collected</dt>
                    <dd className="font-medium text-emerald-700">
                      ₵{card.totalCollected.toFixed(2)}
                    </dd>
                  </div>
                  <div className="flex justify-between border-t border-slate-100 pt-2">
                    <dt className="text-slate-500">Outstanding</dt>
                    <dd className="font-semibold text-amber-700">
                      ₵{card.outstanding.toFixed(2)}
                    </dd>
                  </div>
                </dl>
              </div>);
                })}
          </div>)}
        </section>)}

      {canAdmin && (<section className="rounded-2xl border border-white/60 bg-white/90 backdrop-blur-sm p-6 shadow-sm">
          <h2 className="text-lg font-medium text-slate-800 mb-4">
            Create fee bill (admin)
          </h2>
          <p className="text-sm text-slate-500 mb-4">
            Sets the same total bill for every student in the selected class for
            the given term and academic year.
          </p>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-slate-600">Class</span>
              <select className="rounded-lg border border-slate-300 px-3 py-2" value={feeClassId} onChange={function (e) { return setFeeClassId(e.target.value); }}>
                <option value="">Select class</option>
                {classes.map(function (c) { return (<option key={c.id} value={c.id}>
                    {c.name}
                  </option>); })}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-slate-600">Total bill (₵)</span>
              <input type="number" min="0" step="0.01" className="rounded-lg border border-slate-300 px-3 py-2" value={feeTotal} onChange={function (e) { return setFeeTotal(e.target.value); }} placeholder="0.00"/>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-slate-600">Term</span>
              <select className="rounded-lg border border-slate-300 px-3 py-2" value={feeTerm} onChange={function (e) {
                return setFeeTerm(e.target.value);
            }}>
                <option value="TERM_1">Term 1</option>
                <option value="TERM_2">Term 2</option>
                <option value="TERM_3">Term 3</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-slate-600">Academic year</span>
              <input className="rounded-lg border border-slate-300 px-3 py-2" value={feeYear} onChange={function (e) { return setFeeYear(e.target.value); }} placeholder="e.g. 2024-2025"/>
            </label>
          </div>
          <button type="button" disabled={pending} onClick={handleCreateSchedule} className="mt-4 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50">
            Create & assign to students
          </button>
        </section>)}

      {canCollect && (<section className="rounded-2xl border border-white/60 bg-white/90 backdrop-blur-sm p-6 shadow-sm">
          <h2 className="text-lg font-medium text-slate-800 mb-4">
            Record fee payment (admin)
          </h2>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-4">
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-slate-600">Student & fee period</span>
                <select className="rounded-lg border border-slate-300 px-3 py-2" value={assignId} onChange={function (e) { return setAssignId(e.target.value); }}>
                  <option value="">Select…</option>
                  {assignmentOptions.map(function (a) { return (<option key={a.id} value={a.id}>
                      {a.studentName} — {a.className} — {termLabel(a.term)}{" "}
                      {a.academicYear} (balance ₵{a.balance.toFixed(2)})
                    </option>); })}
                </select>
              </label>
              {selectedAssignment && (<div className="rounded-xl bg-slate-50 p-4 text-sm space-y-2">
                  <p>
                    <span className="text-slate-500">Student:</span>{" "}
                    <strong>{selectedAssignment.studentName}</strong>
                  </p>
                  <p>
                    <span className="text-slate-500">Class:</span>{" "}
                    {selectedAssignment.className}
                  </p>
                  <p>
                    <span className="text-slate-500">Total bill:</span> ₵
                    {selectedAssignment.totalBill.toFixed(2)}
                  </p>
                  <p>
                    <span className="text-slate-500">Amount paid (to date):</span>{" "}
                    ₵{selectedAssignment.paidSoFar.toFixed(2)}
                  </p>
                  <p>
                    <span className="text-slate-500">Balance before payment:</span>{" "}
                    <strong className="text-amber-800">
                      ₵{selectedAssignment.balance.toFixed(2)}
                    </strong>
                  </p>
                  <p>
                    <span className="text-slate-500">Last payment date:</span>{" "}
                    {selectedAssignment.lastPaymentDate
                    ? new Date(selectedAssignment.lastPaymentDate).toLocaleDateString()
                    : "—"}
                  </p>
                </div>)}
            </div>
            <div className="space-y-4">
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-slate-600">Payment date</span>
                <input type="date" className="rounded-lg border border-slate-300 px-3 py-2" value={payDate} onChange={function (e) { return setPayDate(e.target.value); }}/>
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-slate-600">Payment amount (₵)</span>
                <input type="number" min="0" step="0.01" className="rounded-lg border border-slate-300 px-3 py-2" value={payAmount} onChange={function (e) { return setPayAmount(e.target.value); }} placeholder="0.00"/>
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-slate-600">Payment method</span>
                <select className="rounded-lg border border-slate-300 px-3 py-2" value={paymentMethod} onChange={function (e) {
                setPaymentMethod(e.target.value);
                setMethodDetails("");
            }}>
                  <option value="cash">Cash</option>
                  <option value="mobile_money">Mobile Money</option>
                  <option value="bank_payment">Bank Payment</option>
                  <option value="other">Other</option>
                </select>
              </label>
              {paymentMethod === "mobile_money" && (<>
                  <label className="flex flex-col gap-1 text-sm">
                    <span className="text-slate-600">Mobile Money Service</span>
                    <select className="rounded-lg border border-slate-300 px-3 py-2" value={mobileMoneyService} onChange={function (e) { return setMobileMoneyService(e.target.value); }}>
                      <option value="MTN">MTN Momo</option>
                      <option value="Telecel">Telecel</option>
                      <option value="AirtelTigo">AirtelTigo</option>
                    </select>
                  </label>
                  <label className="flex flex-col gap-1 text-sm">
                    <span className="text-slate-600">Sender&apos;s name</span>
                    <input type="text" className="rounded-lg border border-slate-300 px-3 py-2" value={methodDetails} onChange={function (e) { return setMethodDetails(e.target.value); }} placeholder="Enter sender&apos;s name"/>
                  </label>
                </>)}
              {paymentMethod === "bank_payment" && (<label className="flex flex-col gap-1 text-sm">
                  <span className="text-slate-600">Bank transaction ID</span>
                  <input type="text" className="rounded-lg border border-slate-300 px-3 py-2" value={methodDetails} onChange={function (e) { return setMethodDetails(e.target.value); }} placeholder="Enter transaction ID"/>
                </label>)}
              {paymentMethod === "other" && (<label className="flex flex-col gap-1 text-sm">
                  <span className="text-slate-600">Payment method</span>
                  <input type="text" className="rounded-lg border border-slate-300 px-3 py-2" value={methodDetails} onChange={function (e) { return setMethodDetails(e.target.value); }} placeholder="Specify payment method"/>
                </label>)}
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/80 px-4 py-3 text-sm">
                <span className="text-slate-500">Balance after this payment:</span>{" "}
                <strong className="text-emerald-800">
                  ₵
                  {newBalancePreview !== null
                ? newBalancePreview.toFixed(2)
                : "—"}
                </strong>
              </div>
              <button type="button" disabled={pending || !selectedAssignment} onClick={handleRecordPayment} className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50">
                Record payment & Generate receipt
              </button>
            </div>
          </div>
        </section>)}

      <section className="rounded-2xl border border-white/60 bg-white/90 backdrop-blur-sm p-6 shadow-sm overflow-x-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <h2 className="text-lg font-medium text-slate-800">
            {canAdmin ? "All payments" : "Fee payments"}
          </h2>
          <div className="flex flex-wrap items-center gap-3">
            <form onSubmit={function (e) { return e.preventDefault(); }} className="flex items-center gap-2 rounded-full bg-slate-50 ring-1 ring-slate-200 px-3 py-1.5 min-w-[200px] flex-1 md:flex-none md:w-64">
              <image_1.default src="/search.svg" alt="" width={14} height={14}/>
              <input type="text" placeholder="Search student..." value={paymentSearch} onChange={function (e) { return setPaymentSearch(e.target.value); }} className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"/>
            </form>
            <div className="relative">
              <button type="button" onClick={function () { return setPaymentFilterOpen(function (o) { return !o; }); }} className={"flex h-9 w-9 items-center justify-center rounded-full transition-colors ".concat(hasPaymentFilters
            ? "bg-sky-600 shadow-md shadow-sky-600/25 ring-2 ring-sky-200"
            : "bg-lamaYellow hover:bg-amber-300")} title="Filter payments">
                <image_1.default src="/filter.svg" alt="" width={14} height={14}/>
              </button>
              {paymentFilterOpen && (<div className="absolute right-0 z-20 mt-2 w-80 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">
                    Filter payments
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="flex flex-col gap-1 text-sm sm:col-span-2">
                      <span className="text-slate-600">Date from</span>
                      <input type="date" className="rounded-lg border border-slate-200 px-3 py-2" value={paymentDateFrom} onChange={function (e) { return setPaymentDateFrom(e.target.value); }}/>
                    </label>
                    <label className="flex flex-col gap-1 text-sm sm:col-span-2">
                      <span className="text-slate-600">Date to</span>
                      <input type="date" className="rounded-lg border border-slate-200 px-3 py-2" value={paymentDateTo} onChange={function (e) { return setPaymentDateTo(e.target.value); }}/>
                    </label>
                    <label className="flex flex-col gap-1 text-sm">
                      <span className="text-slate-600">Class</span>
                      <select className="rounded-lg border border-slate-200 px-3 py-2" value={paymentFilterClass} onChange={function (e) { return setPaymentFilterClass(e.target.value); }}>
                        <option value="">All classes</option>
                        {paymentClasses.map(function (c) { return (<option key={c} value={c}>
                            {c}
                          </option>); })}
                      </select>
                    </label>
                    <label className="flex flex-col gap-1 text-sm">
                      <span className="text-slate-600">Term</span>
                      <select className="rounded-lg border border-slate-200 px-3 py-2" value={paymentFilterTerm} onChange={function (e) { return setPaymentFilterTerm(e.target.value); }}>
                        <option value="">All terms</option>
                        <option value="TERM_1">Term 1</option>
                        <option value="TERM_2">Term 2</option>
                        <option value="TERM_3">Term 3</option>
                      </select>
                    </label>
                    <label className="flex flex-col gap-1 text-sm sm:col-span-2">
                      <span className="text-slate-600">Academic year</span>
                      <select className="rounded-lg border border-slate-200 px-3 py-2" value={paymentFilterYear} onChange={function (e) { return setPaymentFilterYear(e.target.value); }}>
                        <option value="">All years</option>
                        {paymentYears.map(function (y) { return (<option key={y} value={y}>
                            {y}
                          </option>); })}
                      </select>
                    </label>
                  </div>
                  <div className="mt-4 flex justify-between gap-2">
                    <button type="button" onClick={clearPaymentFilters} className="text-xs text-slate-500 hover:text-slate-800">
                      Clear all
                    </button>
                    <button type="button" onClick={function () { return setPaymentFilterOpen(false); }} className="rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-medium text-white">
                      Apply
                    </button>
                  </div>
                </div>)}
            </div>
          </div>
        </div>
        {payments.length === 0 ? (<p className="text-sm text-slate-500">No payment records yet.</p>) : filteredPayments.length === 0 ? (<p className="text-sm text-slate-500">
            No payments match your search or filters.
          </p>) : (<div className="space-y-2">
            {groupedPayments.map(function (group) { return (<div key={group.groupKey} className="border border-slate-200 rounded-lg overflow-hidden">
                {/* Group header row */}
                <div onClick={function () { return toggleGroup(group.groupKey); }} className="flex items-center gap-3 bg-slate-50 hover:bg-slate-100 px-4 py-3 cursor-pointer transition-colors">
                  <button type="button" className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded transition-transform" onClick={function (e) {
                    e.stopPropagation();
                    toggleGroup(group.groupKey);
                }}>
                    <svg className={"w-4 h-4 text-slate-600 transition-transform ".concat(expandedGroups.has(group.groupKey) ? "rotate-90" : "")} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                    </svg>
                  </button>

                  <div className="flex-1 grid grid-cols-1 gap-3 text-sm sm:grid-cols-5 sm:items-center">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-800 truncate">{group.studentName}</p>
                      <div className="mt-1 space-y-1 text-xs leading-4 text-slate-500 sm:hidden">
                        <p>{group.className}</p>
                        <p>{termLabel(group.term)} · {group.academicYear}</p>
                      </div>
                    </div>
                    <div className="hidden sm:block">
                      <p className="text-slate-700">{group.className}</p>
                    </div>
                    <div className="hidden sm:block">
                      <p className="text-slate-700">{termLabel(group.term)} · {group.academicYear}</p>
                    </div>
                    <div>
                      <p className="text-slate-600">{group.paymentCount} {group.paymentCount === 1 ? "payment" : "payments"}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-emerald-700">₵{group.totalAmount.toFixed(2)}</p>
                    </div>
                  </div>
                </div>

                {/* Expanded rows showing individual payments */}
                {expandedGroups.has(group.groupKey) && (<div className="bg-white border-t border-slate-200">
                    {group.payments.map(function (payment) { return (<div key={payment.id} className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 hover:bg-slate-50/50 last:border-b-0 pl-12">
                        <div className="flex flex-col gap-3 text-sm sm:grid sm:grid-cols-[1.2fr_1.4fr_0.8fr] sm:items-center">
                          <div>
                            <p className="text-slate-700">{new Date(payment.paidAt).toLocaleDateString()}</p>
                            <p className="mt-1 text-xs text-slate-500 sm:hidden">
                              {payment.paymentMethod === "mobile_money"
                            ? "Mobile Money"
                            : payment.paymentMethod === "bank_payment"
                                ? "Bank Payment"
                                : payment.paymentMethod === "other"
                                    ? payment.methodDetails || "Other"
                                    : "Cash"}
                            </p>
                          </div>

                          <div className="hidden sm:block">
                            <div className="text-xs font-medium text-slate-800">
                              {payment.paymentMethod === "mobile_money"
                            ? "Mobile Money"
                            : payment.paymentMethod === "bank_payment"
                                ? "Bank Payment"
                                : payment.paymentMethod === "other"
                                    ? payment.methodDetails || "Other"
                                    : "Cash"}
                            </div>
                            {payment.methodDetails ? (<div className="mt-0.5 text-xs text-slate-500 truncate max-w-[180px]">
                                {payment.methodDetails}
                              </div>) : null}
                          </div>

                          <div className="text-right">
                            <p className="font-semibold text-emerald-700">₵{payment.amount.toFixed(2)}</p>
                          </div>
                        </div>

                        {canAdmin && (<div className="flex-shrink-0 flex gap-2">
                            <button type="button" title="View receipt" onClick={function () {
                                var _a;
                                setViewingReceiptPayment(payment);
                                setReceiptData({
                                    studentName: payment.studentName,
                                    className: payment.className,
                                    term: payment.term,
                                    academicYear: payment.academicYear,
                                    amount: payment.amount,
                                    paymentDate: payment.paidAt,
                                    paymentMethod: payment.paymentMethod,
                                    methodDetails: payment.methodDetails,
                                    mobileMoneyService: payment.paymentMethod === "mobile_money"
                                        ? ((_a = payment.methodDetails) === null || _a === void 0 ? void 0 : _a.split(" - ")[0]) || "MTN"
                                        : null,
                                });
                            }} className="rounded-lg p-2 hover:bg-sky-100 transition-colors">
                              <image_1.default src="/receipt.svg" alt="Receipt" width={16} height={16}/>
                            </button>
                            <button type="button" title="Edit" onClick={function () { return openEdit(payment); }} className="rounded-lg p-2 hover:bg-slate-200 transition-colors">
                              <image_1.default src="/edit.svg" alt="" width={16} height={16}/>
                            </button>
                            <button type="button" title="Delete" onClick={function () { return handleDeletePayment(payment.id); }} className="rounded-lg p-2 hover:bg-red-100 transition-colors">
                              <image_1.default src="/delete.svg" alt="" width={16} height={16}/>
                            </button>
                          </div>)}
                      </div>); })}
                  </div>)}
              </div>); })}
          </div>)}
      </section>

      {editOpen && editPayment && (<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-800">Edit payment</h3>
            <p className="text-xs text-slate-500 mt-1">
              {editPayment.studentName} — {editPayment.className}
            </p>
            <div className="mt-4 space-y-3">
              <label className="flex flex-col gap-1 text-sm">
                <span>Amount (₵)</span>
                <input type="number" step="0.01" className="rounded-lg border border-slate-300 px-3 py-2" value={editAmount} onChange={function (e) { return setEditAmount(e.target.value); }}/>
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span>Date</span>
                <input type="date" className="rounded-lg border border-slate-300 px-3 py-2" value={editDate} onChange={function (e) { return setEditDate(e.target.value); }}/>
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" className="rounded-lg px-4 py-2 text-sm text-slate-600 hover:bg-slate-100" onClick={function () {
                setEditOpen(false);
                setEditPayment(null);
            }}>
                Cancel
              </button>
              <button type="button" disabled={pending} onClick={handleUpdatePayment} className="rounded-lg bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-800">
                Save
              </button>
            </div>
          </div>
        </div>)}

      {receiptModalOpen && receiptData && (<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-8 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <image_1.default src="/logo.png" alt="TechStylus" width={32} height={32} loading="eager" style={{ width: "auto", height: "auto" }} />
                <h2 className="text-2xl font-bold text-slate-800">TechStylus</h2>
              </div>
              <h3 className="text-lg font-semibold text-slate-600">PAYMENT RECEIPT</h3>
            </div>

            <div className="border-t-2 border-b-2 border-slate-200 py-4 mb-6">
              <p className="text-center text-sm text-slate-600">School Management System</p>
              <p className="text-center text-xs text-slate-500 mt-1">Receipt ID: {Date.now()}</p>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-500 text-xs">STUDENT NAME</p>
                  <p className="font-semibold text-slate-800">{receiptData.studentName}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs">CLASS</p>
                  <p className="font-semibold text-slate-800">{receiptData.className}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs">TERM</p>
                  <p className="font-semibold text-slate-800">{termLabel(receiptData.term)}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs">ACADEMIC YEAR</p>
                  <p className="font-semibold text-slate-800">{receiptData.academicYear}</p>
                </div>
              </div>

              <div className="border-t border-b border-slate-200 py-4">
                <div className="flex justify-between mb-2">
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
                <div className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg">
                  <p className="capitalize font-medium">
                    {receiptData.paymentMethod === "mobile_money"
                ? "".concat(receiptData.mobileMoneyService, " Mobile Money")
                : receiptData.paymentMethod === "bank_payment"
                    ? "Bank Payment"
                    : receiptData.paymentMethod.charAt(0).toUpperCase() + receiptData.paymentMethod.slice(1)}
                  </p>
                  {receiptData.methodDetails && (<p className="text-xs text-slate-600 mt-1">{receiptData.methodDetails}</p>)}
                </div>
              </div>

              <div className="text-center pt-4 border-t border-slate-200">
                <p className="text-xs text-slate-500">Thank you for your payment!</p>
                <p className="text-xs text-slate-500 mt-1">Please keep this receipt for your records.</p>
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button type="button" onClick={function () { return setReceiptModalOpen(false); }} className="rounded-lg px-4 py-2 text-sm text-slate-600 hover:bg-slate-100">
                Close
              </button>
              <button type="button" onClick={function () { return window.print(); }} className="rounded-lg bg-sky-600 px-6 py-2 text-sm font-medium text-white hover:bg-sky-700">
                Print Receipt
              </button>
            </div>
          </div>
        </div>)}

      {/* Receipt Viewer Modal for viewing previously recorded payments */}
      {viewingReceiptPayment && receiptData && (<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-8 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <image_1.default src="/logo.png" alt="TechStylus" width={32} height={32} loading="eager" style={{ width: "auto", height: "auto" }} />
                <h2 className="text-2xl font-bold text-slate-800">TechStylus</h2>
              </div>
              <h3 className="text-lg font-semibold text-slate-600">PAYMENT RECEIPT</h3>
            </div>

            <div className="border-t-2 border-b-2 border-slate-200 py-4 mb-6">
              <p className="text-center text-sm text-slate-600">School Management System</p>
              <p className="text-center text-xs text-slate-500 mt-1">Receipt ID: {viewingReceiptPayment.id}</p>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-500 text-xs">STUDENT NAME</p>
                  <p className="font-semibold text-slate-800">{receiptData.studentName}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs">CLASS</p>
                  <p className="font-semibold text-slate-800">{receiptData.className}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs">TERM</p>
                  <p className="font-semibold text-slate-800">{termLabel(receiptData.term)}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs">ACADEMIC YEAR</p>
                  <p className="font-semibold text-slate-800">{receiptData.academicYear}</p>
                </div>
              </div>

              <div className="border-t border-b border-slate-200 py-4">
                <div className="flex justify-between mb-2">
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
                <div className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg">
                  <p className="capitalize font-medium">
                    {receiptData.paymentMethod === "mobile_money"
                ? "".concat(receiptData.mobileMoneyService, " Mobile Money")
                : receiptData.paymentMethod === "bank_payment"
                    ? "Bank Payment"
                    : receiptData.paymentMethod.charAt(0).toUpperCase() + receiptData.paymentMethod.slice(1)}
                  </p>
                  {receiptData.methodDetails && (<p className="text-xs text-slate-600 mt-1">{receiptData.methodDetails}</p>)}
                </div>
              </div>

              <div className="text-center pt-4 border-t border-slate-200">
                <p className="text-xs text-slate-500">Thank you for your payment!</p>
                <p className="text-xs text-slate-500 mt-1">Please keep this receipt for your records.</p>
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button type="button" onClick={function () { return setViewingReceiptPayment(null); }} className="rounded-lg px-4 py-2 text-sm text-slate-600 hover:bg-slate-100">
                Close
              </button>
              <button type="button" onClick={function () { return window.print(); }} className="rounded-lg bg-sky-600 px-6 py-2 text-sm font-medium text-white hover:bg-sky-700">
                Print Receipt
              </button>
            </div>
          </div>
        </div>)}
    </div>);
}
