"use client";

import { ClassReportData } from "@/components/ClassReportButton";

const formatNumber = (value: number) => (Number.isFinite(value) ? value.toFixed(1) : "0.0");

const ClassReportPreviewModal = ({
  report,
  onClose,
}: {
  report: ClassReportData;
  onClose: () => void;
}) => {
  const school = report.schoolSettings;
  const schoolContact = [
    school?.address,
    school?.location,
    school?.telephone ? `Tel: ${school.telephone}` : null,
    school?.email,
  ].filter(Boolean) as string[];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="report-preview-modal w-full max-w-4xl max-h-[92vh] overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3 print:hidden">
          <h3 className="text-base font-semibold text-slate-800">Class report preview</h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100"
            >
              Print
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm text-white hover:bg-slate-800"
            >
              Close
            </button>
          </div>
        </div>

        <div className="max-h-[calc(92vh-68px)] overflow-y-auto p-5 print:p-0 print:overflow-visible">
          <div className="class-report-sheet mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white p-6 print:rounded-none print:border-0 print:p-0">
            <header className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
                <div className="flex shrink-0 items-center gap-4">
                  {school?.logoUrl ? (
                    <img
                      src={school.logoUrl}
                      alt="School logo"
                      className="h-16 w-16 rounded-xl border border-slate-200 bg-white object-contain p-1.5 shadow-sm"
                    />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      Logo
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <p className="text-2xl font-bold text-slate-900">
                    {school?.name ?? "School Name"}
                  </p>
                  {schoolContact.length > 0 && (
                    <p className="mt-1 text-xs text-slate-600">
                      {schoolContact.join(" · ")}
                    </p>
                  )}
                </div>

                <div className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                  {report.academicYear} • {report.term}
                </div>
              </div>
            </header>

            <div className="mb-6 border-b border-slate-200 pb-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-600">School report</p>
                  <h2 className="mt-1 text-2xl font-bold text-slate-900">{report.className}</h2>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Grading level</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">{report.gradingLevel}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Supervisor</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">{report.supervisor}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Total students</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">{report.totalStudents}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Average age</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">{formatNumber(report.averageAge)} yrs</p>
              </div>
            </div>

            <div className="mt-6 grid gap-5 lg:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-600">Class overview</h3>
                <dl className="mt-4 space-y-3 text-sm text-slate-700">
                  <div className="flex justify-between gap-4 border-b border-slate-200 pb-2">
                    <dt>Class name</dt>
                    <dd className="font-semibold text-slate-900">{report.className}</dd>
                  </div>
                  <div className="flex justify-between gap-4 border-b border-slate-200 pb-2">
                    <dt>Subjects</dt>
                    <dd className="font-semibold text-slate-900">{report.subjects.length}</dd>
                  </div>
                  <div className="flex justify-between gap-4 border-b border-slate-200 pb-2">
                    <dt>Total males</dt>
                    <dd className="font-semibold text-slate-900">{report.totalMale}</dd>
                  </div>
                  <div className="flex justify-between gap-4 border-b border-slate-200 pb-2">
                    <dt>Total females</dt>
                    <dd className="font-semibold text-slate-900">{report.totalFemale}</dd>
                  </div>
                  <div className="flex justify-between gap-4 border-b border-slate-200 pb-2">
                    <dt>Average attendance</dt>
                    <dd className="font-semibold text-slate-900">{formatNumber(report.averageAttendance)}%</dd>
                  </div>
                  <div className="flex justify-between gap-4 pb-1">
                    <dt>Average score</dt>
                    <dd className="font-semibold text-slate-900">{formatNumber(report.averageScore)}%</dd>
                  </div>
                </dl>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-600">Subjects</h3>
                <div className="mt-4 flex flex-wrap gap-2">
                  {report.subjects.length > 0 ? (
                    report.subjects.map((subject) => (
                      <span
                        key={subject}
                        className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700"
                      >
                        {subject}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-slate-500">No subjects assigned.</span>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-600">Top five students</h3>
              <div className="mt-4 overflow-hidden rounded-lg border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-100 text-left text-slate-700">
                    <tr>
                      <th className="px-3 py-2 font-semibold">Rank</th>
                      <th className="px-3 py-2 font-semibold">Student</th>
                      <th className="px-3 py-2 text-right font-semibold">Average score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {report.topStudents.length > 0 ? (
                      report.topStudents.map((student, index) => (
                        <tr key={`${student.name}-${student.surname}`}>
                          <td className="px-3 py-2 text-slate-600">#{index + 1}</td>
                          <td className="px-3 py-2 font-medium text-slate-800">
                            {student.name} {student.surname}
                          </td>
                          <td className="px-3 py-2 text-right font-semibold text-slate-900">
                            {formatNumber(student.score)}%
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="px-3 py-4 text-center text-slate-500">
                          No student scores available.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClassReportPreviewModal;
