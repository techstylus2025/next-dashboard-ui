"use client";

import Image from "next/image";
import {
  createMidTermReports,
  createMockReports,
  publishAssessmentReports,
  upsertAssessmentSubjectScore,
} from "@/lib/assessmentReportActions";
import { createMockResultsSpreadsheetXml } from "@/lib/mockResultsSpreadsheet";
import type { AssessmentReportRow, ResultsPageContext } from "@/lib/resultsData";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { toast } from "react-toastify";

type AssessmentKind = "MID_TERM" | "MOCK";

function AssessmentReportCard({
  report,
  kind,
  school,
  canPublish,
}: {
  report: AssessmentReportRow;
  kind: AssessmentKind;
  school: ResultsPageContext["schoolSettings"];
  canPublish: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [scores, setScores] = useState<Record<number, string>>(
    Object.fromEntries(report.subjectLines.map((line) => [line.subjectId, String(line.score)]))
  );
  const contact = [school?.location, school?.telephone, school?.email].filter(Boolean).join(" · ");

  const save = (subjectId: number) => {
    startTransition(async () => {
      const result = await upsertAssessmentSubjectScore({
        reportId: report.id,
        subjectId,
        score: Number(scores[subjectId]),
      });
      if (result.success) {
        toast.success("Score saved.");
        router.refresh();
      } else {
        toast.error(result.error || "Could not save score.");
      }
    });
  };

  const publish = () => {
    startTransition(async () => {
      const result = await publishAssessmentReports({
        reportId: report.id,
        type: kind,
      });
      if (result.success) {
        toast.success("Assessment report published.");
        router.refresh();
      } else {
        toast.error(result.error || "Could not publish report.");
      }
    });
  };

  return (
    <details className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 p-3 sm:p-4 [&::-webkit-details-marker]:hidden">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-slate-900">{report.studentName}</h3>
          <p className="mt-1 text-xs text-slate-500">
            {report.className} · {report.academicYearLabel} · Term {report.termNumber}
            {kind === "MOCK" ? ` · Mock ${report.assessmentNumber}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {kind === "MOCK" && report.overallPercentage != null ? (
            <span className="text-sm font-semibold text-slate-700">{report.overallPercentage.toFixed(1)}%</span>
          ) : null}
          <span className="text-sm font-semibold text-slate-700">Total {report.totalScore}</span>
          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${report.isPublished ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"}`}>
            {report.isPublished ? "Published" : "In progress"}
          </span>
          <span aria-hidden="true" className="text-slate-500">⌄</span>
        </div>
      </summary>
      <div className="border-t border-slate-200">
      <header className="border-b border-slate-200 bg-slate-50 px-4 py-4 text-center">
        {school?.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={school.logoUrl} alt="School logo" className="mx-auto mb-2 h-12 w-12 rounded-lg object-contain" />
        ) : null}
        <h3 className="text-lg font-bold text-slate-900">{school?.name ?? "School Name"}</h3>
        {school?.address ? <p className="mt-1 text-xs text-slate-600">{school.address}</p> : null}
        {contact ? <p className="mt-1 text-xs text-slate-500">{contact}</p> : null}
        <p className="mt-3 text-sm font-bold uppercase tracking-wide text-sky-800">
          {kind === "MID_TERM" ? "Mid-Term Examination Results" : `Mock Examination ${report.assessmentNumber}`}
        </p>
      </header>

      <div className="p-4">
        <dl className="grid grid-cols-2 gap-x-3 gap-y-3 rounded-lg bg-slate-50 p-3 sm:grid-cols-4">
          <div><dt className="text-xs text-slate-500">Student</dt><dd className="mt-0.5 text-sm font-semibold text-slate-900">{report.studentName}</dd></div>
          <div><dt className="text-xs text-slate-500">Class</dt><dd className="mt-0.5 text-sm font-semibold text-slate-900">{report.className}</dd></div>
          <div><dt className="text-xs text-slate-500">Academic year</dt><dd className="mt-0.5 text-sm font-semibold text-slate-900">{report.academicYearLabel}</dd></div>
          <div><dt className="text-xs text-slate-500">Term</dt><dd className="mt-0.5 text-sm font-semibold text-slate-900">Term {report.termNumber}</dd></div>
          {kind === "MOCK" ? <div><dt className="text-xs text-slate-500">Mock number</dt><dd className="mt-0.5 text-sm font-semibold text-slate-900">{report.assessmentNumber}</dd></div> : null}
        </dl>

        <div className="mt-4 space-y-2 sm:hidden">
          {report.subjectLines.map((line) => (
            <div key={line.subjectId} className="rounded-lg border border-slate-200 p-3">
              <p className="font-medium text-slate-900">{line.subjectName}</p>
              <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                <label className="text-xs text-slate-500">
                  Score / 100
                  {line.canEdit ? (
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step={1}
                      value={scores[line.subjectId] ?? String(line.score)}
                      onChange={(event) => setScores((value) => ({ ...value, [line.subjectId]: event.target.value }))}
                      className="mt-1 w-full rounded-md border border-slate-300 px-2 py-2 text-sm text-slate-900"
                    />
                  ) : <span className="mt-1 block text-sm font-semibold text-slate-900">{line.score}</span>}
                </label>
                {kind === "MOCK" ? (
                  <div className="text-xs text-slate-500">Grade / remark
                    <span className="mt-1 block text-sm font-semibold text-slate-900">{line.grade ?? "—"} · {line.remark ?? "—"}</span>
                  </div>
                ) : null}
              </div>
              {line.canEdit ? (
                <button type="button" disabled={pending} onClick={() => save(line.subjectId)} className="mt-2 w-full rounded-lg bg-sky-700 px-3 py-2 text-sm font-medium text-white disabled:opacity-50">
                  Save {line.subjectName}
                </button>
              ) : null}
            </div>
          ))}
        </div>

        <div className="mt-4 hidden overflow-x-auto rounded-lg border border-slate-200 sm:block">
          <table className="w-full min-w-[440px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-600">
              <tr>
                <th className="px-3 py-2">Subject</th>
                <th className="px-3 py-2">Score / 100</th>
                {kind === "MOCK" ? <><th className="px-3 py-2">Grade</th><th className="px-3 py-2">Remark</th></> : null}
                {report.subjectLines.some((line) => line.canEdit) ? <th className="px-3 py-2">Action</th> : null}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {report.subjectLines.map((line) => (
                <tr key={line.subjectId}>
                  <td className="px-3 py-2 font-medium text-slate-900">{line.subjectName}</td>
                  <td className="px-3 py-2">
                    {line.canEdit ? (
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step={1}
                        value={scores[line.subjectId] ?? String(line.score)}
                        onChange={(event) => setScores((value) => ({ ...value, [line.subjectId]: event.target.value }))}
                        className="w-24 rounded-md border border-slate-300 px-2 py-1.5"
                      />
                    ) : line.score}
                  </td>
                  {kind === "MOCK" ? <><td className="px-3 py-2">{line.grade ?? "—"}</td><td className="px-3 py-2">{line.remark ?? "—"}</td></> : null}
                  {line.canEdit ? <td className="px-3 py-2"><button type="button" disabled={pending} onClick={() => save(line.subjectId)} className="rounded-md bg-sky-700 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50">Save</button></td> : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div className="rounded-lg border border-slate-200 p-3">
            <p className="text-xs text-slate-500">Total score</p>
            <p className="mt-1 text-lg font-bold text-slate-900">{report.totalScore}</p>
          </div>
          {kind === "MOCK" ? (
            <>
              <div className="rounded-lg border border-slate-200 p-3">
                <p className="text-xs text-slate-500">Overall percentage</p>
                <p className="mt-1 text-lg font-bold text-slate-900">{report.overallPercentage == null ? "—" : `${report.overallPercentage.toFixed(1)}%`}</p>
              </div>
              <div className="rounded-lg border border-slate-200 p-3">
                <p className="text-xs text-slate-500">Overall grade</p>
                <p className="mt-1 text-lg font-bold text-slate-900">{report.overallGrade ?? "—"}</p>
              </div>
              <div className="rounded-lg border border-slate-200 p-3">
                <p className="text-xs text-slate-500">Overall remark</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{report.overallRemark ?? "—"}</p>
              </div>
            </>
          ) : null}
        </div>

        {kind === "MOCK" ? (
          <details className="mt-4 rounded-lg border border-slate-200 p-3">
            <summary className="cursor-pointer text-sm font-semibold text-slate-800">Grading system reference</summary>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[300px] text-left text-xs">
                <thead className="bg-slate-50"><tr><th className="px-2 py-2">Score range</th><th className="px-2 py-2">Grade</th><th className="px-2 py-2">Remark</th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {report.gradingScaleEntries.map((entry) => (
                    <tr key={`${entry.minScore}-${entry.maxScore}-${entry.grade}`}>
                      <td className="px-2 py-2">{entry.minScore}–{entry.maxScore}%</td><td className="px-2 py-2">{entry.grade}</td><td className="px-2 py-2">{entry.remark}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        ) : null}

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${report.isPublished ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"}`}>
            {report.isPublished ? "Published" : "In progress"}
          </span>
          {canPublish && !report.isPublished ? (
            <button type="button" disabled={pending} onClick={publish} className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
              Publish report
            </button>
          ) : null}
        </div>
      </div>
      </div>
    </details>
  );
}

export default function AssessmentResultsPanel({
  kind,
  ctx,
}: {
  kind: AssessmentKind;
  ctx: ResultsPageContext;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedMidTermClasses, setSelectedMidTermClasses] = useState<number[]>([]);
  const [yearId, setYearId] = useState(String(ctx.activeYearId ?? ""));
  const [termNumber, setTermNumber] = useState("1");
  const [filterClass, setFilterClass] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [filterTerm, setFilterTerm] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [exportingMock, setExportingMock] = useState<string | null>(null);

  const filtered = useMemo(
    () =>
      ctx.assessments.filter((report) => {
        if (report.type !== kind) return false;
        if (filterClass && String(report.classId) !== filterClass) return false;
        if (filterYear && String(report.academicYearId) !== filterYear) return false;
        if (filterTerm && String(report.termNumber) !== filterTerm) return false;
        return true;
      }),
    [ctx.assessments, filterClass, filterYear, filterTerm, kind]
  );

  const classGroups = useMemo(() => {
    const map = new Map<number, {
      classId: number;
      className: string;
      assessments: Map<string, AssessmentReportRow[]>;
    }>();
    for (const report of filtered) {
      const classGroup = map.get(report.classId) ?? {
        classId: report.classId,
        className: report.className,
        assessments: new Map<string, AssessmentReportRow[]>(),
      };
      const key = `${report.academicYearId}:${report.termNumber}:${report.assessmentNumber}`;
      const group = classGroup.assessments.get(key) ?? [];
      group.push(report);
      classGroup.assessments.set(key, group);
      map.set(report.classId, classGroup);
    }
    return Array.from(map.values()).map((classGroup) => ({
      ...classGroup,
      assessments: Array.from(classGroup.assessments.values()),
    }));
  }, [filtered]);

  const createMidTerms = () => {
    startTransition(async () => {
      const result = await createMidTermReports({
        classIds: selectedMidTermClasses,
        academicYearId: Number(yearId),
        termNumber: Number(termNumber),
      });
      if (result.success) {
        toast.success(`Created ${result.created ?? 0} mid-term report(s).`);
        router.refresh();
      } else {
        toast.error(result.error || "Could not create mid-term reports.");
      }
    });
  };

  const createMock = () => {
    startTransition(async () => {
      const result = await createMockReports({
        classId: Number(selectedClassId),
        academicYearId: Number(yearId),
        termNumber: Number(termNumber),
      });
      if (result.success) {
        toast.success(`Mock ${result.mockNumber} created for ${result.created ?? 0} student(s).`);
        router.refresh();
      } else {
        toast.error(result.error || "Could not create mock reports.");
      }
    });
  };

  const publishGroup = (reports: AssessmentReportRow[]) => {
    const report = reports[0];
    if (!report) return;
    startTransition(async () => {
      const result = await publishAssessmentReports({
        classId: report.classId,
        academicYearId: report.academicYearId,
        termNumber: report.termNumber,
        type: kind,
        assessmentNumber: report.assessmentNumber,
      });
      if (result.success) {
        toast.success(`Published ${result.updated ?? 0} report(s).`);
        router.refresh();
      } else {
        toast.error(result.error || "Could not publish reports.");
      }
    });
  };

  const exportMockGroup = async (reports: AssessmentReportRow[]) => {
    const first = reports[0];
    if (!first || kind !== "MOCK" || !ctx.isAdmin) return;

    const groupKey = `${first.classId}-${first.academicYearId}-${first.termNumber}-${first.assessmentNumber}`;
    setExportingMock(groupKey);
    try {
      const spreadsheetXml = createMockResultsSpreadsheetXml(reports);
      if (!spreadsheetXml) {
        toast.error("There are no mock results to export.");
        return;
      }

      const blob = new Blob([spreadsheetXml], {
        type: "application/vnd.ms-excel;charset=utf-8",
      });
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const filename = [
        first.className,
        `Mock-${first.assessmentNumber}`,
        first.academicYearLabel,
        `Term-${first.termNumber}`,
      ]
        .join("-")
        .replace(/[<>:"/\\|?*\u0000-\u001f]+/g, "-")
        .replace(/\s+/g, " ")
        .trim();
      link.href = downloadUrl;
      link.download = `${filename}.xls`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
      toast.success("Mock results spreadsheet exported.");
    } catch (error) {
      console.error("Failed to export mock results spreadsheet:", error);
      toast.error("Could not export mock results spreadsheet.");
    } finally {
      setExportingMock(null);
    }
  };

  const isAdmin = ctx.isAdmin;
  const canPublish = isAdmin;

  return (
    <section className="space-y-5">
      {isAdmin ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <h2 className="text-lg font-semibold text-slate-900">
            {kind === "MID_TERM" ? "Set up mid-term examinations" : "Create a mock examination"}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Select the academic year and term. Teachers can enter subject scores after reports are created.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <label className="text-sm font-medium text-slate-700">
              Academic year
              <select value={yearId} onChange={(event) => setYearId(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5">
                <option value="">Select year</option>
                {ctx.academicYears.map((year) => <option key={year.id} value={year.id}>{year.label}</option>)}
              </select>
            </label>
            <label className="text-sm font-medium text-slate-700">
              Term
              <select value={termNumber} onChange={(event) => setTermNumber(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5">
                {(ctx.academicYears.find((year) => String(year.id) === yearId)?.terms ?? []).map((term) => (
                  <option key={term.termNumber} value={term.termNumber}>Term {term.termNumber}</option>
                ))}
              </select>
            </label>
            {kind === "MOCK" ? (
              <label className="text-sm font-medium text-slate-700">
                Class
                <select value={selectedClassId} onChange={(event) => setSelectedClassId(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5">
                  <option value="">Select class</option>
                  {ctx.classes.map((cls) => <option key={cls.id} value={cls.id}>{cls.name}</option>)}
                </select>
              </label>
            ) : null}
          </div>

          {kind === "MID_TERM" ? (
            <fieldset className="mt-4">
              <legend className="mb-2 text-sm font-medium text-slate-700">Classes taking part</legend>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {ctx.classes.map((cls) => (
                  <label key={cls.id} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={selectedMidTermClasses.includes(cls.id)}
                      onChange={(event) => setSelectedMidTermClasses((current) =>
                        event.target.checked
                          ? [...current, cls.id]
                          : current.filter((id) => id !== cls.id)
                      )}
                    />
                    {cls.name}
                  </label>
                ))}
              </div>
            </fieldset>
          ) : null}

          <button
            type="button"
            disabled={pending || !yearId || !termNumber || (kind === "MID_TERM" ? !selectedMidTermClasses.length : !selectedClassId)}
            onClick={kind === "MID_TERM" ? createMidTerms : createMock}
            className="mt-4 w-full rounded-lg bg-sky-700 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50 sm:w-auto"
          >
            {pending ? "Creating…" : kind === "MID_TERM" ? "Create mid-term reports" : "Create new mock"}
          </button>
        </div>
      ) : null}

      <div className="flex justify-end xl:hidden">
        <button
          type="button"
          onClick={() => setFiltersOpen((isOpen) => !isOpen)}
          aria-expanded={filtersOpen}
          aria-controls="assessment-result-filters"
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 shadow-sm"
        >
          <Image src="/filter.svg" alt="" width={16} height={16} />
          Filters
        </button>
      </div>
      <div
        id="assessment-result-filters"
        className={`${filtersOpen ? "grid" : "hidden"} gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-3 xl:grid`}
      >
        <label className="text-sm font-medium text-slate-700">
          Class
          <select value={filterClass} onChange={(event) => setFilterClass(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5">
            <option value="">All classes</option>
            {ctx.classes.map((cls) => <option key={cls.id} value={cls.id}>{cls.name}</option>)}
          </select>
        </label>
        <label className="text-sm font-medium text-slate-700">
          Academic year
          <select value={filterYear} onChange={(event) => setFilterYear(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5">
            <option value="">All years</option>
            {ctx.academicYears.map((year) => <option key={year.id} value={year.id}>{year.label}</option>)}
          </select>
        </label>
        <label className="text-sm font-medium text-slate-700">
          Term
          <select value={filterTerm} onChange={(event) => setFilterTerm(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5">
            <option value="">All terms</option>
            {ctx.academicYears.find((year) => String(year.id) === filterYear)?.terms.map((term) => (
              <option key={term.termNumber} value={term.termNumber}>Term {term.termNumber}</option>
            )) ?? [1, 2, 3].map((term) => <option key={term} value={term}>Term {term}</option>)}
          </select>
        </label>
      </div>

      {classGroups.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-12 text-center text-sm text-slate-500">
          {kind === "MID_TERM" ? "No mid-term reports are available for the selected filters." : "No mock results are available for the selected filters."}
        </div>
      ) : classGroups.map((classGroup) => {
        const studentCount = classGroup.assessments.reduce(
          (count, group) => count + group.length,
          0
        );
        return (
          <details key={classGroup.classId} className="group rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
              <span>
                <span className="block font-semibold text-slate-900">{classGroup.className}</span>
                <span className="mt-1 block text-xs text-slate-500">
                  {classGroup.assessments.length} assessment group(s) · {studentCount} student report(s)
                </span>
              </span>
              <span aria-hidden="true" className="shrink-0 text-slate-500 transition-transform group-open:rotate-180">⌄</span>
            </summary>
            <div className="mt-4 space-y-4 border-t border-slate-100 pt-4">
              {classGroup.assessments.map((group) => {
                const first = group[0];
                if (!first) return null;
                const allPublished = group.every((report) => report.isPublished);
                return (
                  <section key={`${first.academicYearId}-${first.termNumber}-${first.assessmentNumber}`} className="space-y-3">
                    <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h3 className="font-semibold text-slate-900">
                          {first.academicYearLabel} · Term {first.termNumber}
                          {kind === "MOCK" ? ` · Mock ${first.assessmentNumber}` : ""}
                        </h3>
                        <p className="mt-1 text-xs text-slate-500">{group.length} student report(s)</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {kind === "MOCK" && isAdmin ? (
                          <button
                            type="button"
                            disabled={exportingMock !== null}
                            onClick={() => void exportMockGroup(group)}
                            className="inline-flex items-center justify-center gap-2 rounded-lg border border-sky-200 bg-white px-4 py-2 text-sm font-medium text-sky-800 hover:bg-sky-50 disabled:opacity-50"
                          >
                            {exportingMock === `${first.classId}-${first.academicYearId}-${first.termNumber}-${first.assessmentNumber}`
                              ? "Exporting…"
                              : "Export spreadsheet"}
                          </button>
                        ) : null}
                        {canPublish && !allPublished ? (
                          <button type="button" disabled={pending} onClick={() => publishGroup(group)} className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
                            Publish all for this class
                          </button>
                        ) : null}
                      </div>
                    </div>
                    <div className="space-y-2">
                      {group.map((report) => (
                        <AssessmentReportCard
                          key={report.id}
                          report={report}
                          kind={kind}
                          school={ctx.schoolSettings}
                          canPublish={canPublish}
                        />
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          </details>
        );
      })}
    </section>
  );
}
