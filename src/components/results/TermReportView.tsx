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

  return (
    <div className={`term-report-view text-slate-800 ${compact ? "text-xs sm:text-sm" : "text-sm"}`}>
      <div className="report-card border border-slate-900/80 p-3 bg-white">
        <div className="report-card-header border border-slate-900/90 p-3 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="w-full sm:w-32">
              {report.schoolSettings?.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={report.schoolSettings.logoUrl}
                  alt="School logo"
                  className="max-h-20 mx-auto"
                />
              ) : (
                <div className="h-20 w-20 bg-slate-100 border border-slate-300 flex items-center justify-center text-xs uppercase tracking-wider text-slate-500 mx-auto">
                  Logo
                </div>
              )}
            </div>

            <div className="text-center flex-1">
              <p className="text-lg sm:text-xl font-black uppercase tracking-[0.2em]">
                {report.schoolSettings?.name ?? "School Name"}
              </p>
              <p className="text-xs sm:text-sm font-semibold text-slate-700 mt-2">
                {report.schoolSettings?.address}
              </p>
              <p className="text-xs sm:text-sm font-semibold text-slate-700">
                {report.schoolSettings?.location}
                {report.schoolSettings?.telephone ? `, TEL: ${report.schoolSettings.telephone}` : ""}
              </p>
            </div>

            <div className="w-full sm:w-32 text-center sm:text-right">
              <p className="text-base sm:text-lg font-bold uppercase tracking-[0.15em] text-slate-900">
                Learner&apos;s Terminal Report
              </p>
            </div>
          </div>
        </div>

        <div className="report-meta border border-slate-900/80 p-3 mb-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs sm:text-sm">
            <div>
              <span className="font-semibold">Student&apos;s Name :</span>
              <span className="ml-1">{report.studentName}</span>
            </div>
            <div>
              <span className="font-semibold">Academic Year :</span>
              <span className="ml-1">{report.academicYearLabel}</span>
            </div>
            <div>
              <span className="font-semibold">Class :</span>
              <span className="ml-1">{report.className}</span>
            </div>
            <div>
              <span className="font-semibold">Term :</span>
              <span className="ml-1">Term {report.termNumber}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs sm:text-sm mt-3">
            <div>
              <span className="font-semibold">No. On Roll :</span>
              <span className="ml-1">{report.totalOnRoll}</span>
            </div>
            <div>
              <span className="font-semibold">Total Attendance :</span>
              <span className="ml-1">{report.totalAttendance}</span>
            </div>
            <div>
              <span className="font-semibold">Vacation Date :</span>
              <span className="ml-1">{formatReportDate(report.vacationDate)}</span>
            </div>
            <div>
              <span className="font-semibold">Reopening Date :</span>
              <span className="ml-1">{formatReportDate(report.reopeningDate)}</span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border border-slate-200/80 bg-white/95 p-2 mb-4">
          <table className="report-table w-full text-left text-[10px] sm:text-sm">
            <thead>
              <tr>
                <th className="px-2 sm:px-3 py-2">Subjects</th>
                <th className="px-2 sm:px-3 py-2">Class Score</th>
                <th className="px-2 sm:px-3 py-2">Exams Score</th>
                <th className="px-2 sm:px-3 py-2">Total Marks</th>
                <th className="px-2 sm:px-3 py-2">Grade</th>
                <th className="px-2 sm:px-3 py-2">Proficiency Level (Grade)</th>
              </tr>
            </thead>
            <tbody>
              {report.subjectLines.map((line) => (
                <tr key={line.id}>
                  <td className="px-2 sm:px-3 py-2 font-semibold uppercase">{line.subjectName}</td>
                  <td className="px-2 sm:px-3 py-2">{line.classScore}</td>
                  <td className="px-2 sm:px-3 py-2">{line.examScore}</td>
                  <td className="px-2 sm:px-3 py-2">{line.totalMarks}</td>
                  <td className="px-2 sm:px-3 py-2">{line.grade ?? "—"}</td>
                  <td className="px-2 sm:px-3 py-2">{line.remark ?? "—"}</td>
                </tr>
              ))}
              <tr className="totals-row">
                <td className="px-2 sm:px-3 py-2 font-bold">Total</td>
                <td className="px-2 sm:px-3 py-2 font-bold">{totals.classScore}</td>
                <td className="px-2 sm:px-3 py-2 font-bold">{totals.examScore}</td>
                <td className="px-2 sm:px-3 py-2 font-bold">{totals.totalMarks}</td>
                <td className="px-2 sm:px-3 py-2" />
                <td className="px-2 sm:px-3 py-2" />
              </tr>
            </tbody>
          </table>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <div className="rounded border border-slate-900/80 p-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="block text-[10px] text-slate-500">Percentage</span>
                <span className="font-semibold">{report.overallPercentage ?? "—"}</span>
              </div>
              <div>
                <span className="block text-[10px] text-slate-500">Conduct</span>
                <span className="font-semibold">{report.conduct ?? "—"}</span>
              </div>
              <div>
                <span className="block text-[10px] text-slate-500">Overall Grade</span>
                <span className="font-semibold">{report.overallGrade ?? "—"}</span>
              </div>
              <div>
                <span className="block text-[10px] text-slate-500">Result</span>
                <span className="font-semibold">{report.resultStatus ?? "—"}</span>
              </div>
            </div>
            <div className="mt-3 text-sm">
              <p className="text-[10px] text-slate-500">Overall Remark</p>
              <p className="font-medium">{report.overallRemark ?? "—"}</p>
              <p className="text-[10px] text-slate-500 mt-2">Interest</p>
              <p className="font-medium">{report.interest ?? "—"}</p>
            </div>
          </div>

          <div className="rounded border border-slate-900/80 p-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-[0.08em]">Facilitator&apos;s Remarks</p>
                <p className="mt-2 min-h-[5rem] text-sm">{report.supervisorRemarks ?? "—"}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-[0.08em]">Headteacher&apos;s Remarks</p>
                <p className="mt-2 min-h-[5rem] text-sm">{report.headteacherRemarks ?? "—"}</p>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-4 text-center text-xs">
              <div>
                <div className="border-t border-slate-900/70 pt-3">Class Facilitator&apos;s Signature</div>
              </div>
              <div>
                <div className="border-t border-slate-900/70 pt-3">Headteacher&apos;s Signature</div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded border border-slate-900/80 p-3 text-xs">
          <p className="font-semibold mb-2">Grading System Details</p>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse report-table">
              <thead>
                <tr>
                  <th className="px-2 py-1">% Range</th>
                  <th className="px-2 py-1">Grade</th>
                  <th className="px-2 py-1">Remarks</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-2 py-1">80 - 100</td>
                  <td className="px-2 py-1">A</td>
                  <td className="px-2 py-1">Advance</td>
                </tr>
                <tr>
                  <td className="px-2 py-1">75 - 79</td>
                  <td className="px-2 py-1">P</td>
                  <td className="px-2 py-1">Proficient</td>
                </tr>
                <tr>
                  <td className="px-2 py-1">70 - 74</td>
                  <td className="px-2 py-1">AP</td>
                  <td className="px-2 py-1">Approaching Proficiency</td>
                </tr>
                <tr>
                  <td className="px-2 py-1">65 - 69</td>
                  <td className="px-2 py-1">D</td>
                  <td className="px-2 py-1">Developing</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <p>
      <span className="text-slate-500 block text-xs">{label}</span>
      <span className="font-medium">{value}</span>
    </p>
  );
}
