"use client";

import type { TermlyReportRow } from "@/lib/resultsData";

export function formatReportDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function MetaField({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="report-meta-field">
      <dt className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm font-semibold text-slate-900">{value}</dd>
    </div>
  );
}

function GradeBadge({ grade }: { grade: string | null }) {
  if (!grade) return <span className="text-slate-400">—</span>;

  const normalized = grade.trim().toUpperCase();
  const tone =
    normalized === "A" || normalized.startsWith("A+")
      ? "bg-emerald-100 text-emerald-800 ring-emerald-200"
      : normalized === "P" || normalized === "B"
        ? "bg-sky-100 text-sky-800 ring-sky-200"
        : normalized === "AP" || normalized === "C"
          ? "bg-amber-100 text-amber-800 ring-amber-200"
          : normalized === "D" || normalized === "F"
            ? "bg-rose-100 text-rose-800 ring-rose-200"
            : "bg-slate-100 text-slate-700 ring-slate-200";

  return (
    <span
      className={`inline-flex min-w-[2rem] items-center justify-center rounded-md px-2 py-0.5 text-xs font-bold ring-1 ${tone}`}
    >
      {grade}
    </span>
  );
}

function ResultBadge({ status }: { status: string | null }) {
  if (!status) return <span className="text-slate-400">—</span>;

  const normalized = status.trim().toLowerCase();
  const tone = normalized.includes("promot")
    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
    : normalized.includes("repeat") || normalized.includes("fail")
      ? "bg-rose-50 text-rose-800 border-rose-200"
      : "bg-slate-50 text-slate-800 border-slate-200";

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${tone}`}
    >
      {status}
    </span>
  );
}

const DEFAULT_GRADING_ROWS = [
  { range: "80 – 100", grade: "A", remark: "Advance" },
  { range: "75 – 79", grade: "P", remark: "Proficient" },
  { range: "70 – 74", grade: "AP", remark: "Approaching Proficiency" },
  { range: "65 – 69", grade: "D", remark: "Developing" },
];

export default function TermReportView({
  report,
  compact = false,
}: {
  report: TermlyReportRow;
  compact?: boolean;
}) {
  const totals = report.subjectLines.reduce(
    (acc, line) => ({
      classScore: acc.classScore + (line.classScore ?? 0),
      examScore: acc.examScore + (line.examScore ?? 0),
      totalMarks: acc.totalMarks + (line.totalMarks ?? 0),
    }),
    { classScore: 0, examScore: 0, totalMarks: 0 }
  );

  const school = report.schoolSettings;
  const contactParts = [
    school?.location,
    school?.telephone ? `Tel: ${school.telephone}` : null,
    school?.email,
  ].filter(Boolean);

  return (
    <div
      className={`term-report-view text-slate-800 ${compact ? "text-xs sm:text-sm" : "text-sm"}`}
    >
      <article className="report-card overflow-hidden bg-white">
        {/* Letterhead */}
        <header className="report-card-header relative border-b border-slate-200 px-3 py-3 sm:px-5 sm:py-4">
          <div className="report-accent-bar absolute inset-x-0 top-0 h-1.25 bg-[#062e61]" />

          <div className="flex flex-col items-center gap-2.5 sm:flex-row sm:items-center sm:justify-center">
            <div className="shrink-0">
              {school?.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={school.logoUrl}
                  alt="School logo"
                  className="h-16 w-16 rounded-xl border border-slate-200 bg-white object-contain p-1.5 shadow-sm sm:h-20 sm:w-20"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-[10px] font-semibold uppercase tracking-wider text-slate-400 sm:h-20 sm:w-20">
                  Logo
                </div>
              )}
            </div>

            <div className="w-full text-center sm:max-w-[70%]">
              <p className="text-lg font-bold tracking-tight text-[#062e61] sm:text-2xl">
                {school?.name ?? "School Name"}
              </p>
              {school?.address ? (
                <p className="mt-1 text-xs text-slate-600 sm:text-sm">
                  {school.address}
                </p>
              ) : null}
              {contactParts.length > 0 ? (
                <p className="mt-1 text-[11px] text-slate-500">
                  {contactParts.join(" · ")}
                </p>
              ) : null}
            </div>
          </div>

          <div className="mt-3 flex flex-col items-center justify-center text-center">
            <span className="report-title-badge inline-block rounded-lg bg-[#062e61] px-3.5 py-1.5 text-[9px] font-bold uppercase tracking-[0.16em] text-white sm:text-[10px]">
              Learner&apos;s Terminal Report
            </span>
            <p className="mt-1.5 text-[9px] font-medium uppercase tracking-wider text-slate-500 sm:text-[10px]">
              Official Academic Record
            </p>
          </div>
        </header>

        <div className="px-3 py-3 sm:px-5 sm:py-4">
          {/* Student & term metadata */}
          <section className="report-meta mb-4 rounded-xl border border-slate-200 bg-slate-50/80 p-3 sm:p-4">
            <div className="grid grid-cols-2 gap-x-3 gap-y-3 sm:grid-cols-4">
              <MetaField label="Student's Name" value={report.studentName} />
              <MetaField label="Academic Year" value={report.academicYearLabel} />
              <MetaField label="Class" value={report.className} />
              <MetaField label="Term" value={`Term ${report.termNumber}`} />
            </div>
            <div className="mt-3 border-t border-slate-200 pt-3">
              <div className="grid grid-cols-2 gap-x-3 gap-y-3 sm:grid-cols-4">
                <MetaField label="No. On Roll" value={report.totalOnRoll} />
                <MetaField
                  label="Total Attendance"
                  value={report.totalAttendance}
                />
                <MetaField
                  label="Vacation Date"
                  value={formatReportDate(report.vacationDate)}
                />
                <MetaField
                  label="Reopening Date"
                  value={formatReportDate(report.reopeningDate)}
                />
              </div>
            </div>
          </section>

          {/* Performance summary strip */}
          <section className="report-summary-strip mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white p-3 text-center shadow-sm">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Overall %
              </p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-[#062e61]">
                {report.overallPercentage != null
                  ? `${report.overallPercentage.toFixed(1)}%`
                  : "—"}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3 text-center shadow-sm">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Overall Grade
              </p>
              <div className="mt-2 flex justify-center">
                <GradeBadge grade={report.overallGrade} />
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3 text-center shadow-sm">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Position
              </p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">
                {report.positionOnRoll != null
                  ? `${report.positionOnRoll}${ordinalSuffix(report.positionOnRoll)}`
                  : "—"}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3 text-center shadow-sm">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Result
              </p>
              <div className="mt-2 flex justify-center">
                <ResultBadge status={report.resultStatus} />
              </div>
            </div>
          </section>

          {/* Subject scores */}
          <section className="mb-4 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="report-table w-full text-left">
              <thead>
                <tr>
                  <th className="px-4 py-3">Subject</th>
                  <th className="px-4 py-3 text-right">Class Score</th>
                  <th className="px-4 py-3 text-right">Exam Score</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3 text-center">Grade</th>
                  <th className="px-4 py-3">Proficiency Level</th>
                </tr>
              </thead>
              <tbody>
                {report.subjectLines.map((line) => (
                  <tr key={line.id}>
                    <td className="px-4 py-2.5 font-medium text-slate-800">
                      {line.subjectName}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-slate-700">
                      {line.classScore}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-slate-700">
                      {line.examScore}
                    </td>
                    <td className="px-4 py-2.5 text-right font-semibold tabular-nums text-slate-900">
                      {line.totalMarks}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <GradeBadge grade={line.grade} />
                    </td>
                    <td className="px-4 py-2.5 text-slate-600">
                      {line.remark ?? "—"}
                    </td>
                  </tr>
                ))}
                <tr className="totals-row">
                  <td className="px-4 py-2.5 font-bold text-slate-900">Total</td>
                  <td className="px-4 py-2.5 text-right font-bold tabular-nums">
                    {totals.classScore}
                  </td>
                  <td className="px-4 py-2.5 text-right font-bold tabular-nums">
                    {totals.examScore}
                  </td>
                  <td className="px-4 py-2.5 text-right font-bold tabular-nums">
                    {totals.totalMarks}
                  </td>
                  <td className="px-4 py-2.5" colSpan={2} />
                </tr>
              </tbody>
            </table>
          </section>

          {/* Remarks & conduct */}
          <section className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#062e61]">
                Performance Summary
              </h3>
              <dl className="mt-4 grid grid-cols-2 gap-4">
                <MetaField
                  label="Conduct"
                  value={report.conduct ?? "—"}
                />
                <MetaField
                  label="Interest"
                  value={report.interest ?? "—"}
                />
              </dl>
              <div className="mt-4 border-t border-slate-100 pt-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  Overall Remark
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-700">
                  {report.overallRemark ?? "—"}
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#062e61]">
                Staff Remarks
              </h3>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                    Class Facilitator
                  </p>
                  <p className="report-remark-body mt-2 min-h-[4.5rem] text-sm leading-relaxed text-slate-700">
                    {report.supervisorRemarks ?? "—"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                    Headteacher
                  </p>
                  <p className="report-remark-body mt-2 min-h-[4.5rem] text-sm leading-relaxed text-slate-700">
                    {report.headteacherRemarks ?? "—"}
                  </p>
                </div>
              </div>
              <div className="mt-6 grid grid-cols-2 gap-6">
                <div>
                  <div className="border-t border-slate-300 pt-2 text-center text-[10px] font-medium uppercase tracking-wider text-slate-500">
                    Facilitator&apos;s Signature
                  </div>
                  {report.supervisorSignature ? (
                    <p className="mt-1 text-center text-xs italic text-slate-600">
                      {report.supervisorSignature}
                    </p>
                  ) : null}
                </div>
                <div>
                  <div className="border-t border-slate-300 pt-2 text-center text-[10px] font-medium uppercase tracking-wider text-slate-500">
                    Headteacher&apos;s Signature
                  </div>
                  {report.headteacherSignature ? (
                    <p className="mt-1 text-center text-xs italic text-slate-600">
                      {report.headteacherSignature}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          </section>

          {/* Grading reference */}
          <section className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 sm:p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Grading System Reference
            </h3>
            <div className="mt-3 overflow-x-auto">
              <table className="report-grading-table w-full text-xs">
                <thead>
                  <tr>
                    <th className="px-3 py-2 text-left">% Range</th>
                    <th className="px-3 py-2 text-center">Grade</th>
                    <th className="px-3 py-2 text-left">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {DEFAULT_GRADING_ROWS.map((row) => (
                    <tr key={row.grade}>
                      <td className="px-3 py-1.5 tabular-nums text-slate-700">
                        {row.range}
                      </td>
                      <td className="px-3 py-1.5 text-center">
                        <GradeBadge grade={row.grade} />
                      </td>
                      <td className="px-3 py-1.5 text-slate-600">{row.remark}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <footer className="border-t border-slate-100 bg-slate-50 px-5 py-3 text-center text-[10px] text-slate-400 sm:px-8">
          Generated academic report · {report.academicYearLabel} · Term{" "}
          {report.termNumber}
        </footer>
      </article>
    </div>
  );
}

function ordinalSuffix(n: number): string {
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return "th";
  switch (n % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
}
